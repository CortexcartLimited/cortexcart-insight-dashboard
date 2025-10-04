'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SkeletonCard from './SkeletonCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF', '#19AFFF'];

const VisitorMap= ({ period }) => {
    const { data: session, status } = useSession();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // This line is now corrected

    useEffect(() => {
        const fetchData = async () => {
            if (status === 'authenticated' && period) {
                setLoading(true);
                setError(null);
                try {
                    const siteId = session.user.email;
                    const response = await fetch(`/api/stats/locations?period=${period}&siteId=${siteId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch country data');
                    }
                    const result = await response.json();
                    setData(result);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            } else if (status === 'loading') {
                setLoading(true);
            }
        };

        fetchData();
    }, [period, session, status]);

    if (loading) {
        return <SkeletonCard />;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">Error: {error}</div>;
    }
    
    if (data.length === 0) {
        return <div className="text-center p-4 text-gray-500">No visitor data available for this period.</div>
    }

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
                <Tooltip formatter={(value) => [`${value} visitors`, 'Visitors']} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default VisitorMap;