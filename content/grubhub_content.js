(function () {
  const DEFAULT_PAGE_SIZE = 10;
  const INCREMENTAL_PAGE_SIZE = 2;
  let loginCheckInterval;
  let currentSessionId = null; // Declare as global variable
  let isFetching = false; // Global variable to track fetching status

  // Check if user is logged in and then set fetching flag if logged in
  async function initialize() {
    // Retrieve the session ID and fetching status from local storage
    chrome.storage.local.get(['sessionId', 'grubhubFetching'], (result) => {
      currentSessionId = result.sessionId || null;
      isFetching = result.grubhubFetching || false;
      checkInitialLoginStatus();
    });
  }

  // Check initial login status
  async function checkInitialLoginStatus() {
    const isLoggedIn = await checkGrubhubLoginStatus();
    if (!isLoggedIn) {
      loginCheckInterval = setInterval(async () => {
        const loggedIn = await checkGrubhubLoginStatus();
        if (loggedIn) {
          clearInterval(loginCheckInterval);
        }
      }, 100); // Check every 100 milliseconds
    }
  }

  // Entry point: Fetch initial data when the content script is loaded
  initialize();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") {
      if (!isFetching) {
        checkInitialLoginStatus()
          .then(() => checkAndFetchGrubhubData())
          .then(() => sendResponse({ status: "success" }))
          .catch((error) => sendResponse({ status: "error", error: error.message }));
      } else {
        sendResponse({ status: 'fetching_in_progress' });
      }
      return true; // Keeps the message channel open for sendResponse
    } else if (message.action === "checkLoginStatus") {
      checkGrubhubLoginStatus(true)
        .then((isLoggedIn) => {
          sendResponse({ status: "success", isLoggedIn: isLoggedIn });
        })
        .catch((error) => {
          sendResponse({ status: "error", error: error.message });
        });
      return true; // Keeps the message channel open for sendResponse
    }
  });

  async function checkGrubhubLoginStatus(ischeckLoginStatus = false) {
    const { isLoggedIn, sessionId } = await getGrubhubAuthDetails();
    chrome.storage.local.set({ grubhubLoggedIn: isLoggedIn });
      if (!ischeckLoginStatus && isLoggedIn) {
        chrome.storage.local.set({ grubhubFetching: true });
        isFetching = true;
        if (sessionId !== currentSessionId) {
          currentSessionId = sessionId;
          chrome.storage.local.set({ sessionId: currentSessionId });
  
          // Clear grubhubOrderResults if a new session is detected
          chrome.storage.local.remove("grubhubOrderResults", () => {
          });
        } else if(!isFetching) {
          checkAndFetchGrubhubData();
        }
      } else {
        chrome.storage.local.set({ grubhubFetching: false });
        isFetching = false;
      }
    return isLoggedIn;
  }
  
  async function checkAndFetchGrubhubData() {
    try {
      const existingData = await getExistingGrubhubData();
      // console.log("Existing data length:", existingData.length); // Debug log

      if (existingData.length === 0) {
        // No existing data, fetch with default page size
        await fetchGrubhubData(DEFAULT_PAGE_SIZE);
      } else {
        // Existing data found, fetch with incremental page size
        const existingIds = new Set(existingData.map((order) => order.id));
        await fetchGrubhubData(INCREMENTAL_PAGE_SIZE, existingIds);
      }
    } catch (error) {
      console.error("Error in checkAndFetchGrubhubData:", error);
    }
  }

  async function fetchGrubhubData(pageSize, existingIds = new Set()) {
    const { token, uuid } = await getGrubhubAuthDetails();
    if (!token || !uuid) {
      console.error("Missing token or uuid");
      return;
    }

    try {
      const updatedData = await fetchGrubhubOrders(token, uuid, [], pageSize, existingIds);

      const timestampedOrders = updatedData.map((order) => ({
        ...order,
        fetchedAt: new Date().toISOString(),
      }));

      // console.log("Sending data to background script for storage:", timestampedOrders); // Debug log

      chrome.runtime.sendMessage({ action: "storeGrubhubData", orders: timestampedOrders }, (response) => {
        if (response.status === "success") {
          chrome.storage.local.set({ dataStored: true, grubhubFetching: false });
          isFetching = false;
        } else {
          console.error("Error storing Grubhub data:", JSON.stringify(response.error));
          chrome.storage.local.set({ grubhubFetching: false });
          isFetching = false;
        }
      });
    } catch (error) {
      console.error("Error fetching Grubhub data:", formatErrorLog(error, { token, uuid }));
      chrome.storage.local.set({ grubhubFetching: false });
      isFetching = false;
    }
  }

  async function fetchGrubhubOrders(token, uuid, existingData, pageSize, existingIds) {
    const urlTemplate = `https://api-gtm.grubhub.com/diners/${uuid}/search_listing?pageNum={{pageNum}}&pageSize=${pageSize}&facet=scheduled%3Afalse&facet=orderType%3AALL&sorts=default`;
    return fetchAllPages(urlTemplate, token, {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Origin: "https://www.grubhub.com",
      Referer: "https://www.grubhub.com/",
    }, existingData, pageSize, existingIds);
  }

  async function fetchAllPages(urlTemplate, token, headers, existingData = [], pageSize, existingIds) {
    let currentPage = 1;
    let totalPages = 1;
    const allResults = [...existingData];

    try {
      do {
        const url = urlTemplate.replace("{{pageNum}}", currentPage);
        const data = await fetchDataFromAPI(url, headers);
        // console.log('Fetched data for page:', currentPage, data); // Debug log
        if (!data || !data.results || !data.pager) {
          throw new Error("Invalid data structure");
        }
        const timestamp = new Date().toISOString();
        const newResults = data.results.filter((result) => !existingIds.has(result.id)).map((result) => ({
          ...result,
          fetchedAt: timestamp,
        }));
        if (newResults.length === 0) {
          break; // Stop fetching if no new results
        }
        allResults.push(...newResults);
        currentPage = data.pager.current_page + 1;
        totalPages = data.pager.total_pages;
      } while (currentPage <= totalPages);
    } catch (error) {
      console.error("Error fetching all pages:", error);
      throw error; // Re-throw the error to be caught in the calling function
    }

    return allResults;
  }

  async function fetchDataFromAPI(url, headers) {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      console.error("Response text:", text);
      throw new Error("Invalid JSON response");
    }
  }

  async function getExistingGrubhubData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["grubhubOrderResults"], (result) => {
        resolve(result.grubhubOrderResults || []);
      });
    });
  }

  async function getGrubhubAuthDetails() {
    const cookieName = "ngStorage-oauthTokens";
    const cookies = document.cookie.split("; ");
    let cookieValue = null;

    cookies.forEach((cookie) => {
      const [name, value] = cookie.split("=");
      if (name === cookieName) {
        cookieValue = decodeURIComponent(value);
      }
    });

    const localStorageValue = localStorage.getItem("ngStorage-account");
    let uuid = null;

    if (localStorageValue) {
      const parsedLocalStorageValue = JSON.parse(localStorageValue);
      uuid = parsedLocalStorageValue.ud_id;
    }

    if (cookieValue && uuid) {
      const parsedCookieValue = JSON.parse(cookieValue);
      const accessToken = parsedCookieValue.access_token;
      const sessionId = `${uuid}-${parsedCookieValue.loginTimestamp}`; // Unique session ID
      return { token: accessToken, uuid: uuid, isLoggedIn: true, sessionId };
    }

    return { isLoggedIn: false, sessionId: null };
  }

  function formatErrorLog(error, additionalInfo = {}) {
    return JSON.stringify({
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...additionalInfo,
      timestamp: new Date().toISOString(),
    });
  }
})();
