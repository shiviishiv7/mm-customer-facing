export class TransactionVo {
  id: number;
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  subscriptionId: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date;
  productType: string;
  amount: number;
}
