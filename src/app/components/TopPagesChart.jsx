'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TopPagesChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No page data available.</div>;
  }

  // Clean up paths for display (remove trailing slashes, rename / to Home)
  const chartData = data.slice(0, 5).map(item => ({
    name: (item.path || item.page || '/').replace(/\/$/, '') || 'Home',
    views: item.views
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Top Pages</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{ fontSize: 12 }} 
              interval={0}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="views" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#818CF8'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}