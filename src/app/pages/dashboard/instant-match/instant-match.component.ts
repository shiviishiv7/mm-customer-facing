import {
  AfterViewInit, Component, ElementRef, inject,
  OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { PoolUser, WebRtcService } from '@core/services/web-rtc.service';
import { ChatService } from '@core/services/chat.service';
import { AuthService } from '@core/services/auth.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';
import { AvatarPickerComponent } from '@shared/avatar-picker/avatar-picker.component';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, MatButtonModule, MatIconModule, MatTooltipModule, AvatarPickerComponent],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatScroll') chatScrollRef?: ElementRef<HTMLDivElement>;

  webRtc   = inject(WebRtcService);
  chat     = inject(ChatService);
  auth     = inject(AuthService);
  private dialog = inject(MatDialog);

  poolUsers$    = this.webRtc.poolUsers$;
  callStatus$   = this.webRtc.callStatus$;
  chatMessages$ = this.chat.messages$;

  private currentPeerSub: string | null = null;
  private statusSub!: Subscription;

  ngOnInit(): void {
    this.webRtc.joinPool();

    // Track current peer so we can start chat when call goes live
    this.statusSub = this.webRtc.callStatus$.subscribe(status => {
      if (status === 'in-call') {
        this.chat.startChat(this.auth.sub);
      }
      if (status === 'idle') {
        this.chat.clearChat();
        this.currentPeerSub = null;
      }
    });
  }

  ngAfterViewInit(): void {
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
    });
    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
    });
    // Auto-scroll chat to bottom on new messages
    this.chat.messages$.subscribe(() => {
      setTimeout(() => {
        const el = this.chatScrollRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    });
  }

  openFilters(): void {
    this.dialog.open(MatchFilterDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { mode: 'instant' }
    });
  }

  connect(user: PoolUser): void {
    this.currentPeerSub = user.cognitoSub;
    this.webRtc.requestConnection(user.cognitoSub);
  }

  endCall(): void {
    this.chat.clearChat();
    this.webRtc.leavePool();
  }

  nextUser(): void {
    // Hang up current call then re-join pool to get fresh user list
    this.chat.clearChat();
    this.currentPeerSub = null;
    this.webRtc.leavePool();
    setTimeout(() => this.webRtc.joinPool(), 300);
  }

  sendChat(input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text) return;
    this.chat.send(text);
    input.value = '';
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.chat.clearChat();
    this.webRtc.leavePool();
  }
}
