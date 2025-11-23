'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const geoUrl = "/world_countries.json";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#19AFFF'];

export default function VisitorsByCountryChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/stats/locations');
        
        if (!response.ok) throw new Error('Failed to fetch location data');
        
        const rawData = await response.json();

        // FIX: Map your API data to the format Recharts expects (name & value)
        // Adjust 'country'/'code' and 'visitors'/'count' to match your actual API response keys
        const formattedData = Array.isArray(rawData) ? rawData.map(item => ({
          name: item.country || item.code || item.name || 'Unknown', 
          value: item.visitors || item.count || item.value || 0
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
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Failed to load data.</div>;
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