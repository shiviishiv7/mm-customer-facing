import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgForm} from '@angular/forms';
import {ReviewModel} from '@core/models/class/review-model';
import {catchError, finalize, of, Subject, takeUntil, tap} from 'rxjs';
import {NotificationService} from '../services/notification.service';

import {CommunicationBusService} from '../services/communication-bus.service';
import {ReviewService} from '@core/services/review.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
})
export class ReviewComponent implements OnInit, OnDestroy {
  review: ReviewModel = new ReviewModel();
  currentStep: number;
  reviewId: number | null = null;
  private destroy$ = new Subject<void>();
  loading: boolean = true;
  reviews: Array<ReviewModel> = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private reviewService: ReviewService,
    private communicationBus: CommunicationBusService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      const reviewIdParam = queryParams.get('reviewId');
      this.reviewId = reviewIdParam ? parseInt(reviewIdParam, 10) : null;
      if (this.reviewId) {
        this.fetchReviewDetails(this.reviewId);
      } else {
        this.createReview(undefined);
      }
    });
  }

  fetchReviewDetails(reviewId: number): void {
    this.reviewService
      .fetchReviewById(reviewId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          this.handleError(err, 'Failed to fetch review details.');
          return of(null);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe((response) => {
        if (response?.data) {
          this.review = response.data;
          this.currentStep = 2;
        }
      });
  }

  createReview(event: MouseEvent): void {
    this.currentStep = 1;
    this.review = new ReviewModel();
    this.loading = false;
  }

  onSubmit(reviewForm: NgForm): void {
    if (!reviewForm.valid) return;

    this.communicationBus.showProgressBar();
    const action$ = this.review.id
      ? this.reviewService.updateReview(this.review)
      : this.reviewService.createReview(this.review);

    action$
      .pipe(
        tap((v) => {
          this.review = v.data;
          this.notificationService.success('Review saved successfully.', 'OK');
          this.currentStep = 2;
        }),
        catchError((error) => {
          this.handleError(error, error.message);
          return of(null);
        }),
        finalize(() => this.communicationBus.closeProgressBar())
      )
      .subscribe();
  }

  private handleError(error: any, message: string): void {
    console.error('Error:', error);
    this.notificationService.error(message, 'OK');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cancel() {

  }

  saveReview(reviewForm: NgForm) {

  }
}
