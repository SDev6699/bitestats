(function() {
  const DEFAULT_PAGE_SIZE = 10;
  const INCREMENTAL_PAGE_SIZE = 2;
  let loginCheckInterval;
  let currentSessionId = null; // Declare as global variable
  let isFetching = false; // Global variable to track fetching status

  // Check if user is logged in and then set fetching flag if logged in
  async function initialize() {
    // Retrieve the session ID and fetching status from local storage
    chrome.storage.local.get(['sessionId', 'doordashFetching'], (result) => {
      currentSessionId = result.sessionId || null;
      isFetching = result.doordashFetching || false;
      checkInitialLoginStatus();
    });
  }

  // Check initial login status
  async function checkInitialLoginStatus() {
    const isLoggedIn = await checkDoorDashLoginStatus();
    if (!isLoggedIn) {
      loginCheckInterval = setInterval(async () => {
        // console.log("User not logged in");
        const loggedIn = await checkDoorDashLoginStatus();
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
      // console.log("IsFetching: ", isFetching)
      if (!isFetching) {
        checkInitialLoginStatus()
          .then(() => checkAndFetchDoorDashData())
          .then(() => sendResponse({ status: 'success' }))
          .catch(error => sendResponse({ status: 'error', error: error.message }));
      } else {
        sendResponse({ status: 'fetching_in_progress' });
      }
      return true; // Keeps the message channel open for sendResponse
    } else if (message.action === "checkLoginStatus") {
      checkDoorDashLoginStatus(true)
        .then((isLoggedIn) => {
          sendResponse({ status: 'success', isLoggedIn: isLoggedIn });
        })
        .catch((error) => {
          sendResponse({ status: 'error', error: error.message });
        });
      return true; // Keeps the message channel open for sendResponse
    }
  });

  async function checkAndFetchDoorDashData() {
    try {
      const existingData = await getExistingDoorDashData();
      // console.log("Existing data length:", existingData.length); // Debug log

      if (existingData.length === 0) {
        // No existing data, fetch with default page size
        await fetchDoorDashData(DEFAULT_PAGE_SIZE);
      } else {
        // Existing data found, fetch with incremental page size
        const existingIds = new Set(existingData.map(order => order.id));
        await fetchDoorDashData(INCREMENTAL_PAGE_SIZE, existingIds);
      }
    } catch (error) {
      console.error("Error in checkAndFetchDoorDashData:", error);
    }
  }

  async function fetchDoorDashData(pageSize, existingIds = new Set()) {
    const headers = getHeaders();
    try {
      const updatedData = await fetchDoorDashOrders(headers, [], pageSize, existingIds);

      // Fetch order receipt data for each order
      for (const order of updatedData) {
        try {
          const orderReceiptData = await fetchOrderReceiptData(headers, order.orderUuid);
          order.orderReceiptData = orderReceiptData;
        } catch (error) {
          console.error(`Error fetching receipt data for order ${order.orderUuid}:`, error);
        }
      }

      const timestampedOrders = updatedData.map(order => ({
        ...order,
        fetchedAt: new Date().toISOString()
      }));

      // console.log("Sending data to background script for storage:", timestampedOrders); // Debug log

      chrome.runtime.sendMessage({ action: "storeDoorDashData", orders: timestampedOrders }, (response) => {
        if (response.status === 'success') {
          // console.log('Data stored successfully.');
          chrome.storage.local.set({ doordashFetching: false, dataStored: true });
          isFetching = false;
        } else {
          console.error('Error storing DoorDash data:', JSON.stringify(response.error));
          chrome.storage.local.set({ doordashFetching: false });
          isFetching = false;
        }
      });
    } catch (error) {
      console.error('Error fetching DoorDash data:', formatErrorLog(error, headers));
      chrome.storage.local.set({ doordashFetching: false });
      isFetching = false;
    }
  }

  async function fetchDoorDashOrders(headers, existingData, pageSize, existingIds) {
    const urlTemplate = `https://www.doordash.com/graphql/getConsumerOrdersWithDetails?operation=getConsumerOrdersWithDetails`;
    return fetchAllPages(urlTemplate, headers, existingData, pageSize, existingIds);
  }

  async function fetchAllPages(urlTemplate, headers, existingData = [], pageSize, existingIds) {
    let offset = 0;
    const limit = pageSize;
    let allResults = [...existingData];
    let hasMoreData = true;

    try {
      while (hasMoreData) {
        const body = createOrderDataQuery(offset, limit);
        const response = await fetch(urlTemplate, {
          method: 'POST',
          headers: headers,
          body: body
        });

        const data = await response.json();
        if (data && data.data && data.data.getConsumerOrdersWithDetails.length > 0) {
          const timestamp = new Date().toISOString();
          const newResults = data.data.getConsumerOrdersWithDetails
            .filter(result => !existingIds.has(result.id))
            .map(result => ({
              ...result,
              fetchedAt: timestamp
            }));

          if (newResults.length === 0) {
            hasMoreData = false;
            break;
          }

          allResults = allResults.concat(newResults);
          offset += limit;

          if (newResults.length < limit) {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
      }
    } catch (error) {
      console.error('Error fetching all pages:', error);
      throw error; // Re-throw the error to be caught in the calling function
    }

    return allResults;
  }

  async function fetchOrderReceiptData(headers, orderUuid) {
    const body = createReceiptDataQuery(orderUuid);
    const updatedHeaders = {
      ...headers,
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Referer": `https://www.doordash.com/orders/`,
      "origin": "https://www.doordash.com",
      "priority": "u=1, i"
    };

    try {
      const response = await fetch("https://www.doordash.com/graphql/getConsumerOrderReceipt", {
        method: 'POST',
        headers: updatedHeaders,
        body: body
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return result.data.getConsumerOrderReceipt;
    } catch (error) {
      console.error('Error fetching order receipt data:', formatErrorLog(error, updatedHeaders, orderUuid));
      throw error;
    }
  }

  async function getExistingDoorDashData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['doordashOrderResults'], (result) => {
        resolve(result.doordashOrderResults || []);
      });
    });
  }

  async function checkDoorDashLoginStatus(ischeckLoginStatus = false) {
    // console.log("isCheckLoginStatus: ", ischeckLoginStatus, isFetching)
    const cookieName = "dd_cx_logged_in"; // Check for this cookie to determine login status
    const cookieValue = getCookieValue(document.cookie, cookieName);
    const isLoggedIn = cookieValue !== null;
    chrome.storage.local.set({ doordashLoggedIn: isLoggedIn });

    if (!ischeckLoginStatus && isLoggedIn) {
      chrome.storage.local.set({ doordashFetching: true });
      isFetching = true;
      // console.log("Fetching True checkDoorDashLoginStatus");
      const sessionId = `${cookieValue}`; // Use cookie value as session ID
      if (sessionId !== currentSessionId) {
        currentSessionId = sessionId;
        chrome.storage.local.set({ sessionId: currentSessionId });

        // Clear doordashOrderResults if a new session is detected
        chrome.storage.local.remove("doordashOrderResults", () => {
          // checkAndFetchDoorDashData();
        });
      } else {
        if(!isFetching) {
          checkAndFetchDoorDashData();
        }
      }
    } else {
      // console.log("Fetching False checkDoorDashLoginStatus");
      chrome.storage.local.set({ doordashFetching: false });
      isFetching = false;
    }
    return isLoggedIn;
  }

  function getCookieValue(cookieString, name) {
    const match = cookieString.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
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

  // Function to get request headers
  function getHeaders() {
    const cookieString = document.cookie;
    const secChUa = navigator.userAgentData?.brands.map(brand => `"${brand.brand}";v="${brand.version}"`).join(', ') || '';
    const secChUaPlatform = navigator.userAgentData?.platform || 'Unknown';

    return {
      "accept": "*/*",
      "accept-language": navigator.language || 'en-US',
      "apollographql-client-name": "@doordash/app-consumer-production-ssr-client",
      "apollographql-client-version": "3.0",
      "content-type": "application/json",
      "sec-ch-ua": secChUa,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": secChUaPlatform,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-channel-id": "marketplace",
      "x-csrftoken": getCookieValue(cookieString, 'csrf_token'),
      "x-experience-id": "doordash",
      "cookie": cookieString,
      "Referer": "https://www.doordash.com/orders/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };
  }

  // Function to create the GraphQL query for order data
  function createOrderDataQuery(offset, limit) {
    return JSON.stringify({
      operationName: "getConsumerOrdersWithDetails",
      variables: { offset: offset, limit: limit, includeCancelled: true },
      query: `query getConsumerOrdersWithDetails($offset: Int!, $limit: Int!, $includeCancelled: Boolean) {
        getConsumerOrdersWithDetails(offset: $offset, limit: $limit, includeCancelled: $includeCancelled) {
          id
          orderUuid
          deliveryUuid
          createdAt
          submittedAt
          cancelledAt
          fulfilledAt
          specialInstructions
          isConsumerSubscriptionEligible
          isGroup
          isReorderable
          isGift
          isPickup
          isMerchantShipping
          containsAlcohol
          fulfillmentType
          shoppingProtocol
          creator {
            id
            firstName
            lastName
          }
          deliveryAddress {
            id
            formattedAddress
          }
          orders {
            id
            creator {
              id
              firstName
              lastName
            }
            items {
              id
              name
              quantity
              specialInstructions
              substitutionPreferences
              orderItemExtras {
                menuItemExtraId
                name
                orderItemExtraOptions {
                  menuExtraOptionId
                  name
                  description
                  price
                  quantity
                }
              }
              purchaseQuantity {
                continuousQuantity {
                  quantity
                  unit
                }
                discreteQuantity {
                  quantity
                  unit
                }
              }
              fulfillQuantity {
                continuousQuantity {
                  quantity
                  unit
                }
                discreteQuantity {
                  quantity
                  unit
                }
              }
              originalItemPrice
              purchaseType
            }
          }
          paymentCard {
            id
            last4
            type
          }
          grandTotal {
            unitAmount
            currency
            decimalPlaces
            displayString
            sign
          }
          likelyOosItems {
            menuItemId
            name
            photoUrl
          }
          pollingInterval
          store {
            id
            name
            business {
              id
              name
            }
            phoneNumber
            fulfillsOwnDeliveries
            customerArrivedPickupInstructions
            isPriceMatchingEnabled
            priceMatchGuaranteeInfo {
              headerDisplayString
              bodyDisplayString
              buttonDisplayString
            }
          }
          recurringOrderDetails {
            itemNames
            consumerId
            recurringOrderUpcomingOrderUuid
            scheduledDeliveryDate
            arrivalTimeDisplayString
            storeName
            isCancelled
          }
          bundleOrderInfo {
            primaryBundleOrderUuid
            primaryBundleOrderId
            bundleOrderUuids
            bundleOrderConfig {
              bundleType
              bundleOrderRole
            }
          }
          cancellationPendingRefundInfo {
            state
            originalPaymentAmount {
              unitAmount
              currency
              decimalPlaces
              displayString
              sign
            }
            creditAmount {
              unitAmount
              currency
              decimalPlaces
              displayString
              sign
            }
          }
        }
      }`
    });
  }

  // Function to create the GraphQL query for receipt data
  function createReceiptDataQuery(orderUuid) {
    return JSON.stringify({
      operationName: "getConsumerOrderReceipt",
      variables: { orderCartId: orderUuid },
      query: `query getConsumerOrderReceipt($orderCartId: ID!) {
        getConsumerOrderReceipt(orderCartId: $orderCartId) {
          __typename
          lineItems {
            __typename
            label
            labelIcon
            discountIcon
            chargeId
            finalMoney {
              __typename
              unitAmount
              displayString
            }
            originalMoney {
              __typename
              unitAmount
              displayString
            }
            tooltip {
              __typename
              title
              paragraphs {
                __typename
                description
              }
            }
            note
          }
          splitBillLineItems {
            __typename
          }
          commissionMessage
          storeName
          receiptOrders {
            __typename
          }
          orders {
            __typename
            creator {
              __typename
              id
              localizedNames {
                __typename
                formalName
                informalName
                formalNameAbbreviated
              }
            }
            orderItemsList {
              __typename
              id
              specialInstructions
              substitutionPreference
              quantity
              originalQuantity
              weightedActualQuantity
              item {
                __typename
                id
                name
                price
                description
                priceMonetaryFields {
                  __typename
                  unitAmount
                  currency
                  displayString
                  decimalPlaces
                  sign
                }
              }
              unitPriceMonetaryFields {
                __typename
                currency
                unitAmount
                displayString
              }
              optionsList {
                __typename
                itemExtraOption {
                  __typename
                  name
                }
              }
            }
            orderItemLineDetails {
              __typename
              substituteItem {
                __typename
              }
              itemName
              subTotal {
                __typename
                currency
                displayString
                unitAmount
                decimalPlaces
                sign
              }
              specialInstructions
              substitutionPreference
              purchaseType
              isOutOfStock
              itemOptionDetailsList
              weightedSoldPriceInfo
              requestedQuantity {
                __typename
                discreteQuantity {
                  __typename
                  quantity
                  unit
                }
                continuousQuantity {
                  __typename
                  quantity
                  unit
                }
              }
              fulfilledQuantity {
                __typename
                discreteQuantity {
                  __typename
                  quantity
                  unit
                }
                continuousQuantity {
                  __typename
                  quantity
                  unit
                }
              }
              lineItemToolTipModal {
                __typename
                title
                paragraphs {
                  __typename
                  description
                }
              }
              isUndeliverable
              imageUrl
            }
          }
          doordashEntityInfo {
            __typename
            entityName
            entityAddress
            entityVatId
          }
          disclaimer
          liquorLicense {
            __typename
          }
          overauthTotal {
            __typename
            currency
            displayString
            unitAmount
            decimalPlaces
            sign
          }
          rewardBalanceEarned {
            __typename
          }
          paymentChargeDetailsList {
            __typename
            count
            dataList {
              __typename
              netAmount {
                __typename
                currency
                displayString
                decimalPlaces
                unitAmount
                sign
                symbol
              }
              originalAmount {
                __typename
                currency
                displayString
                decimalPlaces
                unitAmount
                sign
                symbol
              }
              status
              paymentMethod {
                __typename
                ddPaymentMethodId
                type
                ebtRemainingBalance {
                  __typename
                  currency
                  displayString
                  decimalPlaces
                  unitAmount
                  sign
                  symbol
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      }`
    });
  }
})();
