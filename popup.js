document.addEventListener('DOMContentLoaded', () => {
    const openPageButton = document.getElementById('openPageButton');
    const loader = document.getElementById('loader');
    const message = document.getElementById('message');
  
    // Check the current tab's URL and enable/disable the button accordingly
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      const host = url.hostname;
  
      if (host.includes('grubhub.com') || host.includes('doordash.com')) {
        openPageButton.style.display = 'block';
      } else {
        message.style.display = 'block';
      }
    });
  
    openPageButton.addEventListener('click', () => {
      // Hide the button and show the loader
      openPageButton.style.display = 'none';
      loader.style.display = 'block';
  
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const currentTabId = currentTab.id;
  
        // Reload the current tab
        chrome.tabs.reload(currentTabId, {}, () => {
          // Listen for the tab's loading status
          chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === currentTabId && changeInfo.status === 'complete') {
              // Send message to content script to fetch data
              chrome.tabs.sendMessage(currentTabId, { action: "fetchData" });

              // Listen for confirmation from the content script
              chrome.runtime.onMessage.addListener(function(response) {
                  if (response.status === 'dataStored') {
                      chrome.tabs.create({ url: 'index.html' });
                      chrome.tabs.onUpdated.removeListener(listener);
                      window.close();  // Close the popup
                  }
              });
            }
          });
        });
      });
    });
  });