// src/app/components/dashboard/widgets/LineChartWidget.js
'use client';
import useSWR from 'swr';
import { ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const fetcher = (url) => fetch(url).then((res) => res.json());

// A placeholder for a line chart
export default function LineChartWidget({ dataSource }) {
  // This widget will fetch data from the same API endpoint
  const { data, error, isLoading } = useSWR(`/api/dashboard/data/${dataSource}`, fetcher);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Cog6ToothIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error loading data</div>;
  }
  
  // We're just showing a placeholder, but the data is loaded.
  return (
    <div className="p-4 h-full flex flex-col items-center justify-center">
      <ChartBarIcon className="h-16 w-16 text-blue-500" />
      <h3 className="text-lg font-semibold mt-2">{data.title || 'Line Chart'}</h3>
      <p className="text-sm text-gray-500">Data source: {dataSource}</p>
    </div>
  );
}