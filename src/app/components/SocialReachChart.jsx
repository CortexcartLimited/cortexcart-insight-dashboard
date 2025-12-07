'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

export default function SocialReachChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/analytics')
      .then(res => res.json())
      .then(res => {
        // Ensure dailyReach exists, otherwise default to empty
        setData(res.dailyReach || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-80 flex items-center justify-center bg-white rounded-2xl border border-gray-200">Loading Social Data...</div>;
  if (data.length === 0) return null; // Hide if no data

  // Format date for X-Axis
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Total Social Reach (All Platforms)</h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={30} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
                type="monotone" 
                dataKey="reach" 
                stroke="#ec4899" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReach)" 
            />
            {/* The "Brush" allows users to zoom/slide the timeline */}
            <Brush dataKey="date" height={30} stroke="#ec4899" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}