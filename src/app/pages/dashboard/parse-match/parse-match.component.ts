import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeAnalysisResult, ResumeAnalyzerService } from '@core/services/resume-analyzer.service';

type ViewState = 'input' | 'loading' | 'results';

@Component({
  selector: 'app-parse-match',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './parse-match.component.html',
  styleUrl: './parse-match.component.scss',
})
export class ParseMatchComponent {
  // Form state
  jobDescription: string = '';
  selectedFile: File | null = null;
  fileName: string = '';

  // View state
  viewState: ViewState = 'input';

  // Results
  analysisResult: ResumeAnalysisResult | null = null;

  // Validation
  jdTouched = false;
  fileTouched = false;

  constructor(
    private resumeAnalyzerService: ResumeAnalyzerService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Please upload a PDF file only.', 'Dismiss', {
          duration: 3000,
          panelClass: ['snack-error'],
        });
        return;
      }
      this.selectedFile = file;
      this.fileName = file.name;
      this.fileTouched = true;
    }
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Please upload a PDF file only.', 'Dismiss', {
          duration: 3000,
          panelClass: ['snack-error'],
        });
        return;
      }
      this.selectedFile = file;
      this.fileName = file.name;
      this.fileTouched = true;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  get isFormValid(): boolean {
    return this.jobDescription.trim().length > 0 && this.selectedFile !== null;
  }

  get scoreColor(): string {
    if (!this.analysisResult) return 'primary';
    const score = this.analysisResult.matchScore;
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  get scoreLabel(): string {
    if (!this.analysisResult) return '';
    const score = this.analysisResult.matchScore;
    if (score >= 75) return 'Strong Match';
    if (score >= 50) return 'Moderate Match';
    return 'Weak Match';
  }

  get scoreMaterialColor(): string {
    if (!this.analysisResult) return 'primary';
    const score = this.analysisResult.matchScore;
    if (score >= 75) return 'accent';
    if (score >= 50) return 'primary';
    return 'warn';
  }

  analyze(): void {
    this.jdTouched = true;
    this.fileTouched = true;

    if (!this.isFormValid) return;

    this.viewState = 'loading';

    this.resumeAnalyzerService
      .analyzeResume(this.jobDescription, this.selectedFile!)
      .subscribe({
        next: (response) => {
          if (response['statusCode'] === 200 && response.data) {
            this.analysisResult = response.data;
            this.viewState = 'results';
          } else {
            this.snackBar.open(
              response.message || 'Analysis failed. Please try again.',
              'Dismiss',
              { duration: 4000, panelClass: ['snack-error'] }
            );
            this.viewState = 'input';
          }
        },
        error: () => {
          this.snackBar.open(
            'Something went wrong. Please try again.',
            'Dismiss',
            { duration: 4000, panelClass: ['snack-error'] }
          );
          this.viewState = 'input';
        },
      });
  }

  reset(): void {
    this.jobDescription = '';
    this.selectedFile = null;
    this.fileName = '';
    this.jdTouched = false;
    this.fileTouched = false;
    this.analysisResult = null;
    this.viewState = 'input';
  }
}
