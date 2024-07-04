/* global chrome */
import { useState, useEffect } from 'react';
import OrderData from '../services/OrderData';

const useOrderData = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrderData = () => {
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
  };

  useEffect(() => {
    // Initial fetch of order data
    fetchOrderData();

    // Set up storage change listener
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && (changes.grubhubOrderResults || changes.doordashOrderResults)) {
        console.log('Storage changed:', changes);
        fetchOrderData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return { orders };
};

export default useOrderData;
