import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';

import { Router } from '@angular/router';
import { PostService, PostQuestion, PostAnswer, PostAnalyzeResponse } from '@core/services/post.service';
import { PostMatchService, MatchNotification } from '@core/services/post-match.service';
import { WebSocketConnectionService } from '@core/services/web-socket-connection.service';

type ViewState =
  | 'writing'
  | 'analyzing'
  | 'questions'
  | 'submitting'
  | 'waiting'
  | 'connecting'      // match found AND online — WebRTC starting on scheduled-match page
  | 'no-active-match' // match saved, no one online — email sent
  | 'no-match'        // no candidates at all
  | 'result';         // legacy fallback

interface QuestionAnswer {
  question: PostQuestion;
  value: string;
  selectedOptions: string[];
  rangeMin: number;
  rangeMax: number;
}

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatSliderModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatStepperModule,
  ],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.scss',
})
export class PostMatchComponent implements OnInit, OnDestroy {
  viewState: ViewState = 'writing';

  postText = '';
  analyzeResult: PostAnalyzeResponse | null = null;
  questionAnswers: QuestionAnswer[] = [];
  matchResult: MatchNotification | null = null;

  // ── Stepper ────────────────────────────────────────────────────────────────
  /** Index of the currently visible step (0-based). */
  currentStep = 0;

  /** Questions chunked into pairs of 2 for the stepper. */
  get steps(): QuestionAnswer[][] {
    const out: QuestionAnswer[][] = [];
    for (let i = 0; i < this.questionAnswers.length; i += 2) {
      out.push(this.questionAnswers.slice(i, i + 2));
    }
    return out;
  }

  get isFirstStep(): boolean { return this.currentStep === 0; }
  get isLastStep(): boolean  { return this.currentStep === this.steps.length - 1; }

  /** Global question index of the first question in the current step. */
  get stepOffset(): number { return this.currentStep * 2; }

  nextStep(): void {
    if (!this.isLastStep) this.currentStep++;
  }

  prevStep(): void {
    if (!this.isFirstStep) this.currentStep--;
  }

  private matchSub!: Subscription;

  constructor(
    private postService: PostService,
    private postMatchService: PostMatchService,
    private wsService: WebSocketConnectionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.wsService.connect();
    this.postMatchService.connect();

    // Expose hook for Cypress E2E tests — injects a mock WebSocket notification
    if ((window as any).Cypress) {
      (window as any).__cypressInjectMatchNotification = (n: MatchNotification) => {
        this.viewState = 'waiting';
        this.matchResult = n;
        this.handleNotification(n);
      };
    }

    this.matchSub = this.postMatchService.notification$.subscribe(n => {
      if (!n || this.viewState !== 'waiting') return;
      this.matchResult = n;
      this.handleNotification(n);
    });
  }

  private handleNotification(n: MatchNotification): void {
    switch (n.event) {
      case 'POST_MATCH_CONNECTING':
      case 'POST_MATCH_FOUND':
        this.viewState = 'connecting';
        setTimeout(() => this.router.navigate(['/dashboard/scheduled-match']), 1500);
        break;
      case 'POST_NO_ACTIVE_MATCH':
        this.viewState = 'no-active-match';
        break;
      case 'POST_NO_MATCH_FOUND':
        this.viewState = 'no-match';
        break;
      default:
        this.viewState = 'result';
    }
  }

  get isPostValid(): boolean {
    return this.postText.trim().length >= 50;
  }

  // ─── Step 1: Analyze ───────────────────────────────────────────────────────

  analyze(): void {
    if (!this.isPostValid) return;
    this.viewState = 'analyzing';

    this.postService.analyze(this.postText).subscribe({
      next: res => {
        if (res.statusCode === 200 && res.data) {
          this.analyzeResult = res.data;
          this.questionAnswers = res.data.questions.map(q => ({
            question: q,
            value: q.type === 'boolean' ? 'false' : '',
            selectedOptions: [],
            rangeMin: q.min ?? 18,
            rangeMax: q.max ?? 60,
          }));
          this.currentStep = 0;
          this.viewState = 'questions';
        } else {
          this.showError(res.message || 'Analysis failed.');
          this.viewState = 'writing';
        }
      },
      error: () => {
        this.showError('Something went wrong. Please try again.');
        this.viewState = 'writing';
      },
    });
  }

  // ─── Step 2: Submit ────────────────────────────────────────────────────────

  submit(): void {
    this.viewState = 'submitting';

    const answers: PostAnswer[] = this.questionAnswers.map(qa => ({
      questionId: qa.question.id,
      value: this.resolveValue(qa),
    }));

    this.postService.submit(this.postText, answers).subscribe({
      next: res => {
        if (res.statusCode === 200) {
          this.viewState = 'waiting';
        } else {
          this.showError(res.message || 'Submission failed.');
          this.viewState = 'questions';
        }
      },
      error: () => {
        this.showError('Submission failed. Please try again.');
        this.viewState = 'questions';
      },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  toggleOption(qa: QuestionAnswer, option: string): void {
    const idx = qa.selectedOptions.indexOf(option);
    if (idx === -1) {
      qa.selectedOptions.push(option);
    } else {
      qa.selectedOptions.splice(idx, 1);
    }
  }

  isOptionSelected(qa: QuestionAnswer, option: string): boolean {
    return qa.selectedOptions.includes(option);
  }

  private resolveValue(qa: QuestionAnswer): string {
    switch (qa.question.type) {
      case 'multi_choice': return qa.selectedOptions.join(',');
      case 'range': return `${qa.rangeMin}-${qa.rangeMax}`;
      default: return qa.value;
    }
  }

  get matchScorePercent(): number {
    return Math.round(this.matchResult?.compatibilityScore ?? 0);
  }

  reset(): void {
    this.postText = '';
    this.analyzeResult = null;
    this.questionAnswers = [];
    this.matchResult = null;
    this.currentStep = 0;
    this.postMatchService.reset();
    this.viewState = 'writing';
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Dismiss', { duration: 4000, panelClass: ['snack-error'] });
  }

  ngOnDestroy(): void {
    this.matchSub?.unsubscribe();
    this.postMatchService.disconnect();
  }
}
