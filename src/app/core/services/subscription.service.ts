import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseVO} from '../models/vo/base-vo';
import {SubscriptionModel} from '../models/class/subscription-model';
import {environment} from '@environments/environment';
import {plainToInstance} from 'class-transformer';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {


  private baseURL: string = 'http://localhost:8080';
  private pathURL: string = '/subscription'; // Set a default value

  constructor(private http: HttpClient) {
    this.baseURL = environment.apiUrl;
    //console.log(this.baseURL);
  }

// ✅ Fetch all subscriptions for a group
  fetchAllSubscriptionForGroup(): Observable<BaseVO<SubscriptionModel[]>> {
    return this.http
      .get<BaseVO<SubscriptionModel[]>>(`${this.baseURL}${this.pathURL}/group`)
      .pipe(map((res) => this.transformBaseVOArray(res)));
  }

// ✅ Fetch all subscriptions for a specific product ID
  fetchAllSubscriptionForProductId(productId: string): Observable<BaseVO<SubscriptionModel[]>> {
    return this.http
      .get<BaseVO<SubscriptionModel[]>>(`${this.baseURL}${this.pathURL}/product/${productId}`)
      .pipe(map((res) => this.transformBaseVOArray(res)));
  }

// ✅ Utility method to transform `BaseVO<SubscriptionModel[]>`
  private transformBaseVOArray(response: BaseVO<any>): BaseVO<SubscriptionModel[]> {
    response.data = plainToInstance(SubscriptionModel, response.data as any[]);
    return response;
  }

}
