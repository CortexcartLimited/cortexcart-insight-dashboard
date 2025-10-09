// src/app/components/Ga4LineChart.jsx

'use client';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Ga4LineChart = ({ data = [] }) => {
  
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Page Views',
        data: data.map(item => item.pageviews),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Conversions',
        data: data.map(item => item.conversions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
            display: true,
            text: 'Page Views'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
            display: true,
            text: 'Conversions'
        },
        grid: {
          drawOnChartArea: false, // only-draw-grid-lines-for-one-axis
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default Ga4LineChart;
