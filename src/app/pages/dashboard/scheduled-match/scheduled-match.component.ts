import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { ScheduledMatchService } from '@core/services/scheduled-match.service';
import { WebRtcService } from '@core/services/web-rtc.service';
import { MeetingService, UpcomingMeeting } from '@core/services/meeting.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';
import { AvatarPickerComponent } from '@shared/avatar-picker/avatar-picker.component';

@Component({
  selector: 'app-scheduled-match',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, DatePipe, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, AvatarPickerComponent],
  templateUrl: './scheduled-match.component.html',
  styleUrl: './scheduled-match.component.scss'
})
export class ScheduledMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  scheduledMatch  = inject(ScheduledMatchService);
  webRtc          = inject(WebRtcService);
  meetingService  = inject(MeetingService);
  private dialog  = inject(MatDialog);

  state$   = this.scheduledMatch.state$;
  meeting$ = this.scheduledMatch.meetingId$;

  private _upcomingMeetings$ = new BehaviorSubject<UpcomingMeeting[]>([]);
  upcomingMeetings$ = this._upcomingMeetings$.asObservable();
  loadingMeetings = false;

  ngOnInit(): void {
    this.scheduledMatch.connect();
    this.loadUpcoming();
  }

  ngAfterViewInit(): void {
    this.webRtc.localStream$.subscribe(stream => {
      this.localVideoRef.nativeElement.srcObject = stream;
    });
    this.webRtc.remoteStream$.subscribe(stream => {
      this.remoteVideoRef.nativeElement.srcObject = stream;
    });
  }

  private loadUpcoming(): void {
    this.loadingMeetings = true;
    this.meetingService.getUpcoming().subscribe({
      next: res => {
        this._upcomingMeetings$.next((res as any).data ?? []);
        this.loadingMeetings = false;
      },
      error: () => {
        this.loadingMeetings = false;
      }
    });
  }

  /** User clicks Connect on a listed meeting — trigger waiting-room flow */
  connectMeeting(meeting: UpcomingMeeting): void {
    // Notify the scheduled-match service so it transitions to waiting-room state
    this.scheduledMatch.triggerWaitingRoom(meeting.id, meeting.matchId);
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

  backToList(): void {
    this.scheduledMatch.resetToIdle();
    this.loadUpcoming();
  }

  ngOnDestroy(): void {
    this.scheduledMatch.disconnect();
  }
}
