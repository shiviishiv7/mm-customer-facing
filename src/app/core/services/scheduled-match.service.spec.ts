import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ScheduledMatchService, MeetingNotification } from './scheduled-match.service';
import { WebSocketConnectionService } from './web-socket-connection.service';
import { WebRtcService } from './web-rtc.service';
import { AuthService } from './auth.service';

function makeNotification(
  type: MeetingNotification['type'],
  extra: Partial<MeetingNotification> = {}
): MeetingNotification {
  return { type, meetingId: 'm1', matchId: 'mx1', ...extra };
}

function currentValue<T>(obs: import('rxjs').Observable<T>): T {
  let val!: T;
  obs.pipe(take(1)).subscribe(v => val = v);
  return val;
}

describe('ScheduledMatchService', () => {
  let service: ScheduledMatchService;
  let stompSpy: jasmine.SpyObj<WebSocketConnectionService>;
  let webRtcSpy: jasmine.SpyObj<WebRtcService>;
  let meetingSignals$: Subject<MeetingNotification>;

  beforeEach(() => {
    meetingSignals$ = new Subject<MeetingNotification>();

    stompSpy = jasmine.createSpyObj('WebSocketConnectionService', [
      'connect', 'publish', 'receiveData',
    ]);
    stompSpy.receiveData.and.returnValue(meetingSignals$.asObservable());

    webRtcSpy = jasmine.createSpyObj('WebRtcService', [
      'connectForScheduledMatch', 'disconnectScheduledMatch',
      'startLocalCamera', 'initiateScheduledCall',
    ]);
    webRtcSpy.startLocalCamera.and.returnValue(Promise.resolve());
    webRtcSpy.initiateScheduledCall.and.returnValue(Promise.resolve());
    (webRtcSpy as any).localStream$  = new BehaviorSubject(null);
    (webRtcSpy as any).remoteStream$ = new BehaviorSubject(null);

    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authSpy.sub = 'sub-me';

    TestBed.configureTestingModule({
      providers: [
        ScheduledMatchService,
        { provide: WebSocketConnectionService, useValue: stompSpy  },
        { provide: WebRtcService,              useValue: webRtcSpy },
        { provide: AuthService,                useValue: authSpy   },
      ],
    });

    service = TestBed.inject(ScheduledMatchService);
  });

  // TC-SC01
  it('TC-SC01: connect() calls connectForScheduledMatch and subscribes to meeting queue', () => {
    service.connect();
    expect(webRtcSpy.connectForScheduledMatch).toHaveBeenCalled();
    expect(stompSpy.receiveData).toHaveBeenCalledWith('/user/queue/meeting');
  });

  // TC-SC02
  it('TC-SC02: connect() is idempotent — second call does nothing', () => {
    service.connect();
    service.connect();
    expect(webRtcSpy.connectForScheduledMatch).toHaveBeenCalledTimes(1);
  });

  // TC-SC03
  it('TC-SC03: WAITING_ROOM notification transitions state to waiting-room', fakeAsync(() => {
    service.connect();
    meetingSignals$.next(makeNotification('WAITING_ROOM'));
    tick();
    expect(currentValue(service.state$)).toBe('waiting-room');
    expect(currentValue(service.meetingId$)).toBe('m1');
  }));

  // TC-SC04
  it('TC-SC04: WAITING_FOR_PEER notification transitions state to waiting-for-peer', fakeAsync(() => {
    service.connect();
    meetingSignals$.next(makeNotification('WAITING_FOR_PEER'));
    tick();
    expect(currentValue(service.state$)).toBe('waiting-for-peer');
  }));

  // TC-SC05
  it('TC-SC05: INITIATE_WEBRTC transitions to in-call and calls initiateScheduledCall', fakeAsync(() => {
    service.connect();
    meetingSignals$.next(makeNotification('INITIATE_WEBRTC', { peerUserId: 'peer-sub' }));
    tick(); // flush async initiateScheduledCall
    expect(currentValue(service.state$)).toBe('in-call');
    expect(webRtcSpy.initiateScheduledCall).toHaveBeenCalledWith('peer-sub');
  }));

  // TC-SC06
  it('TC-SC06: PEER_READY notification transitions to in-call', fakeAsync(() => {
    service.connect();
    meetingSignals$.next(makeNotification('PEER_READY'));
    tick();
    expect(currentValue(service.state$)).toBe('in-call');
  }));

  // TC-SC07
  it('TC-SC07: triggerWaitingRoom sets meetingId, matchId and state to waiting-room', () => {
    service.connect();
    service.triggerWaitingRoom('meeting-42', 'match-7');
    expect(currentValue(service.state$)).toBe('waiting-room');
    expect(currentValue(service.meetingId$)).toBe('meeting-42');
  });

  // TC-SC08
  it('TC-SC08: joinWaitingRoom starts local camera and sends join-waiting-room message', fakeAsync(() => {
    service.connect();
    service.triggerWaitingRoom('m1', 'mx1');
    service.joinWaitingRoom();
    tick();
    expect(webRtcSpy.startLocalCamera).toHaveBeenCalled();
    expect(stompSpy.publish).toHaveBeenCalledWith(
      '/app/meeting/join-waiting-room',
      jasmine.objectContaining({ meetingId: 'm1' })
    );
  }));

  // TC-SC09
  it('TC-SC09: joinWaitingRoom does nothing when meetingId is null', fakeAsync(() => {
    service.connect();
    // Do NOT call triggerWaitingRoom — meetingId stays null
    service.joinWaitingRoom();
    tick();
    expect(webRtcSpy.startLocalCamera).not.toHaveBeenCalled();
    expect(stompSpy.publish).not.toHaveBeenCalled();
  }));

  // TC-SC10
  it('TC-SC10: endCall calls disconnectScheduledMatch and sets state to ended', () => {
    service.connect();
    service.endCall();
    expect(webRtcSpy.disconnectScheduledMatch).toHaveBeenCalled();
    expect(currentValue(service.state$)).toBe('ended');
  });

  // TC-SC11
  it('TC-SC11: resetToIdle clears meetingId and resets state to idle', () => {
    service.connect();
    service.triggerWaitingRoom('m1', 'mx1');
    service.resetToIdle();
    expect(currentValue(service.state$)).toBe('idle');
    expect(currentValue(service.meetingId$)).toBeNull();
  });

  // TC-SC12
  it('TC-SC12: currentMeetingId returns null before any meeting is set', () => {
    service.connect();
    expect(service.currentMeetingId).toBeNull();
  });

  // TC-SC13
  it('TC-SC13: currentMeetingId returns the active meetingId after triggerWaitingRoom', () => {
    service.connect();
    service.triggerWaitingRoom('meeting-99', 'match-7');
    expect(service.currentMeetingId).toBe('meeting-99');
  });

  // TC-SC14
  it('TC-SC14: currentMeetingId returns null after resetToIdle', () => {
    service.connect();
    service.triggerWaitingRoom('meeting-99', 'match-7');
    service.resetToIdle();
    expect(service.currentMeetingId).toBeNull();
  });

  // TC-SC15
  it('TC-SC15: currentMeetingId is set from WAITING_ROOM notification', fakeAsync(() => {
    service.connect();
    meetingSignals$.next(makeNotification('WAITING_ROOM', { meetingId: 'ws-meeting-5' }));
    tick();
    expect(service.currentMeetingId).toBe('ws-meeting-5');
  }));
});
