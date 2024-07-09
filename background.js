chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Received message:', message);

  if (message.action === "setHost" && message.host) {
    chrome.storage.local.set({ host: message.host }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting host:', chrome.runtime.lastError);
        sendResponse({ status: 'error', error: chrome.runtime.lastError });
      } else {
        // console.log('Host set successfully:', message.host);
        sendResponse({ status: 'success' });
      }
    });
    return true; // Keeps the message channel open for sendResponse
  }

  if (message.action === "fetchSiteData" && message.site) {
    chrome.storage.local.get('host', (result) => {
      const host = result.host;
      if (!host) {
        console.error('Host not found in local storage.');
        sendResponse({ status: 'error', error: 'Host not found' });
        return;
      }
      // console.log('Fetching data for host:', host);
      if (host.includes('grubhub.com') && message.site === 'grubhub') {
        fetchAllDataForSite('grubhub').then(() => {
          sendResponse({ status: 'success' });
        }).catch(error => {
          console.error('Error fetching Grubhub data:', error);
          sendResponse({ status: 'error', error: error.message });
        });
      } else if (host.includes('doordash.com') && message.site === 'doordash') {
        fetchAllDataForSite('doordash').then(() => {
          sendResponse({ status: 'success' });
        }).catch(error => {
          console.error('Error fetching DoorDash data:', error);
          sendResponse({ status: 'error', error: error.message });
        });
      } else {
        console.error('Unsupported host or site:', host, message.site);
        sendResponse({ status: 'error', error: 'Unsupported host or site' });
      }
    });
    return true; // Keeps the message channel open for sendResponse
  }

  if (message.action === "getOrderInsights") {
    chrome.storage.local.get(['grubhubOrderResults', 'doordashOrderResults'], (result) => {
      // console.log('Order insights:', result);
      sendResponse({
        grubhubOrderResults: result.grubhubOrderResults,
        doordashOrderResults: result.doordashOrderResults
      });
    });
    return true; // Keeps the message channel open for sendResponse
  }

  if (message.action === "storeDoorDashData" && message.orders) {
    // console.log('Storing DoorDash data:', message.orders);
    const newOrders = message.orders.map(order => ({
      ...order,
      fetchedAt: new Date().toISOString()
    }));

    chrome.storage.local.get('doordashOrderResults', (result) => {
      const existingOrders = result.doordashOrderResults || [];
      const updatedOrders = [...newOrders, ...existingOrders];

      chrome.storage.local.set({ doordashOrderResults: updatedOrders }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing DoorDash order results:', chrome.runtime.lastError);
          sendResponse({ status: 'error', error: chrome.runtime.lastError });
        } else {
          // console.log('DoorDash order results stored successfully');
          sendResponse({ status: 'success' });
          // Update fetching status to false after data storage
          chrome.storage.local.set({ fetching: false });
        }
      });
    });

    return true; // Keeps the message channel open for sendResponse
  }

  if (message.action === "storeGrubhubData" && message.orders) {
    // console.log('Storing Grubhub data:', message.orders);
    const newOrders = message.orders.map(order => ({
      ...order,
      fetchedAt: new Date().toISOString()
    }));

    chrome.storage.local.get('grubhubOrderResults', (result) => {
      const existingOrders = result.grubhubOrderResults || [];
      const updatedOrders = [...newOrders, ...existingOrders];

      chrome.storage.local.set({ grubhubOrderResults: updatedOrders }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing Grubhub order results:', chrome.runtime.lastError);
          sendResponse({ status: 'error', error: chrome.runtime.lastError });
        } else {
          // console.log('Grubhub order results stored successfully');
          sendResponse({ status: 'success' });
           // Update fetching status to false after data storage
           chrome.storage.local.set({ fetching: false });
        }
      });
    });

    return true; // Keeps the message channel open for sendResponse
  }
});

async function fetchAllDataForSite(site) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const url = new URL(currentTab.url);
  const host = url.hostname;

  // console.log('Fetching data for site:', site, 'on host:', host);

  if (site === 'grubhub' && host.includes('grubhub.com')) {
    const grubhubData = await chrome.tabs.sendMessage(currentTab.id, { action: "fetchData" });
    return grubhubData;
  } else if (site === 'doordash' && host.includes('doordash.com')) {
    const doordashData = await chrome.tabs.sendMessage(currentTab.id, { action: "fetchData" });
    return doordashData;
  } else {
    throw new Error('Unsupported host');
  }
}
