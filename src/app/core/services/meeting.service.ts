import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseVO } from '../models/vo/base-vo';
import { environment } from '@environments/environment';

export interface UpcomingMeeting {
  id: string;
  matchId: string;
  roundNumber: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingType: string;
  peerFirstName: string;
  peerLastName: string;
  peerCognitoSub: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/meeting`;

  getUpcoming(): Observable<BaseVO<UpcomingMeeting[]>> {
    return this.http.get<BaseVO<UpcomingMeeting[]>>(`${this.base}/upcoming`);
  }

  markCompleted(id: string): Observable<BaseVO<void>> {
    return this.http.post<BaseVO<void>>(`${this.base}/complete/${id}`, {});
  }
}
