import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ChatMessageVO {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSessionVO {
  id: number;
  detectedCategory: string | null;
  status: 'IN_PROGRESS' | 'AWAITING_SUBMIT' | 'SUBMITTED';
  questionCount: number;
  conversationHistory: ChatMessageVO[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSseMetadata {
  type: string;
  detectedCategory: string | null;
  categoryDisplayName: string | null;
  status: string;
  questionCount: number;
  detectedCategories: string[] | null;
}

export interface ChatSubmitResponse {
  sessionId: number;
  category: string;
  collectedAttributes: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class ChatBotService {
  private base = environment.apiUrl;
  private path = '/api/v1/chat';

  constructor(private http: HttpClient) {}

  startSession(): Observable<ChatSessionVO> {
    return this.http.post<ChatSessionVO>(`${this.base}${this.path}/session/start`, {});
  }

  getSession(sessionId: number): Observable<ChatSessionVO> {
    return this.http.get<ChatSessionVO>(`${this.base}${this.path}/session/${sessionId}`);
  }

  listSessions(): Observable<ChatSessionVO[]> {
    return this.http.get<ChatSessionVO[]>(`${this.base}${this.path}/sessions`);
  }

  submitSession(sessionId: number): Observable<ChatSubmitResponse> {
    return this.http.post<ChatSubmitResponse>(
      `${this.base}${this.path}/session/${sessionId}/submit`, {}
    );
  }

  /** Returns the full URL for the SSE message endpoint (used with EventSource). */
  getMessageUrl(sessionId: number): string {
    return `${this.base}${this.path}/session/${sessionId}/message`;
  }

  /** Returns auth token from localStorage for SSE authorization header workaround. */
  getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}
