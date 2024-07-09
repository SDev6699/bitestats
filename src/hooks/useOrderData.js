/* global chrome */
import { useState, useEffect } from 'react';
import OrderData from '../services/OrderData';

const useOrderData = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrderData = () => {
    // Request data from Chrome extension storage
    chrome.runtime.sendMessage({ action: 'getOrderInsights' }, (response) => {
      if (response) {
        chrome.storage.local.get(['host'], (result) => {
          const host = result.host || '';
          let orderObjects = [];

          if (host.includes('grubhub.com')) {
            const grubhubOrders = response.grubhubOrderResults || [];
            orderObjects = grubhubOrders.map(order => OrderData.fromGrubhub(order));
          } else if (host.includes('doordash.com')) {
            const doordashOrders = response.doordashOrderResults || [];
            orderObjects = doordashOrders.map(order => OrderData.fromDoorDash(order));
          }

          // console.log('Fetched Orders:', orderObjects);
          setOrders(orderObjects);
        });
      }
    });
  };

  useEffect(() => {
    // Initial fetch of order data
    fetchOrderData();
  }, []); // Empty dependency array means this runs once after the initial render

  return { orders };
};

export default useOrderData;
