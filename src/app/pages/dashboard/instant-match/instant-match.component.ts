import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { PoolUser, WebRtcService } from '@core/services/web-rtc.service';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  // { static: true } — resolves ViewChild before ngOnInit, works even without *ngIf
  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  // inject() runs before field initializers — so webRtc is available immediately
  webRtc = inject(WebRtcService);

  poolUsers$    = this.webRtc.poolUsers$;
  remoteStream$ = this.webRtc.remoteStream$;
  callStatus$   = this.webRtc.callStatus$;

  constructor() {}

  ngOnInit(): void {
    // Join pool — subscribes to signals, connects WebSocket, notifies server
    this.webRtc.joinPool();
  }

  ngAfterViewInit(): void {
    // ViewChild refs guaranteed ready here — attach streams safely

    // When local camera is ready → attach to local <video>
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
      console.log('[Component] Local stream attached to video element');
    });

    // When remote stream arrives → attach to remote <video>
    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
      console.log('[Component] Remote stream attached to video element');
    });
  }

  /** Called when user clicks "Connect" next to a pool user */
  connect(user: PoolUser): void {
    // Just send connection request — local video attaches automatically via localStream$
    this.webRtc.requestConnection(user.cognitoSub);
  }

  /** Called when user clicks "End Call" */
  endCall(): void {
    this.webRtc.leavePool();
  }

  ngOnDestroy(): void {
    this.webRtc.leavePool();
  }
}
