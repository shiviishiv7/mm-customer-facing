import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { PoolUser, WebRtcService } from '@core/services/web-rtc.service';

@Component({
  selector: 'app-instant-match',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe],
  templateUrl: './instant-match.component.html',
  styleUrl: './instant-match.component.scss'
})
export class InstantMatchComponent implements OnInit, OnDestroy {

  @ViewChild('localVideo')  localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  // inject() runs before field initializers — so webRtc is available immediately
  webRtc = inject(WebRtcService);

  poolUsers$    = this.webRtc.poolUsers$;
  remoteStream$ = this.webRtc.remoteStream$;
  callStatus$   = this.webRtc.callStatus$;

  constructor() {}

  ngOnInit(): void {
    // Join pool — subscribes to signals, connects WebSocket, notifies server
    this.webRtc.joinPool();

    // When remote stream arrives, attach it to the <video> element
    this.webRtc.remoteStream$.subscribe(stream => {
      if (stream && this.remoteVideoRef) {
        this.remoteVideoRef.nativeElement.srcObject = stream;
      }
    });
  }

  /** Called when user clicks "Connect" next to a pool user */
  connect(user: PoolUser): void {
    // Send connection request to selected user
    this.webRtc.requestConnection(user.cognitoSub);

    // Attach local video stream to <video> element
    const localStream = this.webRtc.getLocalStream();
    if (localStream && this.localVideoRef) {
      this.localVideoRef.nativeElement.srcObject = localStream;
    }
  }

  /** Called when user clicks "End Call" */
  endCall(): void {
    this.webRtc.leavePool();
  }

  ngOnDestroy(): void {
    this.webRtc.leavePool();
  }
}
