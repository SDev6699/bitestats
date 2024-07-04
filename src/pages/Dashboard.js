import React, { useState, useEffect } from 'react';
import useOrderData from '../hooks/useOrderData';
import KPI from '../components/Dashboard/KPI';
import DateRangePickerComponent from '../components/DateRangePicker';
import LineChart from '../components/Dashboard/LineChart';
import BarChart from '../components/Dashboard/BarChart';
import DonutChart from '../components/Dashboard/DonutChart';
import ToggleSwitch from '../components/Dashboard/ToggleSwitch';
import { Grid, Container, Paper, Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { AttachMoney as AttachMoneyIcon, ShoppingBasket as ShoppingBasketIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { Restaurant as RestaurantIcon, LocalMall as LocalMallIcon } from '@mui/icons-material';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const Dashboard = () => {
  const { orders } = useOrderData();
  const [dateRange, setDateRange] = useState([null, dayjs()]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayOrderCountLine, setDisplayOrderCountLine] = useState(false);
  const [displayOrderCountBar, setDisplayOrderCountBar] = useState(false);
  const [displayTopRestaurants, setDisplayTopRestaurants] = useState(false);

  useEffect(() => {
    if (orders.length > 0 && !dateRange[0]) {
      const firstOrderDate = dayjs(orders[orders.length - 1].date);
      setDateRange([firstOrderDate, dayjs()]);
    }
  }, [orders, dateRange]);

  useEffect(() => {
    const filterOrders = () => {
      const filtered = orders.filter(order => {
        const orderDate = dayjs(order.date);
        const isCompleted = order.state === "COMPLETED";
        return isCompleted && (!dateRange[0] || orderDate.isSameOrAfter(dateRange[0], 'day')) &&
          (!dateRange[1] || orderDate.isSameOrBefore(dateRange[1], 'day'));
      });
      setFilteredOrders(filtered);
    };

    filterOrders();
  }, [dateRange, orders]);

  const calculateTotal = (order) => {
    if (order.dinerGrandTotal && order.dinerGrandTotal > 0) {
      return order.dinerGrandTotal;
    }
    return order.lineItems.reduce((total, item) => {
      const itemTotal = item.orderItemExtras
        ? item.orderItemExtras.reduce((extraTotal, extra) => {
            return extraTotal + extra.orderItemExtraOptions.reduce((optionTotal, option) => optionTotal + option.price, 0);
          }, 0) + item.originalItemPrice
        : item.options.reduce((optionTotal, option) => optionTotal + (option.price * option.quantity), 0) + item.originalItemPrice;
      return total + (itemTotal * item.quantity);
    }, 0);
  };

  const totalMoneySpent = filteredOrders.reduce((total, order) => total + calculateTotal(order), 0);
  const totalOrders = filteredOrders.length;
  const totalRestaurants = new Set(filteredOrders.map(order => order.restaurantName)).size;
  const totalItemsOrdered = filteredOrders.reduce((total, order) =>
    total + order.lineItems.reduce((count, item) => count + item.quantity, 0), 0);

  const averageOrderPrice = totalOrders ? ((totalMoneySpent / 100) / totalOrders) : 0;

  const chartData = filteredOrders.reduce((acc, order) => {
    const date = dayjs(order.date).format('MMMM YYYY');
    const moneySpent = calculateTotal(order);
    const orderCount = 1;
    if (!acc[date]) {
      acc[date] = { label: date, moneySpent: 0, orderCount: 0 };
    }
    acc[date].moneySpent += moneySpent;
    acc[date].orderCount += orderCount;
    return acc;
  }, {});

  const chartDataArray = Object.values(chartData).sort((a, b) => new Date(a.label) - new Date(b.label));

  const dishData = filteredOrders.reduce((acc, order) => {
    order.lineItems.forEach(item => {
      const dishName = item.name;
      const moneySpent = item.orderItemExtras
        ? item.orderItemExtras.reduce((extraTotal, extra) => {
            return extraTotal + extra.orderItemExtraOptions.reduce((optionTotal, option) => optionTotal + option.price, 0);
          }, 0) + item.originalItemPrice
        : item.options.reduce((optionTotal, option) => optionTotal + (option.price * option.quantity), 0) + item.originalItemPrice;
      const restaurantName = order.restaurantName;
      if (!acc[dishName]) {
        acc[dishName] = { label: dishName, moneySpent: 0, restaurantName: restaurantName, orderCount: 0 };
      }
      acc[dishName].moneySpent += (moneySpent * item.quantity);
      acc[dishName].orderCount += item.quantity;
    });
    return acc;
  }, {});

  const restaurantData = filteredOrders.reduce((acc, order) => {
    const restaurantName = order.restaurantName;
    const moneySpent = calculateTotal(order);
    const orderCount = 1;
    if (!acc[restaurantName]) {
      acc[restaurantName] = { label: restaurantName, moneySpent: 0, orderCount: 0 };
    }
    acc[restaurantName].moneySpent += moneySpent;
    acc[restaurantName].orderCount += orderCount;
    return acc;
  }, {});

  const dishDataArray = Object.values(dishData).sort((a, b) => displayOrderCountBar ? b.orderCount - a.orderCount : b.moneySpent - a.moneySpent).slice(0, 10);
  const restaurantDataArray = Object.values(restaurantData).sort((a, b) => displayOrderCountBar ? b.orderCount - a.orderCount : b.moneySpent - a.moneySpent).slice(0, 10);

  // New: Calculate order timings for Donut chart
  const orderTimings = filteredOrders.reduce((acc, order) => {
    const hour = dayjs(order.date).hour();
    if (hour >= 5 && hour < 12) {
      acc.morning += 1;
    } else if (hour >= 12 && hour < 17) {
      acc.afternoon += 1;
    } else if (hour >= 17 && hour < 24) {
      acc.evening += 1;
    }
    return acc;
  }, { morning: 0, afternoon: 0, evening: 0 });

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <DateRangePickerComponent dateRange={dateRange} setDateRange={setDateRange} orders={orders} />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <KPI
                    title="Total Spend"
                    value={`$${(totalMoneySpent / 100).toFixed(2)}`}
                    Icon={AttachMoneyIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <KPI
                    title="Orders Count"
                    value={totalOrders}
                    Icon={LocalMallIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <KPI
                    title="Restaurants"
                    value={totalRestaurants}
                    Icon={RestaurantIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <KPI
                    title="Avg Order Price"
                    value={`$${averageOrderPrice.toFixed(2)}`}
                    Icon={ReceiptIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <KPI
                    title="Items Ordered"
                    value={totalItemsOrdered}
                    Icon={ShoppingBasketIcon}
                  />
                </Grid>
              </Grid>
            </Grid>
            {filteredOrders.length > 0 ? (
              <>
                <Grid item xs={12} container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6} container direction="column" alignItems="center" justifyContent="center" style={{ height: '400px' }}>
                    <DonutChart data={orderTimings} />
                  </Grid>
                  <Grid item xs={12} md={6} style={{ height: '450px' }}>
                    <div style={{ position: 'relative', height: '100%', paddingTop: '10px' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <ToggleSwitch 
                          checked={displayOrderCountBar} 
                          onChange={() => setDisplayOrderCountBar(!displayOrderCountBar)} 
                          labelOn="Count" 
                          labelOff="Spent" 
                        />
                        <ToggleSwitch 
                          checked={displayTopRestaurants} 
                          onChange={() => setDisplayTopRestaurants(!displayTopRestaurants)} 
                          labelOn="Rest" 
                          labelOff="Dish" 
                        />
                      </div>
                      <BarChart 
                        data={displayTopRestaurants ? restaurantDataArray : dishDataArray} 
                        displayOrderCount={displayOrderCountBar} 
                        displayTopRestaurants={displayTopRestaurants} 
                      />
                    </div>
                  </Grid>
                </Grid>
                <Grid item xs={12} style={{ height: '450px' }}>
                  <div style={{ position: 'relative', height: '100%', paddingTop: '10px' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, display: 'flex', gap: '10px', flexDirection: 'column' }}>
                      <ToggleSwitch 
                        checked={displayOrderCountLine} 
                        onChange={() => setDisplayOrderCountLine(!displayOrderCountLine)} 
                        labelOn="Count" 
                        labelOff="Spent" 
                      />
                    </div>
                    <LineChart 
                      data={chartDataArray} 
                      displayOrderCount={displayOrderCountLine} 
                    />
                  </div>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Typography variant="h6" align="center">No orders available for the selected date range.</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
