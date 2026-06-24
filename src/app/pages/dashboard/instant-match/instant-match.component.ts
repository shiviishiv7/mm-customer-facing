import {
  AfterViewInit, Component, ElementRef, inject,
  OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { AsyncPipe, NgIf, SlicePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { PoolUser, WebRtcService } from '@core/services/web-rtc.service';
import { ChatService } from '@core/services/chat.service';
import { AuthService } from '@core/services/auth.service';
import { MemeStreamService } from '@core/services/meme/meme-stream.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';
import { MemePickerDialogComponent } from '@shared/meme-picker/meme-picker-dialog.component';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgIf, AsyncPipe, SlicePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatScroll')  chatScrollRef?: ElementRef<HTMLDivElement>;

  webRtc      = inject(WebRtcService);
  chat        = inject(ChatService);
  auth        = inject(AuthService);
  memeStream  = inject(MemeStreamService);
  private dialog = inject(MatDialog);

  currentUser$  = this.webRtc.currentUser$;
  callStatus$   = this.webRtc.callStatus$;
  chatMessages$ = this.chat.messages$;
  activeMeme$   = this.memeStream.activeMeme$;

  private currentPeerSub: string | null = null;
  private statusSub!: Subscription;

  ngOnInit(): void {
    this.webRtc.joinPool();
    this.statusSub = this.webRtc.callStatus$.subscribe(status => {
      if (status === 'in-call') this.chat.startChat(this.auth.sub);
      if (status === 'idle') { this.chat.clearChat(); this.currentPeerSub = null; }
    });
  }

  ngAfterViewInit(): void {
    this.webRtc.localStream$.subscribe(s  => this.localVideoRef.nativeElement.srcObject  = s);
    this.webRtc.remoteStream$.subscribe(s => this.remoteVideoRef.nativeElement.srcObject = s);
    this.chat.messages$.subscribe(() => {
      setTimeout(() => {
        const el = this.chatScrollRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    });
  }

  openFilters(): void {
    this.dialog.open(MatchFilterDialogComponent, { width: '820px', maxWidth: '95vw', data: { mode: 'instant' } });
  }

  openMemePicker(): void {
    this.dialog.open(MemePickerDialogComponent, { width: '680px', maxWidth: '95vw', maxHeight: '90vh' });
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
