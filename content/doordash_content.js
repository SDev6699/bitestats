(function() {
    // console.log('Content script running on DoorDash:', window.location.href);
  
    // Fetch DoorDash data immediately when the page is loaded
    fetchDoorDashData();
  
    async function fetchDoorDashData() {
      const cookieString = document.cookie;
      const userAgent = navigator.userAgent;
      const secChUa = navigator.userAgentData?.brands.map(brand => `"${brand.brand}";v="${brand.version}"`).join(', ') || '';
      const secChUaPlatform = navigator.userAgentData?.platform || 'Unknown';
  
      const headers = {
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
  
      try {
        const allOrders = await fetchAllPages(headers);
        chrome.runtime.sendMessage({ action: "storeDoorDashData", orders: allOrders }, (response) => {
          if (response.status === 'success') {
            // console.log('All DoorDash data fetched and stored successfully');
          } else {
            console.error('Error storing DoorDash data:', response.error);
          }
        });
      } catch (error) {
        console.error('Error fetching DoorDash data:', error);
      }
    }
  
    async function fetchAllPages(headers) {
      let offset = 0;
      const limit = 10;  // Adjust the limit as needed
      let allOrders = [];
      let hasMoreData = true;
  
      while (hasMoreData) {
        const body = JSON.stringify({
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
  
        const response = await fetch("https://www.doordash.com/graphql/getConsumerOrdersWithDetails?operation=getConsumerOrdersWithDetails", {
          method: 'POST',
          headers: headers,
          body: body
        });
  
        const data = await response.json();
        if (data && data.data && data.data.getConsumerOrdersWithDetails.length > 0) {
          allOrders = allOrders.concat(data.data.getConsumerOrdersWithDetails);
          offset += limit;
        } else {
          hasMoreData = false;
        }
      }
  
      return allOrders;
    }
  
    function getCookieValue(cookieString, name) {
      const match = cookieString.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    }
  })();
  