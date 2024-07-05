(function() {
  // console.log('Content script running on DoorDash:', window.location.href);

  // Listen for messages from the popup script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchData") {
        fetchDoorDashData();
    }
  });

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
      const orderUuids = await fetchOrderUuids(headers);
      const allOrdersDetails = [];

      for (const uuid of orderUuids) {
        const postCheckoutData = await fetchPostCheckoutData(headers, uuid);
        const orderReceiptData = await fetchOrderReceiptData(headers, uuid);
        allOrdersDetails.push({
          uuid,
          postCheckoutData,
          orderReceiptData
        });
      }

      chrome.runtime.sendMessage({ action: "storeDoorDashData", orders: allOrdersDetails }, (response) => {
        if (response.status === 'success') {
          // console.log('All DoorDash data fetched and stored successfully');
          chrome.runtime.sendMessage({ status: 'dataStored' }); // Send confirmation to popup
        } else {
          console.error('Error storing DoorDash data:', response.error);
        }
      });
    } catch (error) {
      console.error('Error fetching DoorDash data:', error);
    }
  }

  async function fetchOrderUuids(headers) {
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
            orderUuid
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
        allOrders = allOrders.concat(data.data.getConsumerOrdersWithDetails.map(order => order.orderUuid));
        offset += limit;
      } else {
        hasMoreData = false;
      }
    }

    return allOrders;
  }

  async function fetchPostCheckoutData(headers, orderUuid) {
    const body = JSON.stringify({
      operationName: "getConsumerOrdersPostCheckout",
      variables: { orderCartId: orderUuid },
      query: `query getConsumerOrdersPostCheckout($orderCartId: ID!) {
        getConsumerOrdersPostCheckout(orderCartId: $orderCartId) {
          __typename storeId consumerId groupCart subtotal totalCharged tipAmount cateringOrderType orderUuid isGift isRetail submittedAt customerSupportProvider orders {
            __typename id consumerId orderItems {
              __typename id name displayString {
                __typename originalUnitPrice finalUnitPrice
              }
              price description quantity purchaseType requestedQuantity {
                __typename discreteQuantity {
                  __typename quantity unit
                }
                continuousQuantity {
                  __typename quantity unit
                }
              }
              fulfillQuantity {
                __typename discreteQuantity {
                  __typename quantity unit
                }
                continuousQuantity {
                  __typename quantity unit
                }
              }
            }
          }
          delivery {
            __typename actualDeliveryTime deliveryUuid isAsap fulfillmentType isConsumerPickup createdAt source
          }
          store {
            __typename id name customerArrivedPickupInstructions phoneNumber address {
              __typename printableAddress state countryShortname
            }
            business {
              __typename id name
            }
          }
          proofOfDelivery {
            __typename type pinCode
          }
          shoppingProtocol orderConfig {
            __typename groupOrderType
          }
        }
      }`
    });

    const response = await fetch("https://www.doordash.com/graphql/getConsumerOrdersPostCheckout", {
      method: 'POST',
      headers: headers,
      body: body
    });

    const result = await response.json();
    return result.data;
  }

  async function fetchOrderReceiptData(headers, orderUuid) {
    const body = JSON.stringify({
      operationName: "getConsumerOrderReceipt",
      variables: { orderCartId: orderUuid },
      query: `query getConsumerOrderReceipt($orderCartId: ID!) {
        getConsumerOrderReceipt(orderCartId: $orderCartId) {
          __typename lineItems {
            __typename label labelIcon discountIcon chargeId finalMoney {
              __typename unitAmount displayString
            }
            originalMoney {
              __typename unitAmount displayString
            }
            tooltip {
              __typename title paragraphs {
                __typename description
              }
            }
            note
          }
          splitBillLineItems {
            __typename
          }
          commissionMessage storeName receiptOrders {
            __typename
          }
          orders {
            __typename creator {
              __typename id localizedNames {
                __typename formalName informalName formalNameAbbreviated
              }
            }
            orderItemsList {
              __typename id specialInstructions substitutionPreference quantity originalQuantity weightedActualQuantity item {
                __typename id name price description priceMonetaryFields {
                  __typename unitAmount currency displayString decimalPlaces sign
                }
              }
              unitPriceMonetaryFields {
                __typename currency unitAmount displayString
              }
              optionsList {
                __typename itemExtraOption {
                  __typename name
                }
              }
            }
            orderItemLineDetails {
              __typename substituteItem {
                __typename
              }
              itemName subTotal {
                __typename currency displayString unitAmount decimalPlaces sign
              }
              specialInstructions substitutionPreference purchaseType isOutOfStock itemOptionDetailsList weightedSoldPriceInfo requestedQuantity {
                __typename discreteQuantity {
                  __typename quantity unit
                }
                continuousQuantity {
                  __typename quantity unit
                }
              }
              fulfilledQuantity {
                __typename discreteQuantity {
                  __typename quantity unit
                }
                continuousQuantity {
                  __typename quantity unit
                }
              }
              lineItemToolTipModal {
                __typename title paragraphs {
                  __typename description
                }
              }
              isUndeliverable imageUrl
            }
          }
          doordashEntityInfo {
            __typename entityName entityAddress entityVatId
          }
          disclaimer liquorLicense {
            __typename
          }
          overauthTotal {
            __typename currency displayString unitAmount decimalPlaces sign
          }
          rewardBalanceEarned {
            __typename
          }
          paymentChargeDetailsList {
            __typename count dataList {
              __typename netAmount {
                __typename currency displayString decimalPlaces unitAmount sign symbol
              }
              originalAmount {
                __typename currency displayString decimalPlaces unitAmount sign symbol
              }
              status paymentMethod {
                __typename ddPaymentMethodId type ebtRemainingBalance {
                  __typename currency displayString decimalPlaces unitAmount sign symbol
                }
              }
              createdAt updatedAt
            }
          }
        }
      }`
    });

    const response = await fetch("https://www.doordash.com/graphql/getConsumerOrderReceipt", {
      method: 'POST',
      headers: headers,
      body: body
    });

    const result = await response.json();
    return result.data;
  }

  function getCookieValue(cookieString, name) {
    const match = cookieString.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }
})();
