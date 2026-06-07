import {OrderStatusEnum} from '@core/enums/order-status.enum';
import {RazorPaymentTxt} from './razor-payment-txt';
import {ProductType} from '@core/enums/product-type';
import {Type} from 'class-transformer';

export class OrderVO {
  id?: number;
  sub?: string;
  orderStatus?: OrderStatusEnum;
  subscriptionId: string;

  razorPaymentTxt?: RazorPaymentTxt;
  paymentOrder: string;

  productType: ProductType;
  productId: string;/// for institution payment you will pass * for that product

}
