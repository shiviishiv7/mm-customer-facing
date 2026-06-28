import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseVO } from '../models/vo/base-vo';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';

export interface UpcomingMeeting {
  id: string;
  matchResultId: string;
  roundNumber: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingType: string;
  peerFirstName: string;
  peerLastName: string;
  peerCognitoSub: string;
  zoomMeetingId: string;
  zoomJoinUrl: string;
  zoomPassword: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/api/v1/meetings`;

  getUpcoming(): Observable<BaseVO<UpcomingMeeting[]>> {
    const sub = this.auth.sub;
    return this.http.get<BaseVO<UpcomingMeeting[]>>(`${this.base}/user/${sub}/upcoming`);
  }

  submitFeedback(meetingId: string, response: 'YES' | 'NO', notes?: string): Observable<BaseVO<void>> {
    return this.http.post<BaseVO<void>>(`${this.base}/${meetingId}/feedback`, { response, notes });
  }
}
