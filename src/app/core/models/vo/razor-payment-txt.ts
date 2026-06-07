// Example Class for RazorPaymentTxt
export class RazorPaymentTxt {
  razorpay_order_id: string | null = null;
  razorpay_payment_id: string | null = null;
  razorpay_signature: string | null = null;

  constructor(partial?: Partial<RazorPaymentTxt>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
