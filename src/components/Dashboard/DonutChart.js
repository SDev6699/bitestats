import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ data }) => {
  const chartData = {
    labels: ['Morning', 'Afternoon', 'Evening'],
    datasets: [
      {
        label: 'Orders by Time of Day',
        data: [data.morning, data.afternoon, data.evening],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const labels = ['Morning (5 AM - 12 PM)', 'Afternoon (12 PM - 5 PM)', 'Evening (5 PM - 12 AM)'];
            const label = labels[tooltipItem.dataIndex] || '';
            const value = tooltipItem.raw;
            return `${label}: ${value} orders`;
          },
        },
      },
      legend: {
        labels: {
          font: {
            family: 'Roboto',
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} style={{ height: '400px' }} />;
};

export default DonutChart;
