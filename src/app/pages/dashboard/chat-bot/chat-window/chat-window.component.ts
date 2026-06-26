import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChatBotService,
  ChatMessageVO,
  ChatSessionVO,
  ChatSseMetadata,
} from '@core/services/chat-bot/chat-bot.service';
import { PostMatchService } from '@core/services/post-match.service';
import { WebSocketConnectionService } from '@core/services/web-socket-connection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageEnd') messageEnd!: ElementRef;

  session: ChatSessionVO | null = null;
  messages: ChatMessageVO[] = [];
  userInput = '';
  botTyping = false;
  streamingMessage = '';
  sessionId!: number;
  loading = true;

  // Category selection when multiple detected
  detectedCategories: string[] = [];

  // Match search state
  viewState: 'chat' | 'submitting' | 'searching' | 'connecting' | 'no-match' | 'no-active-match' = 'chat';

  private matchSub!: Subscription;
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatBotService: ChatBotService,
    private postMatchService: PostMatchService,
    private wsService: WebSocketConnectionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSession();

    this.wsService.connect();
    this.postMatchService.connect();
    this.matchSub = this.postMatchService.notification$.subscribe(n => {
      if (!n || this.viewState !== 'searching') return;
      switch (n.event) {
        case 'POST_MATCH_CONNECTING':
          this.viewState = 'connecting';
          setTimeout(() => this.router.navigate(['/dashboard/scheduled-match']), 1500);
          break;
        case 'POST_NO_ACTIVE_MATCH':
          this.viewState = 'no-active-match';
          break;
        case 'POST_NO_MATCH_FOUND':
          this.viewState = 'no-match';
          break;
      }
    });
  }

  private loadSession(): void {
    this.chatBotService.getSession(this.sessionId).subscribe({
      next: session => {
        this.session = session;
        this.messages = session.conversationHistory ?? [];
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.snackBar.open('Failed to load session.', 'Dismiss', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  sendMessage(): void {
    const content = this.userInput.trim();
    if (!content || this.botTyping) return;

    this.messages.push({ role: 'user', content });
    this.userInput = '';
    this.botTyping = true;
    this.streamingMessage = '';
    this.shouldScroll = true;

    const url = this.chatBotService.getMessageUrl(this.sessionId);
    const token = this.chatBotService.getAuthToken();

    // Use fetch with ReadableStream for SSE (EventSource doesn't support POST + auth headers)
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ content }),
    }).then(async response => {
      if (!response.ok || !response.body) {
        throw new Error('Stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: token')) continue;
          if (line.startsWith('event: metadata')) continue;
          if (line.startsWith('event: done')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;

            // Try to parse as metadata event
            try {
              const parsed: ChatSseMetadata = JSON.parse(data);
              if (parsed.type === 'metadata') {
                this.handleMetadata(parsed);
                continue;
              }
            } catch (_) {}

            // Plain token
            this.streamingMessage += data;
            this.shouldScroll = true;
          }
        }
      }

      // Commit streamed message to history
      if (this.streamingMessage) {
        this.messages.push({ role: 'assistant', content: this.streamingMessage });
        this.streamingMessage = '';
      }
      this.botTyping = false;
      this.shouldScroll = true;

    }).catch(() => {
      this.botTyping = false;
      this.streamingMessage = '';
      this.snackBar.open('Something went wrong. Please try again.', 'Dismiss', { duration: 3000 });
    });
  }

  private handleMetadata(meta: ChatSseMetadata): void {
    if (meta.detectedCategories && meta.detectedCategories.length > 1) {
      this.detectedCategories = meta.detectedCategories;
    } else {
      this.detectedCategories = [];
    }
    if (meta.status) {
      this.session = { ...this.session!, status: meta.status as any, detectedCategory: meta.detectedCategory, questionCount: meta.questionCount };
    }
  }

  selectCategory(category: string): void {
    this.detectedCategories = [];
    this.userInput = `I'd like to go with ${category.replace(/_/g, ' ')}`;
    this.sendMessage();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  submitForMatch(): void {
    this.viewState = 'submitting';
    this.chatBotService.submitSession(this.sessionId).subscribe({
      next: () => {
        this.viewState = 'searching';
      },
      error: () => {
        this.viewState = 'chat';
        this.snackBar.open('Submission failed. Please try again.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  get isAwaitingSubmit(): boolean {
    return this.session?.status === 'AWAITING_SUBMIT';
  }

  get isSubmitted(): boolean {
    return this.session?.status === 'SUBMITTED';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/chat-bot']);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messageEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch (_) {}
  }

  ngOnDestroy(): void {
    this.matchSub?.unsubscribe();
    this.postMatchService.disconnect();
  }
}
