'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AnalyticsChart = ({ data, options }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return <p className="text-sm text-gray-500 text-center mt-4">No data available for this chart.</p>;
  }

  return <Doughnut data={data} options={options} />;
};

export default AnalyticsChart;
