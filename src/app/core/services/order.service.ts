import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { BaseVO } from '../models/vo/base-vo';
import { OrderVO } from '../models/vo/order-vo';
import { OrderModel } from '../models/class/order-model';
import { plainToInstance } from 'class-transformer';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly pathURL: string = '/order'; // Base path for orders

  constructor(private http: HttpClient) {}

  // ✅ Create a new order
  createOrder(orderVO: OrderVO): Observable<BaseVO<OrderVO>> {
    return this.http
      .post<BaseVO<OrderVO>>(`${environment.apiUrl}${this.pathURL}/add`, orderVO)
      .pipe(map((res) => this.transformBaseVO(res)));
  }

  // ✅ Update an existing order
  updateOrder(order: OrderModel): Observable<BaseVO<any>> {
    return this.http
      .post<BaseVO<any>>(`${environment.apiUrl}${this.pathURL}/update`, order)
      .pipe(map((res) => this.transformBaseVO(res)));
  }

  // ✅ Get Razorpay key
  getRazorpayKey(): Observable<string> {
    return this.http.get<string>(`${environment.apiUrl}/razorpay/key`);
  }

  // ✅ Utility method to transform `BaseVO<OrderVO>`
  private transformBaseVO(response: BaseVO<any>): BaseVO<OrderVO> {
    response.data = plainToInstance(OrderVO, response.data);
    return response;
  }
}
