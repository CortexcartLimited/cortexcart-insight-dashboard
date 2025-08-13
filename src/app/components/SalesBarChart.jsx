'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SalesBarChart = ({ apiData = [], currencySymbol = '$', locale = 'en-US' }) => {
  
  const chartJsData = {
    // --- FIX: Use the dynamic locale for chart labels ---
    labels: apiData.map(item => new Date(item.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: `Sales (${currencySymbol})`,
        data: apiData.map(item => item.total_sales),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
        y: { beginAtZero: true }
    }
  };

  return <Bar data={chartJsData} options={options} />;
};

export default SalesBarChart;
