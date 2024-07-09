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

// Function to split a single label into multiple lines based on max character length
const splitLabel = (label, maxCharsPerLine) => {
  const words = label.split(' ');
  let result = [];
  let line = "";

  words.forEach(word => {
    if ((line + word).length > maxCharsPerLine) {
      result.push(line.trim());
      line = word + " ";  // Start a new line
    } else {
      line += word + " ";
    }
  });

  if (line) {
    result.push(line.trim());  // Add the last line
  }

  return result;
};

const BarChart = ({ data, displayOrderCount, displayTopRestaurants }) => {

  // console.log({ data, displayOrderCount, displayTopRestaurants });
  const maxCharsPerLine = 15; // Adjust this based on your average bar width and desired aesthetics

  const topData = data.slice(0, 5);
  const chartData = {
    labels: topData.map(item => splitLabel(item.label, maxCharsPerLine)),
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
          size: 16 // Set title font size here if needed
        },
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
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 12, // Font size for x-axis labels
            family: 'Roboto' // Maintain font consistency
          },
          padding: 10 // Adjust padding to give labels more room if needed
        }
      },
      y: {
        title: {
          display: true,
          text: displayOrderCount ? 'Order Count' : 'Money Spent ($)',
          font: {
            family: 'Roboto',
          },
        },
        ticks: {
          font: {
            size: 12, // Match the font size of y-axis labels to x-axis
            family: 'Roboto'
          }
        }
      },
    },
  };

return (
    <div style={{ width: '100%', height: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};


export default BarChart;