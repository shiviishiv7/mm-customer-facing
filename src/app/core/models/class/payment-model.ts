export class PaymentModel {
  id: number; // Payment ID
  orderId: number; // Associated order ID
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED'; // Payment status
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'WALLET' | 'COD'; // Payment method
  transactionId: string; // Transaction ID
  amount: number; // Payment amount
  paidAt: string | null; // Timestamp of payment (if paid)
  createdAt: string; // Payment creation timestamp
  updatedAt: string; // Payment update timestamp

  constructor(data?: Partial<PaymentModel>) {
    this.id = data?.id || 0;
    this.orderId = data?.orderId || 0;
    this.paymentStatus = data?.paymentStatus || 'PENDING';
    this.paymentMethod = data?.paymentMethod || 'CREDIT_CARD';
    this.transactionId = data?.transactionId || '';
    this.amount = data?.amount || 0;
    this.paidAt = data?.paidAt || null;
    this.createdAt = data?.createdAt || '';
    this.updatedAt = data?.updatedAt || '';
  }
}
