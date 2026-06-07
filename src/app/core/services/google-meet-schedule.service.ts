import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { BaseVO } from '../models/vo/base-vo';
import { GoogleMeetScheduleModel } from '../models/class/google-meet-schedule-model';

@Injectable({
  providedIn: 'root',
})
export class GoogleMeetScheduleService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/google-meet-schedule'; // Base path for Google Meet schedules

  constructor(private http: HttpClient) {
    //console.log(this.baseURL);
  }


  // Fetch all schedules
  fetchAllSchedules(): Observable<BaseVO<GoogleMeetScheduleModel[]>> {
    return this.http.get<BaseVO<GoogleMeetScheduleModel[]>>(
      `${this.baseURL}${this.pathURL}/list`
    );
  }

  // Fetch a specific schedule by ID
  fetchScheduleById(scheduleId: number): Observable<BaseVO<GoogleMeetScheduleModel>> {
    return this.http.get<BaseVO<GoogleMeetScheduleModel>>(
      `${this.baseURL}${this.pathURL}/${scheduleId}`
    );
  }


}
