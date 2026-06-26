import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { ScheduledMatchComponent } from './scheduled-match.component';
import { ScheduledMatchService, ScheduledMatchState } from '@core/services/scheduled-match.service';
import { WebRtcService } from '@core/services/web-rtc.service';
import { MeetingService } from '@core/services/meeting.service';
import { MemeStreamService } from '@core/services/meme/meme-stream.service';

// ── suite ──────────────────────────────────────────────────────────────────

describe('ScheduledMatchComponent — feedback & next-match flow', () => {
  let component: ScheduledMatchComponent;
  let fixture: ComponentFixture<ScheduledMatchComponent>;

  let meetingServiceSpy: jasmine.SpyObj<MeetingService>;
  let webRtcSpy: jasmine.SpyObj<WebRtcService>;

  const state$     = new BehaviorSubject<ScheduledMatchState>('idle');
  const meetingId$ = new BehaviorSubject<string | null>('meeting-10');

  let scheduledMatchStub: any;

  beforeEach(async () => {
    scheduledMatchStub = {
      state$:     state$.asObservable(),
      meetingId$: meetingId$.asObservable(),
      matchId$:   new BehaviorSubject<string | null>('match-5').asObservable(),
      get currentMeetingId() { return 'meeting-10'; },
      connect:            jasmine.createSpy('connect'),
      disconnect:         jasmine.createSpy('disconnect'),
      joinWaitingRoom:    jasmine.createSpy('joinWaitingRoom').and.returnValue(Promise.resolve()),
      triggerWaitingRoom: jasmine.createSpy('triggerWaitingRoom'),
      endCall:            jasmine.createSpy('endCall'),
      resetToIdle:        jasmine.createSpy('resetToIdle'),
    };

    meetingServiceSpy = jasmine.createSpyObj('MeetingService', [
      'getUpcoming', 'submitFeedback', 'requestNextMatch',
    ]);
    meetingServiceSpy.getUpcoming.and.returnValue(of({ data: [] } as any));
    meetingServiceSpy.submitFeedback.and.returnValue(of({} as any));
    meetingServiceSpy.requestNextMatch.and.returnValue(
      of({ statusCode: 200, message: 'Connecting now', data: null } as any)
    );

    webRtcSpy = jasmine.createSpyObj('WebRtcService', [
      'connectForScheduledMatch', 'disconnectScheduledMatch',
    ]);
    (webRtcSpy as any).localStream$  = new BehaviorSubject(null);
    (webRtcSpy as any).remoteStream$ = new BehaviorSubject(null);

    await TestBed.configureTestingModule({
      imports: [ScheduledMatchComponent, NoopAnimationsModule],
      providers: [
        { provide: ScheduledMatchService, useValue: scheduledMatchStub },
        { provide: MeetingService,        useValue: meetingServiceSpy  },
        { provide: WebRtcService,         useValue: webRtcSpy          },
        { provide: MatDialog,             useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: MemeStreamService,     useValue: { activeMeme$: new BehaviorSubject(null) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture   = TestBed.createComponent(ScheduledMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── initial state ──────────────────────────────────────────────────────────

  it('TC-SM-C01: starts with feedbackSubmitted=false', () => {
    expect(component.feedbackSubmitted).toBeFalse();
  });

  it('TC-SM-C02: starts with nextMatchResult=null', () => {
    expect(component.nextMatchResult).toBeNull();
  });

  it('TC-SM-C03: ngOnInit loads upcoming meetings', () => {
    expect(meetingServiceSpy.getUpcoming).toHaveBeenCalled();
  });

  // ── endCall ────────────────────────────────────────────────────────────────

  it('TC-SM-C04: endCall() delegates to ScheduledMatchService.endCall', () => {
    component.endCall();
    expect(scheduledMatchStub.endCall).toHaveBeenCalled();
  });

  it('TC-SM-C05: endCall() resets feedbackSubmitted and nextMatchResult', () => {
    component.feedbackSubmitted = true;
    component.nextMatchResult = 'connecting';
    component.endCall();
    expect(component.feedbackSubmitted).toBeFalse();
    expect(component.nextMatchResult).toBeNull();
  });

  // ── submitFeedback ─────────────────────────────────────────────────────────

  it('TC-SM-C06: submitFeedback(YES) calls meetingService.submitFeedback with YES', fakeAsync(() => {
    component.submitFeedback('YES');
    tick();
    flush();
    expect(meetingServiceSpy.submitFeedback)
      .toHaveBeenCalledWith('meeting-10', 'YES', undefined);
  }));

  it('TC-SM-C07: submitFeedback(NO) calls meetingService.submitFeedback with NO', fakeAsync(() => {
    component.submitFeedback('NO');
    tick();
    flush();
    expect(meetingServiceSpy.submitFeedback)
      .toHaveBeenCalledWith('meeting-10', 'NO', undefined);
  }));

  it('TC-SM-C08: submitFeedback(YES) sets feedbackSubmitted=true on success', fakeAsync(() => {
    component.submitFeedback('YES');
    tick();
    flush();
    expect(component.feedbackSubmitted).toBeTrue();
  }));

  it('TC-SM-C09: submitFeedback passes optional notes when entered', fakeAsync(() => {
    component.feedbackNotes = 'Great chat!';
    component.submitFeedback('YES');
    tick();
    flush();
    expect(meetingServiceSpy.submitFeedback)
      .toHaveBeenCalledWith('meeting-10', 'YES', 'Great chat!');
  }));

  it('TC-SM-C10: submitFeedback on HTTP error keeps feedbackSubmitted=false', fakeAsync(() => {
    meetingServiceSpy.submitFeedback.and.returnValue(throwError(() => new Error('500')));
    component.submitFeedback('YES');
    tick();
    flush();
    // Error path must NOT set feedbackSubmitted
    expect(component.feedbackSubmitted).toBeFalse();
  }));

  it('TC-SM-C11: submitFeedback skips the HTTP call when meetingId is null', fakeAsync(() => {
    // Override currentMeetingId to null via component's service reference
    spyOnProperty(component.scheduledMatch, 'currentMeetingId').and.returnValue(null);
    component.submitFeedback('YES');
    tick();
    flush();
    expect(meetingServiceSpy.submitFeedback).not.toHaveBeenCalled();
  }));

  // ── requestNextMatch ───────────────────────────────────────────────────────

  it('TC-SM-C12: requestNextMatch calls meetingService.requestNextMatch', fakeAsync(() => {
    component.requestNextMatch();
    tick();
    flush();
    expect(meetingServiceSpy.requestNextMatch).toHaveBeenCalled();
  }));

  it('TC-SM-C13: "Connecting" response sets nextMatchResult=connecting', fakeAsync(() => {
    meetingServiceSpy.requestNextMatch.and.returnValue(
      of({ statusCode: 200, message: 'Connecting now' } as any)
    );
    component.requestNextMatch();
    tick();
    flush();
    expect(component.nextMatchResult).toBe('connecting');
    expect(component.requestingNext).toBeFalse();
  }));

  it('TC-SM-C14: Non-connecting response sets nextMatchResult=no-active', fakeAsync(() => {
    meetingServiceSpy.requestNextMatch.and.returnValue(
      of({ statusCode: 200, message: 'No active match' } as any)
    );
    component.requestNextMatch();
    tick();
    flush();
    expect(component.nextMatchResult).toBe('no-active');
  }));

  it('TC-SM-C15: requestNextMatch HTTP error leaves nextMatchResult null and requestingNext false', fakeAsync(() => {
    meetingServiceSpy.requestNextMatch.and.returnValue(throwError(() => new Error('500')));
    component.requestNextMatch();
    tick();
    flush();
    expect(component.requestingNext).toBeFalse();
    expect(component.nextMatchResult).toBeNull();
  }));

  // ── backToList ─────────────────────────────────────────────────────────────

  it('TC-SM-C16: backToList resets all feedback state', () => {
    component.feedbackSubmitted = true;
    component.nextMatchResult = 'no-active';
    component.backToList();
    expect(component.feedbackSubmitted).toBeFalse();
    expect(component.nextMatchResult).toBeNull();
  });

  it('TC-SM-C17: backToList calls scheduledMatch.resetToIdle', () => {
    component.backToList();
    expect(scheduledMatchStub.resetToIdle).toHaveBeenCalled();
  });

  it('TC-SM-C18: backToList reloads upcoming meetings', () => {
    meetingServiceSpy.getUpcoming.calls.reset();
    component.backToList();
    expect(meetingServiceSpy.getUpcoming).toHaveBeenCalled();
  });
});
