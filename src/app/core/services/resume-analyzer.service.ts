import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface MissingKeyword {
  keyword: string;
  category: string;
}

export interface ImprovementSuggestion {
  index: number;
  suggestion: string;
  jdReference: string;
}

export interface ResumeAnalysisResult {
  matchScore: number;
  missingKeywords: MissingKeyword[];
  improvements: ImprovementSuggestion[];
}

export interface BaseVO<T> {
  statusCode: number;
  message: string;
  description: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ResumeAnalyzerService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/resume-analyzer';

  constructor(private http: HttpClient) {}

  analyzeResume(
    jobDescription: string,
    resumeFile: File
  ): Observable<BaseVO<ResumeAnalysisResult>> {
    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    formData.append('resumeFile', resumeFile, resumeFile.name);

    return this.http.post<BaseVO<ResumeAnalysisResult>>(
      `${this.baseURL}${this.pathURL}/analyze`,
      formData
    );
  }
}
