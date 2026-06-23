import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {MatchFilter} from '@core/models/interface/some-interface';



@Injectable({ providedIn: 'root' })
export class UserPreferenceService {

  private base = `${environment.apiUrl}/api/v1/match-filter`;

  constructor(private http: HttpClient) {}

  // cognitoSub is read from JWT on the backend — no need to pass it in the URL
  getMy(): Observable<any> {
    return this.http.get(`${this.base}/my`);
  }

  save(filter: MatchFilter): Observable<any> {
    return this.http.post(`${this.base}/save`, filter);
  }

  deactivate(matchCategory: string): Observable<any> {
    return this.http.delete(`${this.base}/${matchCategory}`);
  }
}
