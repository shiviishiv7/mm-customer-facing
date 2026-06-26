import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { PostMatchService, MatchNotification } from './post-match.service';
import { WebSocketConnectionService } from './web-socket-connection.service';

function currentValue<T>(obs: import('rxjs').Observable<T>): T {
  let val!: T;
  obs.pipe(take(1)).subscribe(v => val = v);
  return val;
}

describe('PostMatchService', () => {
  let service: PostMatchService;
  let stompSpy: jasmine.SpyObj<WebSocketConnectionService>;
  let matchSignals$: Subject<MatchNotification>;

  beforeEach(() => {
    matchSignals$ = new Subject<MatchNotification>();
    stompSpy = jasmine.createSpyObj('WebSocketConnectionService', ['connect', 'receiveData']);
    stompSpy.receiveData.and.returnValue(matchSignals$.asObservable());

    TestBed.configureTestingModule({
      providers: [
        PostMatchService,
        { provide: WebSocketConnectionService, useValue: stompSpy },
      ],
    });
    service = TestBed.inject(PostMatchService);
  });

  // TC-PM-S01
  it('TC-PM-S01: initial notification$ value is null', () => {
    expect(currentValue(service.notification$)).toBeNull();
  });

  // TC-PM-S02
  it('TC-PM-S02: connect() subscribes to /user/queue/matches', () => {
    service.connect();
    expect(stompSpy.receiveData).toHaveBeenCalledWith('/user/queue/matches');
  });

  // TC-PM-S03
  it('TC-PM-S03: connect() is idempotent — second call does not re-subscribe', () => {
    service.connect();
    service.connect();
    expect(stompSpy.receiveData).toHaveBeenCalledTimes(1);
  });

  // TC-PM-S04
  it('TC-PM-S04: forwards POST_MATCH_CONNECTING notification', () => {
    service.connect();
    const n: MatchNotification = { event: 'POST_MATCH_CONNECTING', message: 'Connecting now!' };
    matchSignals$.next(n);
    expect(currentValue(service.notification$)?.event).toBe('POST_MATCH_CONNECTING');
  });

  // TC-PM-S05
  it('TC-PM-S05: forwards POST_NO_ACTIVE_MATCH notification', () => {
    service.connect();
    matchSignals$.next({ event: 'POST_NO_ACTIVE_MATCH', message: 'Match saved, no one online.' });
    expect(currentValue(service.notification$)?.event).toBe('POST_NO_ACTIVE_MATCH');
  });

  // TC-PM-S06
  it('TC-PM-S06: forwards POST_NO_MATCH_FOUND notification', () => {
    service.connect();
    matchSignals$.next({ event: 'POST_NO_MATCH_FOUND', message: 'No candidates.' });
    expect(currentValue(service.notification$)?.event).toBe('POST_NO_MATCH_FOUND');
  });

  // TC-PM-S07
  it('TC-PM-S07: forwards MATCH_NOW_ONLINE notification', () => {
    service.connect();
    matchSignals$.next({ event: 'MATCH_NOW_ONLINE', matchedUserId: 'sub-b', message: 'Online now!' });
    const n = currentValue(service.notification$);
    expect(n?.event).toBe('MATCH_NOW_ONLINE');
    expect(n?.matchedUserId).toBe('sub-b');
  });

  // TC-PM-S08
  it('TC-PM-S08: reset() clears the notification to null', () => {
    service.connect();
    matchSignals$.next({ event: 'POST_NO_MATCH_FOUND', message: '' });
    service.reset();
    expect(currentValue(service.notification$)).toBeNull();
  });

  // TC-PM-S09
  it('TC-PM-S09: disconnect() stops forwarding notifications', () => {
    service.connect();
    service.disconnect();
    matchSignals$.next({ event: 'POST_MATCH_CONNECTING', message: '' });
    // After disconnect, value stays null (reset was not called but new values aren't forwarded)
    expect(currentValue(service.notification$)).toBeNull();
  });
});
