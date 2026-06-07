export class OrderItemModel {
  id: number; // Order item ID
  orderId: number; // Associated order ID
  productId: number; // Product ID
  quantity: number; // Quantity of the product
  price: number; // Price of the product
  totalPrice: number; // Total price for the quantity
  createdAt: string; // Item creation timestamp
  updatedAt: string; // Item update timestamp

  constructor(data?: Partial<OrderItemModel>) {
    this.id = data?.id || 0;
    this.orderId = data?.orderId || 0;
    this.productId = data?.productId || 0;
    this.quantity = data?.quantity || 1;
    this.price = data?.price || 0;
    this.totalPrice = data?.totalPrice || 0;
    this.createdAt = data?.createdAt || '';
    this.updatedAt = data?.updatedAt || '';
  }
}
