import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketConnectionService } from './web-socket-connection.service';

export interface MatchNotification {
  event:
    | 'POST_MATCH_CONNECTING'   // match found AND candidate is online — WebRTC starting on /queue/meeting
    | 'POST_MATCH_FOUND'        // reverse-notified: a new submitter matched this waiting user
    | 'POST_NO_ACTIVE_MATCH'    // match saved, no one online right now — emails sent
    | 'POST_NO_MATCH_FOUND'     // no candidates at all
    | 'POST_MATCH_ERROR'        // something went wrong
    | 'MATCH_NOW_ONLINE';       // a previously saved match just came online
  matchedUserId?: string;
  matchedUserName?: string;
  matchId?: string;
  compatibilityScore?: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PostMatchService implements OnDestroy {
  private stomp = inject(WebSocketConnectionService);

  private _notification$ = new BehaviorSubject<MatchNotification | null>(null);
  public notification$ = this._notification$.asObservable();

  private sub!: Subscription;
  private connected = false;

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.sub = this.stomp
      .receiveData<MatchNotification>('/user/queue/matches')
      .subscribe(n => this._notification$.next(n));
  }

  reset(): void {
    this._notification$.next(null);
  }

  disconnect(): void {
    this.sub?.unsubscribe();
    this.connected = false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
