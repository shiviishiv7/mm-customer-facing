import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {MatchFilter} from '@core/models/interface/some-interface';



@Injectable({ providedIn: 'root' })
export class UserPreferenceService {

  private base = `${environment.apiUrl}/user-preference`;

  constructor(private http: HttpClient) {}

  getByUserId(userId: string): Observable<any> {
    return this.http.get(`${this.base}/user/${userId}`);
  }

  save(filter: MatchFilter): Observable<any> {
    // Use update if id present, add otherwise
    const endpoint = filter.id ? `${this.base}/update` : `${this.base}/add`;
    return this.http.post(endpoint, filter);
  }
}
