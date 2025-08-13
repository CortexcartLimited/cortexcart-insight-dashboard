// File: src/app/components/PlatformPostsChart.jsx

'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PlatformPostsChart = ({ chartData }) => {

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
      },
      title: { 
        display: false 
      },
    },
    scales: {
        y: { 
            beginAtZero: true,
            ticks: {
                // Ensure y-axis only shows whole numbers for post counts
                stepSize: 1,
                precision: 0
            }
        }
    }
  };

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <p className="text-sm text-gray-500 text-center mt-4">No post data available to display.</p>;
  }

  return <Bar data={chartData} options={options} />;
};

export default PlatformPostsChart;