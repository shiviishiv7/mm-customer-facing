import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketConnectionService } from './web-socket-connection.service';

export interface MatchNotification {
  event: 'POST_MATCH_FOUND' | 'POST_NO_MATCH_FOUND' | 'POST_MATCH_ERROR';
  matchedUserId?: string;
  matchedUserName?: string;
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
