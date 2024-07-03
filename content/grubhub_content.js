(function() {
    // console.log('Content script running on Grubhub:', window.location.href);
  
    // Fetch Grubhub data immediately when the page is loaded
    fetchGrubhubData();
  
    function fetchGrubhubData() {
      const cookieName = 'ngStorage-oauthTokens';
      const cookies = document.cookie.split('; ');
      let cookieValue = null;
  
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        if (name === cookieName) {
          cookieValue = decodeURIComponent(value);
        }
      });
  
      const localStorageValue = localStorage.getItem('ngStorage-account');
      let uuid = null;
  
      if (localStorageValue) {
        const parsedLocalStorageValue = JSON.parse(localStorageValue);
        uuid = parsedLocalStorageValue.ud_id;
        // console.log('UUID:', uuid);
      } else {
        // console.log('No local storage data found for the specified key.');
      }
  
      if (cookieValue && uuid) {
        const parsedCookieValue = JSON.parse(cookieValue);
        const accessToken = parsedCookieValue.access_token;
        // console.log('Access Token:', accessToken);
  
        chrome.runtime.sendMessage({ action: "fetchGrubhubData", token: accessToken, uuid: uuid }, (response) => {
          if (response.status === 'success') {
            // console.log('Grubhub data fetched successfully');
          } else {
            console.error('Error fetching Grubhub data:', response.error);
          }
        });
      } else {
        // console.log('No cookie data or UUID found for the specified keys.');
      }
    }
  })();