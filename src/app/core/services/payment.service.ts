import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@environments/environment';
import {BaseVO} from '../models/vo/base-vo';
import {PaymentModel} from '../models/class/payment-model';
import {OrderService} from './order.service';
import {Router} from '@angular/router';
import {WindowRefService} from './window-ref.service';
import {NotificationService} from '@shared/services/notification.service';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {SubscriptionModel} from '../models/class/subscription-model';
import {OrderVO} from '../models/vo/order-vo';
import {OrderStatusEnum} from '../enums/order-status.enum';
import {ProductType} from '../enums/product-type';
import {RazorPaymentTxt} from '../models/vo/razor-payment-txt';
import {ExamModel} from '../models/class/exam.model';
import {TransactionVo} from '@core/models/vo/transaction-vo';
import {map} from 'rxjs/operators';
import {plainToInstance} from 'class-transformer';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly pathURL: string = '/payment'; // Base path for orders
  private baseURL: string;

  constructor(private http: HttpClient) {
    this.baseURL = environment.apiUrl;
  }

// ✅ Fetch payment history
  fetchPaymentHistory(): Observable<BaseVO<TransactionVo[]>> {
    return this.http
      .get<BaseVO<TransactionVo[]>>(`${this.baseURL}${this.pathURL}/history`)
      .pipe(map((res) => this.transformBaseVOArray(res)));
  }

// ✅ Utility method to transform `BaseVO<TransactionVo[]>`
  private transformBaseVOArray(response: BaseVO<any>): BaseVO<TransactionVo[]> {
    response.data = plainToInstance(TransactionVo, response.data as any[]);
    return response;
  }

}
