import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { PostService, PostQuestion, PostAnswer, PostAnalyzeResponse, IntentType } from '@core/services/post.service';

type ViewState =
  | 'writing'
  | 'analyzing'
  | 'questions'
  | 'submitting'
  | 'submitted';

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
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatSelectModule, MatDividerModule,
  ],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.scss',
})
export class PostMatchComponent implements OnInit, OnDestroy {
  viewState: ViewState = 'writing';

  intent: IntentType = 'MATRIMONIAL';
  postText = '';
  analyzeResult: PostAnalyzeResponse | null = null;
  questionAnswers: QuestionAnswer[] = [];

  currentStep = 0;

  get steps(): QuestionAnswer[][] {
    const out: QuestionAnswer[][] = [];
    for (let i = 0; i < this.questionAnswers.length; i += 2) {
      out.push(this.questionAnswers.slice(i, i + 2));
    }
    return out;
  }

  get isFirstStep(): boolean { return this.currentStep === 0; }
  get isLastStep(): boolean  { return this.currentStep === this.steps.length - 1; }
  get stepOffset(): number   { return this.currentStep * 2; }

  nextStep(): void { if (!this.isLastStep) this.currentStep++; }
  prevStep(): void { if (!this.isFirstStep) this.currentStep--; }

  constructor(
    private postService: PostService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  get isPostValid(): boolean {
    return this.postText.trim().length >= 50;
  }

  analyze(): void {
    if (!this.isPostValid) return;
    this.viewState = 'analyzing';

    this.postService.analyze(this.postText, this.intent).subscribe({
      next: res => {
        if (res.statusCode === 200 && res.data) {
          this.analyzeResult = res.data;
          if (res.data.questions.length === 0) {
            // All questions answered in post — go straight to submit
            this.submit();
            return;
          }
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

  submit(): void {
    this.viewState = 'submitting';

    const answers: PostAnswer[] = this.questionAnswers.map(qa => ({
      questionId: qa.question.id,
      value: this.resolveValue(qa),
    }));

    this.postService.submit(this.postText, this.intent, answers).subscribe({
      next: res => {
        if (res.statusCode === 200) {
          this.viewState = 'submitted';
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

  toggleOption(qa: QuestionAnswer, option: string): void {
    const idx = qa.selectedOptions.indexOf(option);
    if (idx === -1) qa.selectedOptions.push(option);
    else qa.selectedOptions.splice(idx, 1);
  }

  isOptionSelected(qa: QuestionAnswer, option: string): boolean {
    return qa.selectedOptions.includes(option);
  }

  private resolveValue(qa: QuestionAnswer): string {
    switch (qa.question.type) {
      case 'multi_choice': return qa.selectedOptions.join(',');
      case 'range':        return `${qa.rangeMin}-${qa.rangeMax}`;
      default:             return qa.value;
    }
  }

  reset(): void {
    this.postText = '';
    this.analyzeResult = null;
    this.questionAnswers = [];
    this.currentStep = 0;
    this.viewState = 'writing';
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Dismiss', { duration: 4000, panelClass: ['snack-error'] });
  }

  ngOnDestroy(): void {}
}
