// src/app/dashboard/page.js
'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';
import RGL, { WidthProvider } from 'react-grid-layout';
import useSWR from 'swr';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

// --- NEW: Import our renderer ---
import WidgetRenderer from '@/app/components/dashboard/WidgetRenderer';

// Import the required CSS files
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ReactGridLayout = WidthProvider(RGL);
const fetcher = (url) => fetch(url).then((res) => res.json());

// --- WE DON'T NEED THE PLACEHOLDER WIDGET ANYMORE ---

export default function DashboardPage() {
  const [layout, setLayout] = useState([]);
  
  const { data: dashboardConfig, error, isLoading } = useSWR(
    '/api/dashboard/layout',
    fetcher,
    {
      onSuccess: (data) => {
        if (data && data.layout) {
          setLayout(data.layout);
        }
      }
    }
  );

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const handleSaveLayout = async () => {
    // We combine the current layout with the widgets from our config
    const newDashboardConfig = {
      layout: layout,
      widgets: dashboardConfig.widgets,
    };
    
    try {
      await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDashboardConfig),
      });
      alert('Dashboard layout saved!');
    } catch (err) {
      console.error(err);
      alert('Error saving layout.');
    }
  };

  // --- Render logic (Loading, Error) ... no changes here ---
  if (isLoading) { /* ... */ }
  if (error) { /* ... */ }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <button
          onClick={handleSaveLayout}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
        >
          Save Layout
        </button>
      </div>

      <ReactGridLayout
        className="layout"
        layout={layout}
        onLayoutChange={onLayoutChange}
        cols={12}
        rowHeight={100}
      >
        {/* --- THIS IS THE MAIN UPDATE --- */}
        {dashboardConfig?.widgets.map((widget) => {
          const layoutItem = layout.find(item => item.i === widget.i);
          return (
            // The outer div gets a class for styling
            <div key={widget.i} data-grid={layoutItem} className="bg-white shadow-md rounded-lg">
              {/* We render the WidgetRenderer here.
                It will decide which *actual* widget to show.
              */}
              <WidgetRenderer widget={widget} />
            </div>
          );
        })}
      </ReactGridLayout>
    </Layout>
  );
}