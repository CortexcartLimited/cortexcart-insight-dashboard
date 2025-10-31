// src/app/components/dashboard/widgets/StatCardWidget.js
'use client';
import useSWR from 'swr';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const fetcher = (url) => fetch(url).then((res) => res.json());

// This is a simple data-fetching widget
// We pass it the dataSource (e.g., 'ga4_total_users')
export default function StatCardWidget({ dataSource }) {
  // We'll create a new API route for this later.
  // This API will be smart and know what 'ga4_total_users' means.
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

  // We expect the API to return data in this format:
  // { value: "1,234", change: "+5.2%" }
  return (
    <div className="p-4 h-full">
      <h3 className="text-sm font-medium text-gray-500">{data.title || 'Statistic'}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">
        {data.value}
      </p>
      {data.change && (
        <p className="text-sm font-medium text-green-600">{data.change} vs. last period</p>
      )}
    </div>
  );
}