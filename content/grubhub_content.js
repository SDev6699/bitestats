(function () {
  const DEFAULT_PAGE_SIZE = 10;
  const INCREMENTAL_PAGE_SIZE = 2;

  // Set fetching flag when content script starts
  chrome.storage.local.set({ fetching: true });

  // Entry point: Fetch initial data when the content script is loaded
  checkAndFetchGrubhubData();

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") {
      checkAndFetchGrubhubData()
        .then(() => sendResponse({ status: "success" }))
        .catch((error) => sendResponse({ status: "error", error: error.message }));
      return true; // Keeps the message channel open for sendResponse
    }
  });

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
          // console.log("Data stored successfully.");
          chrome.runtime.sendMessage({ status: "dataStored" });
        } else {
          console.error("Error storing Grubhub data:", JSON.stringify(response.error));
        }
      });
    } catch (error) {
      console.error("Error fetching Grubhub data:", formatErrorLog(error, { token, uuid }));
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
      // console.log("UUID:", uuid); // Debug log for UUID
    } else {
      // console.log("No local storage data found for the specified key.");
    }

    if (cookieValue && uuid) {
      const parsedCookieValue = JSON.parse(cookieValue);
      const accessToken = parsedCookieValue.access_token;
      // console.log("Access Token:", accessToken); // Debug log for Access Token
      return { token: accessToken, uuid: uuid };
    }

    return {};
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
