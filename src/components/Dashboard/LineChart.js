import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = ({ data, displayOrderCount }) => {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: displayOrderCount ? 'Order Count' : 'Money Spent ($)',
        data: data.map(item => displayOrderCount ? item.orderCount : item.moneySpent / 100),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
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
        text: displayOrderCount ? 'Order Count Over Time' : 'Money Spent Over Time',
        font: {
          family: 'Roboto',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
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
      <Line data={chartData} options={options} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LineChart;