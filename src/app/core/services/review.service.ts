import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@environments/environment';
import {BaseVO} from '../models/vo/base-vo';
import {ReviewModel} from '../models/class/review-model';
import {map} from 'rxjs/operators';
import {plainToInstance} from 'class-transformer';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/review';

  constructor(private http: HttpClient) {
  }

// ✅ Create a new review
  createReview(review: any): Observable<BaseVO<ReviewModel>> {
    return this.http
      .post<BaseVO<ReviewModel>>(`${this.baseURL}${this.pathURL}/add`, review)
      .pipe(map((res) => this.transformBaseVO(res)));
  }

// ✅ Update an existing review
  updateReview(review: any): Observable<BaseVO<ReviewModel>> {
    return this.http
      .post<BaseVO<ReviewModel>>(`${this.baseURL}${this.pathURL}/update`, review)
      .pipe(map((res) => this.transformBaseVO(res)));
  }

// ✅ Fetch a specific review by ID
  fetchReviewById(reviewId: number): Observable<BaseVO<ReviewModel>> {
    return this.http
      .get<BaseVO<ReviewModel>>(`${this.baseURL}${this.pathURL}/${reviewId}`)
      .pipe(map((res) => this.transformBaseVO(res)));
  }

// ✅ Utility method to transform `BaseVO<ReviewModel>`
  private transformBaseVO(response: BaseVO<any>): BaseVO<ReviewModel> {
    response.data = plainToInstance(ReviewModel, response.data);
    return response;
  }

}
