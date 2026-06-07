import {Injectable} from '@angular/core';
import {OrderService} from '@core/services/order.service';
import {Router} from '@angular/router';
import {WindowRefService} from '@core/services/window-ref.service';
import {NotificationService} from '@shared/services/notification.service';
import {CommunicationBusService} from '@shared/services/communication-bus.service';
import {SubscriptionModel} from '@core/models/class/subscription-model';
import {OrderVO} from '@core/models/vo/order-vo';
import {OrderStatusEnum} from '@core/enums/order-status.enum';
import {RazorPaymentTxt} from '@core/models/vo/razor-payment-txt';

@Injectable({
  providedIn: 'root'
})
export class OrderIntermediateService {

  isLoading: boolean = false;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private winRef: WindowRefService,
    private notificationService: NotificationService,
    private commBus: CommunicationBusService,
  ) {
  }

  /**
   * Initiates the purchase process for an institution.
   * @param institutionId - The ID of the institution to purchase.
   */

  buySubscription(productId: string, s: SubscriptionModel): void {
    try {
      this.commBus.showProgressBar();
      console.log('Initiating order creation for institution ID:', productId);

      // Validate institution ID
      if (!productId) {
        this.notificationService.error('Invalid institution ID. Please provide a valid ID.');
        console.error('Invalid institution ID provided:', productId);
        throw new Error('Invalid institution ID');
      }

      this.isLoading = true;
      console.log('Creating order for institution ID:', productId);

      // Prepare order data
      const orderVO: OrderVO = new OrderVO();
      orderVO.orderStatus = OrderStatusEnum.CREATED;

      orderVO.subscriptionId = s.id.toString()
      orderVO.productType = s.productType;
      orderVO.productId = s.productId       //// i am buying a subscription for this institution id

      console.log('Order data prepared:', orderVO);

      // Create order
      this.orderService.createOrder(orderVO).subscribe({
        next: (baseVO) => {
          console.log('Order created successfully. Response:', baseVO);
          this.isLoading = false;
          this.commBus.closeProgressBar();

          const orderRes = baseVO.data;
          const {razorpayOrder, razor_pay_key} = JSON.parse(orderRes.paymentOrder);
          console.log('Parsed Razorpay order details:', razorpayOrder);

          // Proceed with payment
          this.payWithRazor(razorpayOrder, orderRes, razor_pay_key);
        },
        error: (err) => {
          console.error('Error creating order:', err);
          this.isLoading = false;
          this.commBus.closeProgressBar();
          this.notificationService.error('Failed to create order. Please try again later.');
        }
      });
    } catch (e) {
      console.error('An unexpected error occurred in buyCourse:', e);
      this.notificationService.error('An unexpected error occurred. Please try again later.');
      this.commBus.closeProgressBar();
      this.isLoading = false;
    } finally {
      // Ensure the progress bar is closed in case of unforeseen errors
      this.isLoading = false;
      this.commBus.closeProgressBar();
      console.log('buyCourse execution finished.');
    }
  }


  /**
   * Handles payment with Razorpay.
   * @param razorpayOrder - Razorpay order object.
   * @param order - The order details.
   * @param razor_pay_key - Razorpay API key.
   */
  payWithRazor(razorpayOrder: any, orderVO: OrderVO, razor_pay_key: string): void {
    try {
      console.log('Processing payment with Razorpay.');

      const paymentOrder = JSON.parse(razorpayOrder)['modelJson']['map'];
      const options = this.getRazorpayOptions(paymentOrder['id'], paymentOrder['amount'] / 100, razor_pay_key);

      options.handler = (response: any) => {
        console.log('Payment successful:', response);

        const razorPaymentTxt: RazorPaymentTxt = new RazorPaymentTxt();
        razorPaymentTxt.razorpay_order_id = response.razorpay_order_id;
        razorPaymentTxt.razorpay_payment_id = response.razorpay_payment_id;
        razorPaymentTxt.razorpay_signature = response.razorpay_signature;
        orderVO.razorPaymentTxt = razorPaymentTxt;
        orderVO.orderStatus = OrderStatusEnum.SUCCESS;
        this.updateOrder(orderVO);
      };

      options.modal.ondismiss = () => {
        console.warn('Transaction cancelled by user.');
        this.notificationService.error('Payment was cancelled.');
        orderVO.orderStatus = OrderStatusEnum.FAILED
        this.updateOrder(orderVO)
      };

      const rzp = new this.winRef.nativeWindow.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      this.notificationService.error('An error occurred during payment initialization.');
      this.isLoading = false;
    }
  }

  /**
   * Returns the Razorpay options for the payment.
   * @param orderId - The Razorpay order ID.
   * @param amount - The amount to be paid.
   * @param key - The Razorpay API key.
   */
  private getRazorpayOptions(orderId: string, amount: number, key: string): any {
    console.log('Generating Razorpay options.');
    return {
      key,
      amount,
      currency: 'INR',
      name: 'Your Company',
      description: 'Course Payment',
      image: './assets/logo.png',
      order_id: orderId,
      theme: {color: '#0c238a'},
      modal: {escape: false}
    };
  }

  /**
   * Updates the order status after payment.
   * @param order - The order details to update.
   */
  updateOrder(order: OrderVO): void {
    console.log('Updating order:', order);
    this.orderService.updateOrder(order).subscribe({
      next: (baseVO) => {
        const order = baseVO.data;
        if (order.status === OrderStatusEnum.SUCCESS) {
          console.log('Order updated successfully:', baseVO);
          this.router.navigateByUrl('admin')
        } else if (order.status === OrderStatusEnum.FAILED) {
          console.log('Order updated failed:', baseVO);
        } else {
          console.log('something went wrong:', baseVO);
        }
      },
      error: (err) => {
        console.error('Error updating order:', err);
        this.notificationService.error('Failed to update order.');
      }
    });
  }
}
