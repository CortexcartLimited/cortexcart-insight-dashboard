'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DeviceChart = ({ deviceData = [] }) => {
  const data = {
    labels: deviceData.map(d => d.device.charAt(0).toUpperCase() + d.device.slice(1)),
    datasets: [
      {
        label: '# of Views',
        data: deviceData.map(d => d.views),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };
  
  if (deviceData.length === 0) {
    return <p className="text-sm text-gray-500 text-center mt-4">No device data available.</p>;
  }

  return <Doughnut data={data} options={options} />;
};

export default DeviceChart;
