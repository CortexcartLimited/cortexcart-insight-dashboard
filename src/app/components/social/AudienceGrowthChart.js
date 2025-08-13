'use client';

import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function AudienceGrowthChart({ growthData }) {
    // Format the data for Chart.js
    const chartData = {
        labels: growthData.map(d => new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).reverse(),
        datasets: [
            {
                label: 'New Subscribers',
                data: growthData.map(d => d.subs).reverse(),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Unsubscribes',
                data: growthData.map(d => d.unsubs).reverse(),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.3,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Audience Activity (Last 30 Days)'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return <Line data={chartData} options={options} />;
}