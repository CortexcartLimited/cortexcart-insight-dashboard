'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// 1. User Stickiness (DAU/MAU, etc)
export function StickinessCard({ dateRange }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        fetch(`/api/ga4-deep-dive?type=stickiness&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            .then(res => res.json())
            .then(setData).catch(console.error);
    }, [dateRange]);

    if (!data) return <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>;

    return (
        <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase">DAU / MAU</div>
                <div className="text-xl font-bold text-blue-600">{(data.dauPerMau * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase">DAU / WAU</div>
                <div className="text-xl font-bold text-green-600">{(data.dauPerWau * 100).toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase">WAU / MAU</div>
                <div className="text-xl font-bold text-purple-600">{(data.wauPerMau * 100).toFixed(1)}%</div>
            </div>
        </div>
    );
}

// 2. Active Users by City (Table)
export function CityTable({ dateRange }) {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(`/api/ga4-deep-dive?type=city&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            .then(res => res.json())
            .then(setData).catch(console.error);
    }, [dateRange]);

    if (!data.length) return <div className="text-sm text-gray-500 text-center py-4">No city data found.</div>;

    return (
        <div className="overflow-auto max-h-64">
            <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">City</th>
                        <th className="px-4 py-2">Country</th>
                        <th className="px-4 py-2 text-right">Users</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{row.city}</td>
                            <td className="px-4 py-2 text-gray-500">{row.country}</td>
                            <td className="px-4 py-2 text-right">{row.users}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 3. Search Queries (Table)
export function SearchQueriesTable({ dateRange }) {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(`/api/ga4-deep-dive?type=queries&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            .then(res => res.json())
            .then(setData).catch(console.error);
    }, [dateRange]);

    if (!data.length) return <div className="text-sm text-gray-500 text-center py-4">No search queries found (Requires Search Console).</div>;

    return (
        <div className="overflow-auto max-h-64">
            <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Query</th>
                        <th className="px-4 py-2">Country</th>
                        <th className="px-4 py-2 text-right">Sessions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium truncate max-w-[150px]" title={row.query}>
                                {row.query === '(not provided)' ? <span className="italic text-gray-400">Hidden by Google</span> : row.query}
                            </td>
                            <td className="px-4 py-2 text-gray-500">{row.country}</td>
                            <td className="px-4 py-2 text-right">{row.sessions}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 4. Organic Landing Pages
export function OrganicLandingTable({ dateRange }) {
    const [data, setData] = useState([]);
    useEffect(() => {
        fetch(`/api/ga4-deep-dive?type=organic_landing&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            .then(res => res.json())
            .then(setData).catch(console.error);
    }, [dateRange]);

    if (!data.length) return <div className="text-sm text-gray-500 text-center py-4">No organic traffic recorded.</div>;

    return (
        <div className="overflow-auto max-h-64">
            <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Landing Page</th>
                        <th className="px-4 py-2 text-right">Users</th>
                        <th className="px-4 py-2 text-right">Sessions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium truncate max-w-[200px]" title={row.page}>{row.page}</td>
                            <td className="px-4 py-2 text-right">{row.users}</td>
                            <td className="px-4 py-2 text-right">{row.sessions}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// 5. Engaged Sessions Ratio
export function EngagedSessionsCard({ dateRange }) {
    const [data, setData] = useState(null);
    useEffect(() => {
        fetch(`/api/ga4-deep-dive?type=engaged_user&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            .then(res => res.json())
            .then(setData).catch(console.error);
    }, [dateRange]);

    if (!data) return <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>;

    return (
        <div className="flex flex-col items-center justify-center h-32">
            <div className="text-3xl font-bold text-indigo-600">{data.ratio}</div>
            <div className="text-sm text-gray-500 mt-1">Engaged Sessions per User</div>
            <div className="text-xs text-gray-400 mt-2">
                {data.engagedSessions.toLocaleString()} Engaged / {data.activeUsers.toLocaleString()} Users
            </div>
        </div>
    );
}