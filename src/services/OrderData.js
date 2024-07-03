class OrderData {
    constructor(data) {
      this.date = this.parseDate(data.date);
      this.state = data.state;
      this.dinerGrandTotal = data.dinerGrandTotal || 0;
      this.lineItems = data.lineItems || [];
      this.restaurantName = data.restaurantName || 'Unknown';
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
      return new OrderData({
        date: data.time_placed,
        state: data.state,
        dinerGrandTotal: data.charges?.diner_grand_total || 0,
        lineItems: data.charges?.lines?.line_items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          originalItemPrice: item.diner_total || 0,
          options: item.options.map(option => ({
            price: option.price || 0,
            quantity: option.quantity || 1
          }))
        })) || [],
        restaurantName: data.restaurants?.[0]?.name || 'Unknown'
      });
    }
  
    static fromDoorDash(data) {
      const state = data.cancelledAt ? 'CANCELLED' : 'COMPLETED';
      return new OrderData({
        date: data.createdAt,
        state: state,
        dinerGrandTotal: data.grandTotal?.unitAmount || 0,
        lineItems: data.orders?.[0]?.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          originalItemPrice: item.originalItemPrice || 0,
          orderItemExtras: item.orderItemExtras || []
        })) || [],
        restaurantName: data.store?.name || 'Unknown'
      });
    }
  }
  
  export default OrderData;