
import {DurationUnit} from '@core/enums/duration-unit';
import {ProductType} from '@core/enums/product-type';

export class SubscriptionModel {
  id!: number; // Identifier for the subscription
  name!: string; // e.g., Free, Plus, Pro
  // subscriptionType!: SubscriptionType; // Enum for subscription type
  amount!: number; // Subscription fee
  durationUnit!: DurationUnit; // Enum for duration unit (e.g., month, year)
  productId!: string; // ID of the product associated with the subscription
  productType!: ProductType; // Enum for product type
  discount: string;
  activeSubscription: boolean;
}
