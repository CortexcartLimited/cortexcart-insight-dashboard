'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#1877F2', '#E1306C', '#BD081C', '#E60023', '#000000']; // Brand Colors: FB, Insta, YT, Pinterest, X

export default function SocialPlatformPie() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/social/analytics')
      .then(res => res.json())
      .then(res => {
        // Map platform stats to chart format
        const chartData = (res.platformStats || []).map(p => ({
            name: p.platform,
            value: Number(p.postCount)
        }));
        setData(chartData);
      });
  }, []);

  if (!data.length) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Activity by Platform</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}