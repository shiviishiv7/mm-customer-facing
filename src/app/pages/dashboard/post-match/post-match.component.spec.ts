import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PostMatchComponent } from './post-match.component';
import { PostService, PostAnalyzeResponse } from '@core/services/post.service';
import { PostMatchService, MatchNotification } from '@core/services/post-match.service';
import { WebSocketConnectionService } from '@core/services/web-socket-connection.service';

// ── helpers ────────────────────────────────────────────────────────────────

function stubAnalyzeResponse(): PostAnalyzeResponse {
  return {
    inferredCategory: null as any,
    categoryDisplayName: 'Matrimony',
    questions: [
      { id: 'q1', question: 'Your religion?', type: 'text', options: [], placeholder: '' },
    ],
  };
}

// ── suite ──────────────────────────────────────────────────────────────────

describe('PostMatchComponent', () => {
  let component: PostMatchComponent;
  let fixture: ComponentFixture<PostMatchComponent>;

  let postServiceSpy: jasmine.SpyObj<PostService>;
  let matchNotification$: Subject<MatchNotification | null>;
  let postMatchServiceStub: Partial<PostMatchService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    matchNotification$ = new Subject();

    postServiceSpy = jasmine.createSpyObj('PostService', ['analyze', 'submit']);
    postMatchServiceStub = {
      notification$: matchNotification$.asObservable(),
      connect:    jasmine.createSpy('connect'),
      reset:      jasmine.createSpy('reset'),
      disconnect: jasmine.createSpy('disconnect'),
    };
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PostMatchComponent, NoopAnimationsModule],
      providers: [
        { provide: PostService,                useValue: postServiceSpy },
        { provide: PostMatchService,           useValue: postMatchServiceStub },
        { provide: WebSocketConnectionService, useValue: { connect: () => {} } },
        { provide: Router,                     useValue: routerSpy },
        // Let MatSnackBar be overridden so we can use it via TestBed.inject
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture   = TestBed.createComponent(PostMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── initial state ──────────────────────────────────────────────────────────

  it('TC-PM-C01: starts in writing state', () => {
    expect(component.viewState).toBe('writing');
  });

  it('TC-PM-C02: isPostValid is false when postText is shorter than 50 chars', () => {
    component.postText = 'Short';
    expect(component.isPostValid).toBeFalse();
  });

  it('TC-PM-C03: isPostValid is true when postText is exactly 50 chars', () => {
    component.postText = 'a'.repeat(50);
    expect(component.isPostValid).toBeTrue();
  });

  // ── analyze ────────────────────────────────────────────────────────────────

  it('TC-PM-C04: analyze() does nothing when post is too short', () => {
    component.postText = 'Too short';
    component.analyze();
    expect(postServiceSpy.analyze).not.toHaveBeenCalled();
    expect(component.viewState).toBe('writing');
  });

  it('TC-PM-C05: analyze() ends in questions state with questionAnswers populated', fakeAsync(() => {
    component.postText = 'a'.repeat(60);
    postServiceSpy.analyze.and.returnValue(of({ statusCode: 200, data: stubAnalyzeResponse() } as any));

    component.analyze();
    tick();
    flush();

    expect(component.viewState).toBe('questions');
    expect(component.analyzeResult).toBeTruthy();
    expect(component.questionAnswers.length).toBe(1);
  }));

  it('TC-PM-C06: analyze() returns to writing on HTTP error', fakeAsync(() => {
    component.postText = 'a'.repeat(60);
    postServiceSpy.analyze.and.returnValue(throwError(() => new Error('Network error')));

    component.analyze();
    tick();
    flush();

    expect(component.viewState).toBe('writing');
  }));

  // ── submit ─────────────────────────────────────────────────────────────────

  it('TC-PM-C07: submit() ends in waiting state on success', fakeAsync(() => {
    component.postText = 'a'.repeat(60);
    component.questionAnswers = [];
    postServiceSpy.submit.and.returnValue(of({ statusCode: 200 } as any));

    component.submit();
    tick();
    flush();

    expect(component.viewState).toBe('waiting');
  }));

  it('TC-PM-C08: submit() returns to questions on HTTP error', fakeAsync(() => {
    component.postText = 'a'.repeat(60);
    component.questionAnswers = [];
    postServiceSpy.submit.and.returnValue(throwError(() => new Error('Server error')));

    component.submit();
    tick();
    flush();

    expect(component.viewState).toBe('questions');
  }));

  // ── notification handling ──────────────────────────────────────────────────

  it('TC-PM-C09: POST_MATCH_CONNECTING → state becomes connecting', fakeAsync(() => {
    component.viewState = 'waiting';
    matchNotification$.next({ event: 'POST_MATCH_CONNECTING', message: 'Connecting!' });
    tick();
    expect(component.viewState).toBe('connecting');
    flush(); // clear the 1.5s setTimeout
  }));

  it('TC-PM-C10: POST_MATCH_CONNECTING → navigates to scheduled-match after 1.5s', fakeAsync(() => {
    component.viewState = 'waiting';
    matchNotification$.next({ event: 'POST_MATCH_CONNECTING', message: 'Connecting!' });
    tick(1500);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/scheduled-match']);
    flush();
  }));

  it('TC-PM-C11: POST_NO_ACTIVE_MATCH → state becomes no-active-match', fakeAsync(() => {
    component.viewState = 'waiting';
    matchNotification$.next({ event: 'POST_NO_ACTIVE_MATCH', message: 'No one online.' });
    tick();
    expect(component.viewState).toBe('no-active-match');
    flush();
  }));

  it('TC-PM-C12: POST_NO_MATCH_FOUND → state becomes no-match', fakeAsync(() => {
    component.viewState = 'waiting';
    matchNotification$.next({ event: 'POST_NO_MATCH_FOUND', message: 'No candidates.' });
    tick();
    expect(component.viewState).toBe('no-match');
    flush();
  }));

  it('TC-PM-C13: notification while NOT in waiting state is ignored', fakeAsync(() => {
    component.viewState = 'questions';
    matchNotification$.next({ event: 'POST_MATCH_CONNECTING', message: 'Connecting!' });
    tick();
    expect(component.viewState).toBe('questions');
    flush();
  }));

  // ── reset ──────────────────────────────────────────────────────────────────

  it('TC-PM-C14: reset() clears all state and returns to writing', () => {
    component.postText = 'something';
    component.viewState = 'no-active-match';
    component.matchResult = { event: 'POST_NO_ACTIVE_MATCH', message: '' };

    component.reset();

    expect(component.viewState).toBe('writing');
    expect(component.postText).toBe('');
    expect(component.matchResult).toBeNull();
    expect(postMatchServiceStub.reset).toHaveBeenCalled();
  });
});
