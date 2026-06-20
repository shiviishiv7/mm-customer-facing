import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebRtcService } from './web-rtc.service';

export interface ChatMessage {
  fromUserId: string;
  message: string;
  sentByMe: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {

  private webRtc = inject(WebRtcService);

  private _messages$ = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this._messages$.asObservable();

  private mySub: string | null = null;
  private channelSub: Subscription | null = null;

  startChat(mySub: string): void {
    if (this.channelSub) return; // already listening — don't create a second subscription

    this.mySub = mySub;
    this._messages$.next([]);

    this.channelSub = this.webRtc.dataChannel$.subscribe(event => {
      try {
        const payload = JSON.parse(event.data as string) as { fromUserId: string; message: string };
        const msgs = this._messages$.getValue();
        this._messages$.next([...msgs, {
          fromUserId: payload.fromUserId,
          message: payload.message,
          sentByMe: false,
          timestamp: new Date()
        }]);
      } catch {
        console.warn('[Chat] Could not parse DataChannel message', event.data);
      }
    });
  }

  send(text: string): void {
    if (!text.trim() || !this.mySub) return;

    const payload = JSON.stringify({ fromUserId: this.mySub, message: text.trim() });
    const sent = this.webRtc.sendChatMessage(payload);

    if (sent) {
      const msgs = this._messages$.getValue();
      this._messages$.next([...msgs, {
        fromUserId: this.mySub,
        message: text.trim(),
        sentByMe: true,
        timestamp: new Date()
      }]);
    }
  }

  clearChat(): void {
    this.channelSub?.unsubscribe();
    this.channelSub = null;
    this.mySub = null;
    this._messages$.next([]);
  }
}
