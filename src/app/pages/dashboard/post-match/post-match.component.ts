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

import { PostService, PostQuestion, PostAnswer, PostAnalyzeResponse, PostQuestionPair, IntentType } from '@core/services/post.service';

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

interface QuestionPairAnswer {
  aboutYou: QuestionAnswer | null;
  partnerPref: QuestionAnswer | null;
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
  questionPairAnswers: QuestionPairAnswer[] = [];

  currentStep = 0;

  get steps(): QuestionPairAnswer[] { return this.questionPairAnswers; }
  get isFirstStep(): boolean { return this.currentStep === 0; }
  get isLastStep(): boolean  { return this.currentStep === this.steps.length - 1; }

  get isCurrentStepValid(): boolean {
    const pair = this.steps[this.currentStep];
    if (!pair) return true;
    if (pair.aboutYou && !this.isAnswered(pair.aboutYou)) return false;
    if (pair.partnerPref && !this.isAnswered(pair.partnerPref)) return false;
    return true;
  }

  private isAnswered(qa: QuestionAnswer): boolean {
    switch (qa.question.type) {
      case 'multi_choice': return qa.selectedOptions.length > 0;
      case 'range':        return true; // always has min/max
      case 'boolean':      return true; // always has true/false
      case 'city':         return qa.value.trim().length > 0;
      default:             return qa.value.trim().length > 0;
    }
  }

  nextStep(): void { if (!this.isLastStep && this.isCurrentStepValid) this.currentStep++; }
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
          this.questionPairAnswers = res.data.questions.map(pair => ({
            aboutYou: pair.aboutYou ? this.makeQA(pair.aboutYou) : null,
            partnerPref: pair.partnerPref ? this.makeQA(pair.partnerPref) : null,
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

    const answers: PostAnswer[] = [];
    for (const pair of this.questionPairAnswers) {
      if (pair.aboutYou) answers.push({ questionId: pair.aboutYou.question.id, value: this.resolveValue(pair.aboutYou) });
      if (pair.partnerPref) answers.push({ questionId: pair.partnerPref.question.id, value: this.resolveValue(pair.partnerPref) });
    }

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

  private makeQA(q: PostQuestion): QuestionAnswer {
    return {
      question: q,
      value: q.type === 'boolean' ? 'false' : '',
      selectedOptions: [],
      rangeMin: q.min ?? 18,
      rangeMax: q.max ?? 60,
    };
  }

  private resolveValue(qa: QuestionAnswer): string {
    switch (qa.question.type) {
      case 'multi_choice': return qa.selectedOptions.join(',');
      case 'range':        return `${qa.rangeMin}-${qa.rangeMax}`;
      case 'city':         return qa.value.trim();
      default:             return qa.value;
    }
  }

  reset(): void {
    this.postText = '';
    this.analyzeResult = null;
    this.questionPairAnswers = [];
    this.currentStep = 0;
    this.viewState = 'writing';
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Dismiss', { duration: 4000, panelClass: ['snack-error'] });
  }

  ngOnDestroy(): void {}
}
