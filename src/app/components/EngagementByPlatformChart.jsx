// File: src/app/components/EngagementByPlatformChart.jsx

'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EngagementByPlatformChart = ({ data }) => {
  // Define default options inside the component for robustness
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            // Add a '%' sign to the tooltip value
            if (context.parsed !== null) {
              label += context.parsed.toFixed(2) + '%';
            }
            return label;
          }
        }
      }
    },
  };

  // Define custom colors for each platform
  // This assumes the order of data in the dataset corresponds to these platforms
  // For a more robust solution, map colors based on platform names if available in data
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: ['#ADD8E6', '#00008B', '#FF0000'], // Light Blue, Dark Blue, Red (These colors will be applied to the chart segments)
    })),
  };

  // A more robust check to see if there is data to display
  const hasData = data?.datasets?.[0]?.data?.some(value => value > 0);

  if (!hasData) {
    return <p className="text-sm text-gray-500 text-center mt-4">No engagement data available to display. It can take anything from 24 hours to a few days for data to be returned and analyzed by AI, please check back again later!. If the error persists raise a bug report and we will check for the reason and get back to you.</p>;
  }

  return <Doughnut data={chartData} options={options} />;
};

export default EngagementByPlatformChart;