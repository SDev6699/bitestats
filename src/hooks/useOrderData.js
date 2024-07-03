/* global chrome */
import { useState, useEffect } from 'react';
import OrderData from '../services/OrderData';

const useOrderData = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Request data from Chrome extension storage
    chrome.runtime.sendMessage({ action: 'getOrderInsights' }, (response) => {
      if (response) {
        const grubhubOrders = response.grubhubOrderResults || [];
        const doordashOrders = response.doordashOrderResults || [];

        const orderObjects = [
          ...grubhubOrders.map(order => OrderData.fromGrubhub(order)),
          ...doordashOrders.map(order => OrderData.fromDoorDash(order))
        ];

        console.log('Fetched Orders:', orderObjects);
        setOrders(orderObjects);
      }
    });
  }, []);

  return { orders };
};

export default useOrderData;