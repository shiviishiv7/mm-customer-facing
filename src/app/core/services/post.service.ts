import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface PostQuestion {
  id: string;
  question: string;
  type: 'text' | 'single_choice' | 'multi_choice' | 'range' | 'boolean' | 'dropdown';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface PostAnalyzeResponse {
  inferredCategory: string;
  categoryDisplayName: string;
  questions: PostQuestion[];
}

export interface PostAnswer {
  questionId: string;
  value: string;
}

export interface PostSubmitResponse {
  postId: number;
  inferredCategory: string;
  categoryDisplayName: string;
  profileUpdated: boolean;
}

export interface BaseVO<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private baseURL = environment.apiUrl;
  private path = '/api/v1/posts';

  constructor(private http: HttpClient) {}

  analyze(postText: string): Observable<BaseVO<PostAnalyzeResponse>> {
    return this.http.post<BaseVO<PostAnalyzeResponse>>(
      `${this.baseURL}${this.path}/analyze`,
      { postText }
    );
  }

  submit(postText: string, answers: PostAnswer[]): Observable<BaseVO<PostSubmitResponse>> {
    return this.http.post<BaseVO<PostSubmitResponse>>(
      `${this.baseURL}${this.path}/submit`,
      { postText, answers }
    );
  }
}
