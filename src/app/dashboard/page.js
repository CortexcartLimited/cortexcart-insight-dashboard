// src/app/dashboard/page.js
'use client';

import { useState } from 'react';
import Layout from '@/app/components/Layout';
import RGL, { WidthProvider } from 'react-grid-layout';
import useSWR from 'swr';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline'; // <-- Import PlusIcon
import WidgetRenderer from '@/app/components/dashboard/WidgetRenderer';
import AddWidgetModal from '@/app/components/dashboard/AddWidgetModal'; // <-- Import the modal

// Import the required CSS files
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ReactGridLayout = WidthProvider(RGL);
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [layout, setLayout] = useState([]);
  
  // --- NEW STATE ---
  // This will hold the *full* config: { layout: [], widgets: [] }
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- END NEW STATE ---

  // Use SWR to fetch the *initial* config
  const { error, isLoading } = useSWR(
    '/api/dashboard/layout',
    fetcher,
    {
      // *Only* set the data on the first successful load
      // We don't want SWR to overwrite our local changes
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onSuccess: (data) => {
        if (data && !dashboardConfig) { // Only set if we don't have it
          setDashboardConfig(data);
          setLayout(data.layout);
        }
      }
    }
  );

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    // Also update the main config
    if (dashboardConfig) {
      setDashboardConfig(prev => ({ ...prev, layout: newLayout }));
    }
  };

  const handleSaveLayout = async () => {
    try {
      await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboardConfig), // Save the whole config
      });
      alert('Dashboard layout saved!');
    } catch (err) {
      console.error(err);
      alert('Error saving layout.');
    }
  };

  // --- NEW FUNCTION ---
  /**
   * Called from the modal. Adds a new widget to the dashboard.
   */
  const handleAddWidget = (widgetConfig) => {
    // 1. Create a unique ID for the new widget
    const newWidgetId = `widget-${Date.now()}`;
    
    // 2. Define the new widget's data
    const newWidget = {
      i: newWidgetId,
      ...widgetConfig, // { component: '...', dataSource: '...' }
    };
    
    // 3. Define the new widget's layout position
    // This will just add it to the top-left (0,0)
    // react-grid-layout will automatically find the next open spot
    const newLayoutItem = {
      i: newWidgetId,
      x: 0,
      y: 0, // Place it at the top
      w: 6, // Default width
      h: 2, // Default height
    };

    // 4. Update our state
    setDashboardConfig(prev => ({
      layout: [...prev.layout, newLayoutItem],
      widgets: [...prev.widgets, newWidget],
    }));
    
    // 5. Update layout state
    setLayout(prev => [...prev, newLayoutItem]);

    // 6. Close the modal
    setIsModalOpen(false);
  };
  // --- END NEW FUNCTION ---

  if (isLoading || !dashboardConfig) { // Show loading until config is set
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Cog6ToothIcon className="h-12 w-12 text-gray-400 animate-spin" />
          <p className="ml-4 text-lg">Loading Your Dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) { /* ... (no change to error logic) ... */ }

  return (
    <> {/* We use a Fragment to hold the modal */}
      <Layout>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex gap-x-2"> {/* --- NEW: Wrapper div --- */}
            <button
              onClick={() => setIsModalOpen(true)} // <-- NEW BUTTON
              className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 flex items-center gap-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Widget
            </button>
            <button
              onClick={handleSaveLayout}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
            >
              Save Layout
            </button>
          </div>
        </div>

        <ReactGridLayout
          className="layout"
          layout={layout}
          onLayoutChange={onLayoutChange}
          cols={12}
          rowHeight={100}
        >
          {dashboardConfig?.widgets.map((widget) => {
            const layoutItem = layout.find(item => item.i === widget.i);
            return (
              <div key={widget.i} data-grid={layoutItem} className="bg-white shadow-md rounded-lg overflow-hidden">
                <WidgetRenderer widget={widget} />
              </div>
            );
          })}
        </ReactGridLayout>
      </Layout>
      
      {/* --- NEW: Render the modal --- */}
      <AddWidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddWidget={handleAddWidget}
      />
    </>
  );
}