import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ScheduledMatchService } from '@core/services/scheduled-match.service';
import { WebRtcService } from '@core/services/web-rtc.service';

@Component({
  selector: 'app-scheduled-match',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: './scheduled-match.component.html',
  styleUrl: './scheduled-match.component.scss'
})
export class ScheduledMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  scheduledMatch = inject(ScheduledMatchService);
  webRtc         = inject(WebRtcService);

  state$    = this.scheduledMatch.state$;
  meeting$  = this.scheduledMatch.meetingId$;

  remoteStream$ = this.webRtc.remoteStream$;
  callStatus$   = this.webRtc.callStatus$;

  ngOnInit(): void {
    this.scheduledMatch.connect();
  }

  ngAfterViewInit(): void {
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
    });

    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
    });
  }

  joinCall(): void {
    this.scheduledMatch.joinWaitingRoom();
  }

  endCall(): void {
    this.scheduledMatch.endCall();
  }

  ngOnDestroy(): void {
    this.scheduledMatch.disconnect();
  }
}
