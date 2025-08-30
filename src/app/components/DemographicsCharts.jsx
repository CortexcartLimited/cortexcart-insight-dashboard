'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SimpleBarChart = ({ data, dataKey, name, color }) => (
    <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="dimension" width={80} />
            <Tooltip />
            <Legend />
            <Bar dataKey="metric" name={name} fill={color} />
        </BarChart>
    </ResponsiveContainer>
);

const DemographicsCharts = ({ data }) => {
    if (!data) return <div className="text-center text-gray-500">Loading demographics...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-lg font-semibold mb-2">Age Distribution</h4>
                <SimpleBarChart data={data.ageData} name="Users" color="#8884d8" />
            </div>
            <div>
                <h4 className="text-lg font-semibold mb-2">Gender Distribution</h4>
                <SimpleBarChart data={data.genderData} name="Users" color="#82ca9d" />
            </div>
            <div>
                <h4 className="text-lg font-semibold mb-2">Top Countries</h4>
                <SimpleBarChart data={data.countryData.slice(0, 5)} name="Users" color="#ffc658" />
            </div>
        </div>
    );
};

export default DemographicsCharts;