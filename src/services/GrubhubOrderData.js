import OrderData from './OrderData';

class GrubhubOrderData extends OrderData {
  constructor(data) {
    super(data);
    this.adjustments = data.adjustments || {};
    this.brand = data.brand || '';
    this.fraud = data.fraud || false;
    this.localWhenFor = data.local_when_for || '';
    this.startTime = data.start_time || '';
    this.timePlaced = data.time_placed || '';
  }
}