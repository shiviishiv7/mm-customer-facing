import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export type IntentType = 'DATING' | 'MATRIMONIAL';

export interface PostQuestion {
  id: string;
  pairGroup?: string;
  question: string;
  type: 'city' | 'single_choice' | 'multi_choice' | 'range' | 'boolean' | 'dropdown';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface PostQuestionPair {
  aboutYou: PostQuestion | null;
  partnerPref: PostQuestion | null;
}

export interface PostAnalyzeResponse {
  inferredCategory: string;
  categoryDisplayName: string;
  questions: PostQuestionPair[];
}

export interface PostAnswer {
  questionId: string;
  value: string;
}

export interface PartnerPreferenceRequest {
  ageMin?: number;
  ageMax?: number;
  heightMinCm?: number;
  heightMaxCm?: number;
  genderPref?: string;
  maritalStatusPref?: string;
  preferredStates?: string;
  openToRelocation?: boolean;
  religionPref?: string;
  motherTonguePref?: string;
  dietaryPref?: string;
  educationPref?: string;
  employmentTypePref?: string;
  incomeMinInr?: number;
  incomeMaxInr?: number;
  smokingPref?: string;
  drinkingPref?: string;
  familyTypePref?: string;
  familyValuesPref?: string;
  wantsChildrenPref?: boolean;
  marriageTimelinePref?: string;
  okWithPartnerWorkingPref?: boolean;
  relationshipGoalPref?: string;
  aboutPartner?: string;
}

export interface PostSubmitResponse {
  postId: number;
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

  analyze(postText: string, intent: IntentType): Observable<BaseVO<PostAnalyzeResponse>> {
    return this.http.post<BaseVO<PostAnalyzeResponse>>(
      `${this.baseURL}${this.path}/analyze`,
      { postText, intent }
    );
  }

  submit(
    postText: string,
    intent: IntentType,
    answers: PostAnswer[],
    partnerPreference?: PartnerPreferenceRequest
  ): Observable<BaseVO<PostSubmitResponse>> {
    return this.http.post<BaseVO<PostSubmitResponse>>(
      `${this.baseURL}${this.path}/submit`,
      { postText, intent, answers, partnerPreference }
    );
  }

  closePost(postId: number): Observable<BaseVO<void>> {
    return this.http.delete<BaseVO<void>>(`${this.baseURL}${this.path}/${postId}`);
  }
}
