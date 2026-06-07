import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { BaseVO } from '@core/models/vo/base-vo';
import { UserSubscriptionModel } from '@core/models/class/user-subscription-model';
import { plainToInstance } from 'class-transformer';

@Injectable({
  providedIn: 'root'
})
export class UserSubscriptionService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/user-subscription'; // Base path

  constructor(private http: HttpClient) {
    //console.log(this.baseURL);
  }

  // ✅ Fetch All User Subscriptions
  fetchAllUserSubscription(): Observable<BaseVO<UserSubscriptionModel[]>> {
    return this.http
      .get<BaseVO<UserSubscriptionModel[]>>(`${this.baseURL}${this.pathURL}/all`)
      .pipe(map((res) => this.transformBaseVOArray(res)));
  }

  // ✅ Utility method to transform `BaseVO<UserSubscriptionModel[]>`
  private transformBaseVOArray(response: BaseVO<any>): BaseVO<UserSubscriptionModel[]> {
    response.data = plainToInstance(UserSubscriptionModel, response.data as any[]);
    return response;
  }
}
