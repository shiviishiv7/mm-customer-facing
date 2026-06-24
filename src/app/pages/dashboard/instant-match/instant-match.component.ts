import {
  AfterViewInit, Component, ElementRef, inject,
  OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { AsyncPipe, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subscription } from 'rxjs';
import { InstantSearchFilter, PoolUser, WebRtcService } from '@core/services/web-rtc.service';
import { ChatService } from '@core/services/chat.service';
import { AuthService } from '@core/services/auth.service';
import { MemeStreamService } from '@core/services/meme/meme-stream.service';
import { MemePickerDialogComponent } from '@shared/meme-picker/meme-picker-dialog.component';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgIf, AsyncPipe, SlicePipe, FormsModule,
            MatButtonModule, MatIconModule, MatTooltipModule,
            MatSelectModule, MatInputModule, MatFormFieldModule],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatScroll')  chatScrollRef?: ElementRef<HTMLDivElement>;

  webRtc     = inject(WebRtcService);
  chat       = inject(ChatService);
  auth       = inject(AuthService);
  memeStream = inject(MemeStreamService);
  private dialog = inject(MatDialog);

  currentUser$     = this.webRtc.currentUser$;
  callStatus$      = this.webRtc.callStatus$;
  waitingForMatch$ = this.webRtc.waitingForMatch$;
  chatMessages$    = this.chat.messages$;
  activeMeme$      = this.memeStream.activeMeme$;

  showFilterPanel = false;
  filter: InstantSearchFilter = {};

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

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  applyFilter(): void {
    this.showFilterPanel = false;
    this.webRtc.searchPool(this.filter);
  }

  clearFilter(): void {
    this.filter = {};
    this.showFilterPanel = false;
    this.webRtc.joinPool();
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
