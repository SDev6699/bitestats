document.addEventListener('DOMContentLoaded', () => {
  const openPageButton = document.getElementById('openPageButton');
  const loader = document.getElementById('loader');
  const fetchingMessage = document.getElementById('fetchingMessage');
  const messageDiv = document.getElementById('message');
  let isButtonClicked = false; // Global variable to track button click status

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

  function checkLoginStatusAndUpdateUI() {
    chrome.storage.local.get(['grubhubLoggedIn', 'doordashLoggedIn'], (result) => {
      if (!result.grubhubLoggedIn && !result.doordashLoggedIn) {
        messageDiv.innerText = "Please log in to Grubhub or DoorDash.";
        messageDiv.style.display = 'block';
        openPageButton.style.display = 'none';
        loader.style.display = 'none';
        fetchingMessage.style.display = 'none';
      } else {
        chrome.storage.local.get(['grubhubFetching', 'doordashFetching'], (result) => {
          updateUIBasedOnFetching(result.grubhubFetching || result.doordashFetching);
        });
      }
    });
  }

  // Listen to storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if ('grubhubFetching' in changes || 'doordashFetching' in changes) {
        const newFetchingStatus = changes.grubhubFetching ? changes.grubhubFetching.newValue : changes.doordashFetching.newValue;
        updateUIBasedOnFetching(newFetchingStatus);
      }
      if ('dataStored' in changes && changes.dataStored.newValue) {
        if (isButtonClicked) { // Check if the button was clicked
          chrome.tabs.create({ url: 'index.html' });
        }
      }
      if ('grubhubLoggedIn' in changes || 'doordashLoggedIn' in changes) {
        checkLoginStatusAndUpdateUI();
      }
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
      chrome.runtime.sendMessage({ action: "setHost", host: host }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error setting host:', chrome.runtime.lastError);
        } else if (response && response.status !== 'success') {
          console.error('Error in response from background script:', response.error);
        } else {
          checkLoginStatusAndUpdateUI();

          // Send request to content script to set grubhubLoggedIn or doordashLoggedIn flag when the extension icon is clicked
          chrome.tabs.sendMessage(currentTab.id, { action: "checkLoginStatus" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message to content script:', chrome.runtime.lastError);
            } else if (response && response.status !== 'success') {
              console.error('Error in response from content script:', response.error);
            }
          });
        }
      });
    }
  });

  openPageButton.addEventListener('click', () => {
    isButtonClicked = true; // Set the button click status to true
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      const host = url.hostname;

      if (host.includes('grubhub.com') || host.includes('doordash.com')) {
        const fetchingKey = host.includes('grubhub.com') ? 'grubhubFetching' : 'doordashFetching';
        chrome.storage.local.set({ [fetchingKey]: true, dataStored: false }, () => {
          updateUIBasedOnFetching(true);

          // Send message to content script to fetch data
            chrome.tabs.sendMessage(currentTab.id, { action: "fetchData" }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending message to content script:', chrome.runtime.lastError);
                chrome.storage.local.set({ [fetchingKey]: false });
              } else if (response && response.status === 'fetching_in_progress') {
                // console.log('Fetching already in progress.');
                updateUIBasedOnFetching(true); // Ensure UI shows fetching in progress
              } else if (response && response.status !== 'success') {
                console.error('Error in response from content script:', response.error);
                chrome.storage.local.set({ [fetchingKey]: false });
              }
            });
        });
      } else {
        messageDiv.innerText = "This extension works only on Grubhub and DoorDash.";
        messageDiv.style.display = 'block';
      }
    });
  });
});
