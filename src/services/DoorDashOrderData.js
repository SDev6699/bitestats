import OrderData from './OrderData';

class DoorDashOrderData extends OrderData {
  constructor(data) {
    super(data);
    this.bundleOrderInfo = data.bundleOrderInfo || null;
    this.cancellationPendingRefundInfo = data.cancellationPendingRefundInfo || {};
    this.cancelledAt = data.cancelledAt || '';
    this.createdAt = data.createdAt || '';
    this.deliveryAddress = data.deliveryAddress || {};
    this.deliveryUuid = data.deliveryUuid || '';
    this.fulfilledAt = data.fulfilledAt || null;
    this.fulfillmentType = data.fulfillmentType || '';
    this.grandTotal = data.grandTotal || {};
    this.isConsumerSubscriptionEligible = data.isConsumerSubscriptionEligible || false;
    this.isGift = data.isGift || false;
    this.isGroup = data.isGroup || false;
    this.isMerchantShipping = data.isMerchantShipping || false;
    this.isPickup = data.isPickup || false;
    this.isReorderable = data.isReorderable || false;
    this.likelyOosItems = data.likelyOosItems || [];
    this.orderUuid = data.orderUuid || '';
    this.orders = data.orders || [];
    this.paymentCard = data.paymentCard || {};
    this.pollingInterval = data.pollingInterval || 0;
    this.recurringOrderDetails = data.recurringOrderDetails || null;
    this.shoppingProtocol = data.shoppingProtocol || '';
    this.specialInstructions = data.specialInstructions || '';
    this.store = data.store || {};
    this.submittedAt = data.submittedAt || '';
  }
}

export default DoorDashOrderData;