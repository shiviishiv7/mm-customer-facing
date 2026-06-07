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
    // ViewChild refs are guaranteed to be ready here — attach streams safely

    // When remote stream arrives → attach to remote <video>
    this.webRtc.remoteStream$.subscribe(stream => {
      if (stream) {
        this.remoteVideoRef.nativeElement.srcObject = stream;
        console.log('[Component] Remote stream attached to video element');
      }
    });
  }

  /** Called when user clicks "Connect" next to a pool user */
  connect(user: PoolUser): void {
    this.webRtc.requestConnection(user.cognitoSub);

    // Attach local stream after a small tick to let getUserMedia resolve first
    setTimeout(() => {
      const localStream = this.webRtc.getLocalStream();
      if (localStream) {
        this.localVideoRef.nativeElement.srcObject = localStream;
        console.log('[Component] Local stream attached to video element');
      }
    }, 500);
  }

  /** Called when user clicks "End Call" */
  endCall(): void {
    this.webRtc.leavePool();
  }

  ngOnDestroy(): void {
    this.webRtc.leavePool();
  }
}
