'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#19AFFF'];

export default function VisitorsByCountryChart({ siteId, dateRange, externalData }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. If external GA4 data is provided, use it immediately
    if (externalData && Array.isArray(externalData)) {
        setData(externalData);
        setLoading(false);
        setError(null);
        return;
    }

    // 2. Fallback Safety Check
    // If we don't have external data, AND we are missing props for local fetch,
    // we MUST stop loading to prevent the "infinite loading" bug.
    if (!siteId || !dateRange?.startDate || !dateRange?.endDate) {
        console.warn("VisitorsChart: Missing siteId or dateRange for local fetch");
        setLoading(false); 
        return;
    }

    // 3. Fetch Local Data (Fallback)
    async function fetchData() {
      try {
        setLoading(true);
        const formatDate = (date) => {
             if (!date) return '';
             const d = new Date(date);
             return d.toISOString().split('T')[0]; 
        };

        const params = new URLSearchParams({
            siteId: siteId,
            startDate: formatDate(dateRange.startDate),
            endDate: formatDate(dateRange.endDate)
        });

        const response = await fetch(`/api/stats/locations?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch location data');
        const rawData = await response.json();

        const formattedData = Array.isArray(rawData) ? rawData.map(item => ({
          name: item.country || 'Unknown', 
          value: item.visitor_count || 0
        })) : [];

        setData(formattedData);
      } catch (err) {
        console.error("Chart Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [siteId, dateRange, externalData]);

  if (loading) return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  if (error && data.length === 0) return <div className="h-64 flex items-center justify-center text-red-500">Failed to load data.</div>;
  if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-500">No visitor data available.</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie 
          data={data} 
          cx="50%" 
          cy="50%" 
          labelLine={false} 
          outerRadius={80} 
          fill="#8884d8" 
          dataKey="value" 
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Visitors']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}