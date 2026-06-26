import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChatBotService, ChatSessionVO } from '@core/services/chat-bot/chat-bot.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './session-list.component.html',
  styleUrl: './session-list.component.scss',
})
export class SessionListComponent implements OnInit {
  sessions: ChatSessionVO[] = [];
  loading = true;

  constructor(
    private chatBotService: ChatBotService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.chatBotService.listSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load sessions.', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  startNewChat(): void {
    this.chatBotService.startSession().subscribe({
      next: session => this.router.navigate(['/dashboard/chat-bot', session.id]),
      error: () => this.snackBar.open('Failed to start chat.', 'Dismiss', { duration: 3000 }),
    });
  }

  resumeSession(session: ChatSessionVO): void {
    this.router.navigate(['/dashboard/chat-bot', session.id]);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'AWAITING_SUBMIT': return 'Ready to Submit';
      case 'SUBMITTED': return 'Submitted';
      default: return status;
    }
  }

  statusColor(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'primary';
      case 'AWAITING_SUBMIT': return 'accent';
      case 'SUBMITTED': return '';
      default: return '';
    }
  }
}
