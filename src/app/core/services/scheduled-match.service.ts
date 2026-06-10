import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketConnectionService } from './web-socket-connection.service';
import { WebRtcService } from './web-rtc.service';
import { AuthService } from './auth.service';

export type ScheduledMatchState =
  | 'idle'            // no active meeting notification
  | 'waiting-room'    // server opened waiting room, user should click Join
  | 'waiting-for-peer' // joined, waiting for other user
  | 'in-call'         // WebRTC call is live
  | 'ended';          // call finished

export interface MeetingNotification {
  type: 'WAITING_ROOM' | 'WAITING_FOR_PEER' | 'INITIATE_WEBRTC' | 'PEER_READY';
  meetingId: string;
  matchId: string;
  peerUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduledMatchService implements OnDestroy {

  private stomp   = inject(WebSocketConnectionService);
  private webRtc  = inject(WebRtcService);
  private auth    = inject(AuthService);

  private _state$     = new BehaviorSubject<ScheduledMatchState>('idle');
  private _meetingId$ = new BehaviorSubject<string | null>(null);
  private _matchId$   = new BehaviorSubject<string | null>(null);

  public state$     = this._state$.asObservable();
  public meetingId$ = this._meetingId$.asObservable();
  public matchId$   = this._matchId$.asObservable();

  private meetingSub!: Subscription;
  private connected = false;

  /**
   * Connect WebSocket and subscribe to /user/queue/meeting.
   * Also sets up WebRTC signal listener so the call works seamlessly.
   * Safe to call multiple times — won't double-connect.
   */
  connect(): void {
    if (this.connected) return;
    this.connected = true;

    this.webRtc.connectForScheduledMatch();

    this.meetingSub = this.stomp
      .receiveData<MeetingNotification>('/user/queue/meeting')
      .subscribe(notification => this.handleNotification(notification));
  }

  /** Send join-waiting-room message and start local camera immediately. */
  async joinWaitingRoom(): Promise<void> {
    const meetingId = this._meetingId$.getValue();
    if (!meetingId) return;

    // Start camera now so user sees themselves while waiting for peer
    await this.webRtc.startLocalCamera();

    this.stomp.publish('/app/meeting/join-waiting-room', {
      meetingId,
      userId: this.auth.sub
    });

    this._state$.next('waiting-for-peer');
  }

  /** End the call and clean up. */
  endCall(): void {
    this.webRtc.disconnectScheduledMatch();
    this._state$.next('ended');
  }

  /** Disconnect everything — call from component ngOnDestroy. */
  disconnect(): void {
    this.meetingSub?.unsubscribe();
    this.connected = false;
  }

  private async handleNotification(n: MeetingNotification): Promise<void> {
    console.log('[ScheduledMatch] Notification:', n.type, n);

    switch (n.type) {

      case 'WAITING_ROOM':
        this._meetingId$.next(n.meetingId);
        this._matchId$.next(n.matchId);
        this._state$.next('waiting-room');
        break;

      case 'WAITING_FOR_PEER':
        this._state$.next('waiting-for-peer');
        break;

      case 'INITIATE_WEBRTC':
        // Server designated this user as the call initiator
        this._state$.next('in-call');
        await this.webRtc.initiateScheduledCall(n.peerUserId!);
        break;

      case 'PEER_READY':
        // Other user will send the OFFER — just wait; WebRtcService handles it
        this._state$.next('in-call');
        break;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
