class OrderData {
    constructor(data) {
      this.date = this.parseDate(data.date);
      this.state = data.state;
      this.dinerGrandTotal = data.dinerGrandTotal || 0;
      this.lineItems = data.lineItems || [];
      this.restaurantName = data.restaurantName || 'Unknown';
      this.subtotal = data.subtotal || 0;
      this.serviceFee = data.serviceFee || 0;
      this.deliveryFee = data.deliveryFee || 0;
      this.salesTax = data.salesTax || 0;
      this.driverTip = data.driverTip || 0;
      this.donation = data.donation || 0;
      this.giftCards = data.giftCardCredit || 0;
      this.promotionalDiscount = data.promotionalDiscount || 0;
    }
  
    parseDate(dateString) {
      const date = new Date(dateString);
      if (isNaN(date)) {
        console.error('Invalid date:', dateString);
        return null;
      }
      return date;
    }
  
    static fromGrubhub(data) {
      const state = data.state;
  
      const getPaymentTotal = (type) => {
        return data.payments?.payments.reduce((total, payment) => {
          return payment.type === type ? total + payment.amount : total;
        }, 0) || 0;
      };
  
      return new OrderData({
        date: data.time_placed,
        state: state,
        dinerGrandTotal: data.charges?.diner_grand_total || 0,
        lineItems: data.charges?.lines?.line_items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          originalItemPrice: item.diner_total || 0,
          options: item.options.map(option => ({
            name: option.name,
            price: option.price || 0,
            quantity: option.quantity || 1
          }))
        })) || [],
        restaurantName: data.restaurants?.[0]?.name || 'Unknown',
        subtotal: data.charges?.diner_subtotal || 0,
        serviceFee: data.charges?.fees?.service || 0,
        deliveryFee: data.charges?.fees?.delivery || 0,
        salesTax: data.charges?.taxes?.total || 0,
        driverTip: data.charges?.tip?.amount || 0,
        donation: data.charges?.donations?.total || 0,
        giftCardCredit: getPaymentTotal("GIFT_CARD"),  // Total amount from gift card payments
        promotionalDiscount: getPaymentTotal("PROMO_CODE")  // Total discount from promotional codes
      });
    }
  
    static fromDoorDash(data) {
      const state = data.cancelledAt ? 'CANCELLED' : 'COMPLETED';
  
      const lineItems = data.orderReceiptData?.lineItems || [];
  
      const getAmountByChargeId = (chargeId) => {
        const item = lineItems.find(item => item.chargeId === chargeId);
        return item?.finalMoney?.unitAmount || 0;
      };
  
      // Flatten all items from all orders
      const allItems = data.orders?.reduce((acc, order) => {
        const items = order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          originalItemPrice: item.originalItemPrice || 0,
          orderItemExtras: item.orderItemExtras || []
        }));
        return acc.concat(items);
      }, []) || [];
  
      return new OrderData({
        date: data.createdAt,
        state: state,
        dinerGrandTotal: data.grandTotal?.unitAmount || 0,
        lineItems: allItems,
        restaurantName: data.store?.name || 'Unknown',
        subtotal: getAmountByChargeId("SUBTOTAL"),
        serviceFee: getAmountByChargeId("SERVICE_FEE"),
        deliveryFee: getAmountByChargeId("DELIVERY_FEE"),
        salesTax: getAmountByChargeId("TAX"),
        driverTip: getAmountByChargeId("TIP"),
        promotionalDiscount: getAmountByChargeId("PROMOTION_DISCOUNT"),
        giftCardCredit: getAmountByChargeId("CREDITS"),  // Added handling for gift card credits
        payments: []  // Assuming handling of payments will be added later
      });
    }
  }
  
  export default OrderData;