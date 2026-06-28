import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MeetingService, UpcomingMeeting } from '@core/services/meeting.service';

type FeedbackState = 'idle' | 'submitting' | 'done';

interface MeetingWithFeedback extends UpcomingMeeting {
  feedbackState?: FeedbackState;
  feedbackSubmitted?: 'YES' | 'NO';
}

@Component({
  selector: 'app-scheduled-match',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, RouterModule,
    MatIconModule, MatProgressSpinnerModule, MatButtonModule,
    MatSnackBarModule, MatDividerModule,
  ],
  templateUrl: './scheduled-match.component.html',
  styleUrl: './scheduled-match.component.scss',
})
export class ScheduledMatchComponent implements OnInit {

  meetings: MeetingWithFeedback[] = [];
  loading = false;
  selectedMeetingForFeedback: MeetingWithFeedback | null = null;

  constructor(
    private meetingService: MeetingService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
  }

  loadMeetings(): void {
    this.loading = true;
    this.meetingService.getUpcoming().subscribe({
      next: res => {
        this.meetings = ((res as any).data ?? []).map((m: UpcomingMeeting) => ({
          ...m,
          feedbackState: 'idle' as FeedbackState,
          feedbackSubmitted: undefined,
        }));
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Could not load meetings. Please refresh.', 'OK', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  joinMeeting(meeting: MeetingWithFeedback): void {
    if (meeting.zoomJoinUrl) {
      window.open(meeting.zoomJoinUrl, '_blank');
    }
  }

  openFeedback(meeting: MeetingWithFeedback): void {
    this.selectedMeetingForFeedback = meeting;
  }

  closeFeedback(): void {
    this.selectedMeetingForFeedback = null;
  }

  submitFeedback(meeting: MeetingWithFeedback, response: 'YES' | 'NO'): void {
    meeting.feedbackState = 'submitting';
    this.meetingService.submitFeedback(meeting.id, response).subscribe({
      next: () => {
        meeting.feedbackState = 'done';
        meeting.feedbackSubmitted = response;
        this.selectedMeetingForFeedback = null;
        const msg = response === 'YES'
          ? 'Great! If your match also says yes, we\'ll schedule another meeting.'
          : 'Got it. We\'ll look for your next match.';
        this.snackBar.open(msg, undefined, { duration: 4000 });
      },
      error: () => {
        meeting.feedbackState = 'idle';
        this.snackBar.open('Could not submit feedback. Please try again.', 'OK', { duration: 4000 });
      },
    });
  }

  isMeetingJoinable(meeting: UpcomingMeeting): boolean {
    const now = new Date();
    const scheduled = new Date(meeting.scheduledAt);
    const diffMinutes = (scheduled.getTime() - now.getTime()) / 60000;
    // Joinable from 10 min before up to 60 min after scheduled time
    return diffMinutes <= 10 && diffMinutes >= -60;
  }

  isPastMeeting(meeting: UpcomingMeeting): boolean {
    const scheduled = new Date(meeting.scheduledAt);
    const diffMinutes = (new Date().getTime() - scheduled.getTime()) / 60000;
    return diffMinutes > 60;
  }
}
