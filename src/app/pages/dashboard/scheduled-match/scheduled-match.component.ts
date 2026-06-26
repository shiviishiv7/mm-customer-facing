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
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { ScheduledMatchService } from '@core/services/scheduled-match.service';
import { WebRtcService } from '@core/services/web-rtc.service';
import { MeetingService, UpcomingMeeting } from '@core/services/meeting.service';
import { MatchFilterDialogComponent } from '@shared/match-filter-dialog/match-filter-dialog.component';
import { MemePickerDialogComponent } from '@shared/meme-picker/meme-picker-dialog.component';
import { MemeStreamService } from '@core/services/meme/meme-stream.service';

@Component({
  selector: 'app-scheduled-match',
  standalone: true,
  imports: [
    NgIf, NgFor, AsyncPipe, DatePipe, FormsModule,
    MatIconModule, MatProgressSpinnerModule, MatButtonModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './scheduled-match.component.html',
  styleUrl: './scheduled-match.component.scss'
})
export class ScheduledMatchComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('localVideo',  { static: true }) localVideoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideoRef!: ElementRef<HTMLVideoElement>;

  scheduledMatch  = inject(ScheduledMatchService);
  webRtc          = inject(WebRtcService);
  meetingService  = inject(MeetingService);
  memeStream      = inject(MemeStreamService);
  private dialog  = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  state$   = this.scheduledMatch.state$;
  meeting$ = this.scheduledMatch.meetingId$;

  private _upcomingMeetings$ = new BehaviorSubject<UpcomingMeeting[]>([]);
  upcomingMeetings$ = this._upcomingMeetings$.asObservable();
  loadingMeetings = false;

  // ── Feedback state ────────────────────────────────────────────────────────
  feedbackSubmitted = false;
  feedbackNotes = '';
  requestingNext = false;
  nextMatchResult: 'connecting' | 'no-active' | null = null;

  ngOnInit(): void {
    this.scheduledMatch.connect();
    this.loadUpcoming();

    // Expose hook for Cypress E2E tests — forces a specific call state
    if ((window as any).Cypress) {
      (window as any).__cypressSetCallState = (state: import('@core/services/scheduled-match.service').ScheduledMatchState) => {
        this.scheduledMatch.triggerWaitingRoom('test-meeting-id', 'test-match-id');
        if (state === 'ended') this.scheduledMatch.endCall();
      };
    }
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
      error: () => { this.loadingMeetings = false; }
    });
  }

  connectMeeting(meeting: UpcomingMeeting): void {
    this.scheduledMatch.triggerWaitingRoom(meeting.id, meeting.matchId);
  }

  async joinCall(): Promise<void> {
    await this.scheduledMatch.joinWaitingRoom();
  }

  openFilters(): void {
    this.dialog.open(MatchFilterDialogComponent, { width: '520px', maxWidth: '95vw', data: { mode: 'scheduled' } });
  }

  openMemePicker(): void {
    this.dialog.open(MemePickerDialogComponent, { width: '680px', maxWidth: '95vw', maxHeight: '90vh' });
  }

  endCall(): void {
    this.scheduledMatch.endCall();
    this.feedbackSubmitted = false;
    this.feedbackNotes = '';
    this.nextMatchResult = null;
  }

  // ── Post-call feedback ────────────────────────────────────────────────────

  submitFeedback(response: 'YES' | 'NO'): void {
    const meetingId = this.scheduledMatch.currentMeetingId;
    if (!meetingId) {
      this.snackBar.open('No active meeting found.', 'OK', { duration: 3000 });
      return;
    }

    this.meetingService.submitFeedback(meetingId, response, this.feedbackNotes || undefined)
      .subscribe({
        next: () => {
          this.feedbackSubmitted = true;
          const msg = response === 'YES'
            ? 'Thanks! We\'ll schedule your next round.'
            : 'Got it. Looking for your next match.';
          this.snackBar.open(msg, undefined, { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Could not submit feedback. Please try again.', 'OK', { duration: 4000 });
        }
      });
  }

  // ── Request next match ────────────────────────────────────────────────────

  requestNextMatch(): void {
    this.requestingNext = true;
    this.meetingService.requestNextMatch().subscribe({
      next: res => {
        this.requestingNext = false;
        const statusCode = (res as any).statusCode ?? 200;
        const message: string = (res as any).message ?? '';
        if (statusCode === 200 && message.toLowerCase().includes('connecting')) {
          this.nextMatchResult = 'connecting';
          // WebRTC will start via /queue/meeting push — service handles state transition
        } else {
          this.nextMatchResult = 'no-active';
        }
      },
      error: () => {
        this.requestingNext = false;
        this.snackBar.open('Could not request next match. Please try again.', 'OK', { duration: 4000 });
      }
    });
  }

  backToList(): void {
    this.scheduledMatch.resetToIdle();
    this.feedbackSubmitted = false;
    this.feedbackNotes = '';
    this.nextMatchResult = null;
    this.requestingNext = false;
    this.loadUpcoming();
  }

  ngOnDestroy(): void {
    this.scheduledMatch.disconnect();
  }
}
