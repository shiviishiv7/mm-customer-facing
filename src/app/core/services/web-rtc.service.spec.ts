import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { WebRtcService, PoolUser, InstantSearchFilter, WebRTCSignal } from './web-rtc.service';
import { WebSocketConnectionService } from './web-socket-connection.service';
import { AuthService } from './auth.service';
import { MemeStreamService } from './meme/meme-stream.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function poolUser(sub: string): PoolUser {
  return { cognitoSub: sub, firstName: sub, lastName: '' };
}

function signal(type: WebRTCSignal['type'], from = 'peer-sub', to = 'me'): WebRTCSignal {
  return { type, fromUserId: from, toUserId: to, payload: '' };
}

/** Read the current value of a BehaviorSubject-backed observable synchronously. */
function currentValue<T>(obs: import('rxjs').Observable<T>): T {
  let val!: T;
  obs.pipe(take(1)).subscribe(v => val = v);
  return val;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WebRtcService', () => {
  let service: WebRtcService;
  let stompSpy: jasmine.SpyObj<WebSocketConnectionService>;
  let signalSubject: Subject<any>;

  beforeEach(() => {
    signalSubject = new Subject<any>();

    stompSpy = jasmine.createSpyObj('WebSocketConnectionService', [
      'connect', 'disconnect', 'publish', 'receiveData', 'unsubscribeAll',
    ]);
    stompSpy.receiveData.and.returnValue(signalSubject.asObservable());
    Object.defineProperty(stompSpy, 'isConnected', { get: () => true });

    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authSpy.sub = 'me';

    const memeSpy = jasmine.createSpyObj('MemeStreamService', ['start', 'stop']);
    memeSpy.activeMeme$ = new BehaviorSubject(null);
    memeSpy.start.and.callFake((s: MediaStream) => s);

    TestBed.configureTestingModule({
      providers: [
        WebRtcService,
        { provide: WebSocketConnectionService, useValue: stompSpy },
        { provide: AuthService,               useValue: authSpy  },
        { provide: MemeStreamService,          useValue: memeSpy  },
      ],
    });

    service = TestBed.inject(WebRtcService);
  });

  // TC-F01
  it('TC-F01: joinPool connects WebSocket and sends join message', () => {
    service.joinPool();
    expect(stompSpy.connect).toHaveBeenCalled();
    expect(stompSpy.publish).toHaveBeenCalledWith('/app/webrtc.join', {});
  });

  // TC-F02
  it('TC-F02: receiving pool list array sets first user as currentUser$', fakeAsync(() => {
    service.joinPool();
    signalSubject.next([poolUser('alice'), poolUser('bob')]);
    tick();
    expect(currentValue(service.currentUser$)?.cognitoSub).toBe('alice');
  }));

  // TC-F03
  it('TC-F03: empty pool list → currentUser$ emits null', fakeAsync(() => {
    service.joinPool();
    // Pre-set a user so we confirm it gets cleared
    signalSubject.next([poolUser('alice')]);
    tick();
    signalSubject.next([]);
    tick();
    expect(currentValue(service.currentUser$)).toBeNull();
  }));

  // TC-F04
  it('TC-F04: requestConnection publishes to /app/webrtc.request with toUserId', () => {
    service.joinPool();
    service.requestConnection('alice');
    expect(stompSpy.publish).toHaveBeenCalledWith(
      '/app/webrtc.request',
      jasmine.objectContaining({ toUserId: 'alice' })
    );
  });

  // TC-F05
  it('TC-F05: requestConnection sets callStatus$ to "calling"', fakeAsync(() => {
    service.joinPool();
    service.requestConnection('alice');
    expect(currentValue(service.callStatus$)).toBe('calling');
    tick(5000); // clear pending timeout
  }));

  // TC-F06
  it('TC-F06: request timeout advances queue to next user after 5 seconds', fakeAsync(() => {
    service.joinPool();
    signalSubject.next([poolUser('alice'), poolUser('bob')]);
    tick();
    service.requestConnection('alice');
    tick(5000);
    expect(currentValue(service.currentUser$)?.cognitoSub).toBe('bob');
  }));

  // TC-F07
  it('TC-F07: BUSY signal skips current user and shows next immediately', fakeAsync(() => {
    service.joinPool();
    signalSubject.next([poolUser('alice'), poolUser('bob')]);
    tick();
    service.requestConnection('alice');
    signalSubject.next(signal('BUSY', 'alice'));
    tick();
    expect(currentValue(service.currentUser$)?.cognitoSub).toBe('bob');
  }));

  // TC-F08
  it('TC-F08: BUSY signal resets callStatus$ back to idle', fakeAsync(() => {
    service.joinPool();
    signalSubject.next([poolUser('alice'), poolUser('bob')]);
    tick();
    service.requestConnection('alice');
    signalSubject.next(signal('BUSY', 'alice'));
    tick();
    expect(currentValue(service.callStatus$)).toBe('idle');
  }));

  // TC-F09
  it('TC-F09: when queue exhausted after BUSY, joinPool is called again', fakeAsync(() => {
    service.joinPool();
    stompSpy.publish.calls.reset();
    signalSubject.next([poolUser('alice')]);
    tick();
    service.requestConnection('alice');
    signalSubject.next(signal('BUSY', 'alice'));
    tick();
    expect(stompSpy.publish).toHaveBeenCalledWith('/app/webrtc.join', {});
  }));

  // TC-F10
  it('TC-F10: NO_MATCH_NOW signal sets waitingForMatch$ to true', fakeAsync(() => {
    service.joinPool();
    signalSubject.next(signal('NO_MATCH_NOW', 'server'));
    tick();
    expect(currentValue(service.waitingForMatch$)).toBeTrue();
  }));

  // TC-F11
  it('TC-F11: new pool list received clears waitingForMatch$ flag', fakeAsync(() => {
    service.joinPool();
    signalSubject.next(signal('NO_MATCH_NOW', 'server'));
    tick();
    signalSubject.next([poolUser('carol')]);
    tick();
    expect(currentValue(service.waitingForMatch$)).toBeFalse();
  }));

  // TC-F12
  it('TC-F12: single PoolUser object push sets it as currentUser (MATCH_FOUND path)', fakeAsync(() => {
    service.joinPool();
    signalSubject.next(signal('NO_MATCH_NOW', 'server'));
    tick();
    signalSubject.next({ cognitoSub: 'dave', firstName: 'dave', lastName: '' });
    tick();
    expect(currentValue(service.currentUser$)?.cognitoSub).toBe('dave');
  }));

  // TC-F13
  it('TC-F13: searchPool publishes filter to /app/webrtc.search', () => {
    service.joinPool();
    const filter: InstantSearchFilter = { preferredGender: 'FEMALE', preferredCity: 'Mumbai' };
    service.searchPool(filter);
    expect(stompSpy.publish).toHaveBeenCalledWith('/app/webrtc.search', filter);
  });

  // TC-F14
  it('TC-F14: searchPool with childCategory sends childCategory in payload', () => {
    service.joinPool();
    const filter: InstantSearchFilter = { childCategory: 'MENTORSHIP', preferredGender: 'MALE' };
    service.searchPool(filter);
    expect(stompSpy.publish).toHaveBeenCalledWith(
      '/app/webrtc.search',
      jasmine.objectContaining({ childCategory: 'MENTORSHIP' })
    );
  });

  // TC-F15
  it('TC-F15: receiving OFFER cancels the 5s skip timeout', fakeAsync(() => {
    service.joinPool();
    signalSubject.next([poolUser('alice'), poolUser('bob')]);
    tick();
    service.requestConnection('alice');

    spyOn(service as any, 'handleOfferAndSendAnswer').and.returnValue(Promise.resolve());
    signalSubject.next(signal('OFFER', 'alice'));
    tick(5000); // timeout would fire here if not cancelled

    // Still on alice (in-call) — queue did not advance
    expect(currentValue(service.currentUser$)?.cognitoSub).toBe('alice');
  }));

  // TC-F16
  it('TC-F16: CONNECTION_REQUEST while in-call triggers reportBusy to the requester', () => {
    service.joinPool();
    (service as any)._callStatus$.next('in-call');
    signalSubject.next(signal('CONNECTION_REQUEST', 'carol', 'me'));
    expect(stompSpy.publish).toHaveBeenCalledWith(
      '/app/webrtc.busy',
      jasmine.objectContaining({ toUserId: 'carol' })
    );
  });

  // TC-F17
  it('TC-F17: PEER_LEFT signal sets callStatus$ to "ended"', fakeAsync(() => {
    service.joinPool();
    signalSubject.next(signal('PEER_LEFT', 'peer-sub'));
    tick();
    expect(currentValue(service.callStatus$)).toBe('ended');
  }));

  // TC-F18
  it('TC-F18: leavePool publishes to /app/webrtc.leave', () => {
    service.joinPool();
    service.leavePool();
    expect(stompSpy.publish).toHaveBeenCalledWith(
      '/app/webrtc.leave',
      jasmine.anything()
    );
  });
});
