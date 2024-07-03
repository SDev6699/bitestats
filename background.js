async function fetchDataFromAPI(url, headers) {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('Response text:', text);
      throw new Error('Invalid JSON response');
    }
  }
  
  async function fetchAllPages(urlTemplate, token, headers) {
    let currentPage = 1;
    let totalPages = 1;
    const allResults = [];
  
    try {
      do {
        const url = urlTemplate.replace('{{pageNum}}', currentPage);
        const data = await fetchDataFromAPI(url, headers);
        if (!data || !data.results || !data.pager) {
          throw new Error('Invalid data structure');
        }
        allResults.push(...data.results);
        currentPage = data.pager.current_page + 1;
        totalPages = data.pager.total_pages;
      } while (currentPage <= totalPages);
    } catch (error) {
      console.error('Error fetching all pages:', error);
      throw error; // Re-throw the error to be caught in the calling function
    }
  
    chrome.storage.local.remove('doordashOrderResults', () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing DoorDash order results:', chrome.runtime.lastError);
      } else {
        // console.log('DoorDash order results cleared successfully');
      }
    });
  
    chrome.storage.local.set({ grubhubOrderResults: allResults });
    // console.log('Grubhub data fetched successfully');
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchGrubhubData" && message.token && message.uuid) {
      fetchGrubhubOrders(message.token, message.uuid).then(() => {
        sendResponse({ status: 'success' });
      }).catch(error => {
        console.error('Error fetching Grubhub data:', error);
        sendResponse({ status: 'error', error: error.message });
      });
      return true; // Keeps the message channel open for sendResponse
    }
  
    if (message.action === "fetchDoorDashData" && message.headers) {
      fetchDoorDashOrders(message.headers).then(() => {
        sendResponse({ status: 'success' });
      }).catch(error => {
        console.error('Error fetching DoorDash data:', error);
        sendResponse({ status: 'error', error: error.message });
      });
      return true; // Keeps the message channel open for sendResponse
    }
  
    if (message.action === "getOrderInsights") {
      chrome.storage.local.get(['grubhubOrderResults', 'doordashOrderResults'], (result) => {
        sendResponse({ 
          grubhubOrderResults: result.grubhubOrderResults,
          doordashOrderResults: result.doordashOrderResults
        });
      });
      return true; // Keeps the message channel open for sendResponse
    }
  
    if (message.action === "storeDoorDashData" && message.orders) {
      chrome.storage.local.set({ doordashOrderResults: message.orders }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing DoorDash order results:', chrome.runtime.lastError);
          sendResponse({ status: 'error', error: chrome.runtime.lastError });
        } else {
          // console.log('DoorDash order results stored successfully');
          sendResponse({ status: 'success' });
        }
      });
      return true; // Keeps the message channel open for sendResponse
    }
  });
  
  async function fetchGrubhubOrders(token, uuid) {
    const urlTemplate = `https://api-gtm.grubhub.com/diners/${uuid}/search_listing?pageNum={{pageNum}}&pageSize=10&facet=scheduled%3Afalse&facet=orderType%3AALL&sorts=default`;
    return fetchAllPages(urlTemplate, token, {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Origin': 'https://www.grubhub.com',
      'Referer': 'https://www.grubhub.com/'
    });
  }
  
  