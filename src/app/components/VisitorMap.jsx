'use client';

import { useState, useEffect } from 'react';
import { ResponsiveChoropleth } from '@nivo/geo';
import worldCountries from './world_countries.json'; // We will create this file next

const VisitorMap = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/stats/locations');
                const locationData = await response.json();
                setData(locationData);
            } catch (error) {
                console.error("Failed to fetch map data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">Loading Map...</div>;
    }

    return (
        <div style={{ height: '400px' }} className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
            <ResponsiveChoropleth
                data={data}
                features={worldCountries.features}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                colors="blues"
                domain={[0, Math.max(...data.map(d => d.value), 0) || 100]} // Dynamic domain based on data
                unknownColor="#EAEAEA"
                label="properties.name"
                valueFormat=".2s"
                projectionTranslation={[0.5, 0.5]}
                projectionRotation={[0, 0, 0]}
                enableGraticule={false}
                borderWidth={0.5}
                borderColor="#333"
                legends={[
                    {
                        anchor: 'bottom-left',
                        direction: 'column',
                        justify: true,
                        translateX: 20,
                        translateY: -50,
                        itemsSpacing: 0,
                        itemWidth: 94,
                        itemHeight: 18,
                        itemDirection: 'left-to-right',
                        itemTextColor: '#444444',
                        itemOpacity: 0.85,
                        symbolSize: 18,
                    },
                ]}
                 theme={{
                    tooltip: {
                        container: {
                            background: '#333',
                            color: '#fff',
                        },
                    },
                }}
            />
        </div>
    );
};

export default VisitorMap;