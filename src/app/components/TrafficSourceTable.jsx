'use client';
import { useState, useEffect } from 'react';

export default function TrafficSourceTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/traffic-sources')
      .then(res => res.json())
      .then(res => {
        if (Array.isArray(res)) setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-200">Loading Traffic Data...</div>;
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Traffic & Revenue Sources</h3>
        <p className="text-sm text-gray-500">Which channels are driving actual sales?</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source / Medium</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => {
              const isPaid = row.medium.includes('cpc') || row.medium.includes('ads');
              const convRate = row.sessions > 0 ? ((row.conversions / row.sessions) * 100).toFixed(1) : 0;
              
              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${isPaid ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{row.source}</span>
                        <span className="ml-1 text-xs text-gray-400">/ {row.medium}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {row.sessions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    ${row.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {convRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}