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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ScheduledMatchService } from '@core/services/scheduled-match.service';
import { WebRtcService } from '@core/services/web-rtc.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';

@Component({
  selector: 'app-scheduled-match',
  standalone: true,
  imports: [NgIf, AsyncPipe, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule],
  templateUrl: './scheduled-match.component.html',
  styleUrl: './scheduled-match.component.scss'
})
export class ScheduledMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  scheduledMatch = inject(ScheduledMatchService);
  webRtc         = inject(WebRtcService);
  private dialog = inject(MatDialog);

  state$   = this.scheduledMatch.state$;
  meeting$ = this.scheduledMatch.meetingId$;

  ngOnInit(): void {
    this.scheduledMatch.connect();
  }

  ngAfterViewInit(): void {
    // Attach local stream whenever it becomes available (waiting room OR in-call)
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
    });

    // Attach remote stream when the peer connects
    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
    });
  }

  async joinCall(): Promise<void> {
    await this.scheduledMatch.joinWaitingRoom();
  }

  openFilters(): void {
    this.dialog.open(MatchFilterDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { mode: 'scheduled' }
    });
  }

  endCall(): void {
    this.scheduledMatch.endCall();
  }

  ngOnDestroy(): void {
    this.scheduledMatch.disconnect();
  }
}
