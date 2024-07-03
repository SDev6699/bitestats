import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const getInitials = (label) => {
  return label
    .split(' ')
    .map(word => word[0])
    .join('');
};

const BarChart = ({ data, displayOrderCount, displayTopRestaurants }) => {
  const topData = data.slice(0, 5);

  const chartData = {
    labels: topData.map(item => getInitials(item.label)),
    datasets: [
      {
        label: displayOrderCount ? 'Order Count' : 'Money Spent ($)',
        data: topData.map(item => displayOrderCount ? item.orderCount : item.moneySpent / 100),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: displayTopRestaurants ?
          (displayOrderCount ? 'Top Restaurants by Order Count' : 'Top Restaurants by Money Spent') :
          (displayOrderCount ? 'Top Dishes by Order Count' : 'Top Dishes by Money Spent'),
        font: {
          family: 'Roboto',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const additionalInfo = displayTopRestaurants ? '' : `(Restaurant: ${topData[context.dataIndex].restaurantName || 'Unknown'})`;
            const orderCount = topData[context.dataIndex].orderCount || 0;
            if (displayOrderCount) {
              return `${label}: ${context.raw}${additionalInfo} (Orders: ${orderCount})`;
            } else {
              return `${label}: $${context.raw}${additionalInfo} (Orders: ${orderCount})`;
            }
          },
          title: function(tooltipItems) {
            return topData[tooltipItems[0].dataIndex].label;
          }
        }
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: displayTopRestaurants ? 'Restaurant' : 'Dish',
          font: {
            family: 'Roboto',
          },
        },
      },
      y: {
        title: {
          display: true,
          text: displayOrderCount ? 'Order Count' : 'Money Spent ($)',
          font: {
            family: 'Roboto',
          },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Bar data={chartData} options={options} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default BarChart;
