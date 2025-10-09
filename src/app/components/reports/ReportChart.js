'use client';

import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function ReportChart({ type, data, title }) {
    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: title }
        },
        scales: { y: { beginAtZero: true } }
    };

    if (type === 'line') {
        return <Line data={data} options={options} />;
    }
    if (type === 'bar') {
        return <Bar data={data} options={options} />;
    }
    return <p>Unsupported chart type: {type}</p>;
}