'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F']; // Blue for New, Green for Returning

const NewVsReturningChart = ({ data }) => {
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={250}>
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
        <Tooltip formatter={(value) => value.toLocaleString()} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default NewVsReturningChart;