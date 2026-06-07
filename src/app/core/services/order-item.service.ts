import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { BaseVO } from '../models/vo/base-vo';
import {OrderItemModel} from '../models/class/order-item-model';

@Injectable({
  providedIn: 'root',
})
export class OrderItemService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/order-item'; // Base path for order items

  constructor(private http: HttpClient) {
    //console.log(this.baseURL);
  }

  // Create a new order item
  createOrderItem(orderItem: any): Observable<BaseVO<OrderItemModel>> {
    return this.http.post<BaseVO<OrderItemModel>>(`${this.baseURL}${this.pathURL}/add`, orderItem);
  }

  // Update an existing order item
  updateOrderItem(orderItem: any): Observable<BaseVO<OrderItemModel>> {
    return this.http.post<BaseVO<OrderItemModel>>(`${this.baseURL}${this.pathURL}/update`, orderItem);
  }

  // Fetch all order items for an order
  fetchOrderItemsByOrderId(orderId: number): Observable<BaseVO<OrderItemModel[]>> {
    return this.http.get<BaseVO<OrderItemModel[]>>(`${this.baseURL}${this.pathURL}/list/${orderId}`);
  }

  // Fetch a specific order item by ID
  fetchOrderItemById(orderItemId: number): Observable<BaseVO<OrderItemModel>> {
    return this.http.get<BaseVO<OrderItemModel>>(`${this.baseURL}${this.pathURL}/${orderItemId}`);
  }

  // Delete an order item by ID
  deleteOrderItemById(orderItemId: number): Observable<BaseVO<OrderItemModel>> {
    return this.http.delete<BaseVO<OrderItemModel>>(`${this.baseURL}${this.pathURL}/delete/${orderItemId}`);
  }
}
