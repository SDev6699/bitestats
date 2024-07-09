document.addEventListener('DOMContentLoaded', () => {
    const openPageButton = document.getElementById('openPageButton');
    const loader = document.getElementById('loader');
    const fetchingMessage = document.getElementById('fetchingMessage');
    const messageDiv = document.getElementById('message');
  
    function updateUIBasedOnFetching(fetching) {
      if (fetching) {
        loader.style.display = 'block';
        fetchingMessage.style.display = 'block';
        openPageButton.style.display = 'none';
        messageDiv.style.display = 'none';
      } else {
        loader.style.display = 'none';
        fetchingMessage.style.display = 'none';
        openPageButton.style.display = 'block';
        messageDiv.style.display = 'none';
      }
    }
  
    // Listen to storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && 'fetching' in changes) {
        const newFetchingStatus = changes.fetching.newValue;
        updateUIBasedOnFetching(newFetchingStatus);
      }
    });
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      const host = url.hostname;
  
      if (!host.includes('grubhub.com') && !host.includes('doordash.com')) {
        messageDiv.innerText = "This extension works only on Grubhub and DoorDash.";
        messageDiv.style.display = 'block';
        openPageButton.style.display = 'none';
        loader.style.display = 'none';
        fetchingMessage.style.display = 'none';
      } else {
        chrome.storage.local.get(['fetching'], (result) => {
          updateUIBasedOnFetching(result.fetching);
        });
      }
    });
  
    openPageButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        const host = url.hostname;
  
        if (host.includes('grubhub.com') || host.includes('doordash.com')) {
          chrome.storage.local.set({ fetching: true }, () => {
            updateUIBasedOnFetching(true);
  
            chrome.runtime.sendMessage({ action: "setHost", host: host }, (response) => {
              if (response.status === 'success') {
                chrome.runtime.sendMessage({ action: "fetchSiteData", site: host.includes('grubhub.com') ? 'grubhub' : 'doordash' }, (response) => {
                  if (chrome.runtime.lastError || (response && response.status !== 'success')) {
                    console.error('Data fetch failed or error sending message:', chrome.runtime.lastError?.message || response);
                    chrome.storage.local.set({ fetching: false });
                  } else {
                    // console.log('Data fetch successful:', response);
                    chrome.tabs.create({ url: 'index.html' });
                  }
                });
              } else {
                console.error('Failed to set host:', response.error);
                chrome.storage.local.set({ fetching: false });
              }
            });
          });
        } else {
          // console.log('Unsupported host:', host);
          messageDiv.innerText = "This extension works only on Grubhub and DoorDash.";
          messageDiv.style.display = 'block';
        }
      });
    });
  });
  