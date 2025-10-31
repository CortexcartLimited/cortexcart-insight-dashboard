// src/app/components/dashboard/WidgetRenderer.js
'use client';

// Import all our widgets
import StatCardWidget from './widgets/StatCardWidget';
import LineChartWidget from './widgets/LineChartWidget';

// A simple component to show if the widget type isn't found
const UnknownWidget = ({ component }) => (
  <div className="bg-red-100 text-red-700 p-4 h-full">
    <p className="font-bold">Unknown Widget Type</p>
    <p>Could not find a component named: {component}</p>
  </div>
);

// This is our "widget library"
// It maps the component name (from the DB) to the actual component.
const widgetComponents = {
  StatCard: StatCardWidget,
  LineChart: LineChartWidget,
  // Add more widgets here as you build them
  // 'BarChart': BarChartWidget,
  // 'PieChart': PieChartWidget,
};

export default function WidgetRenderer({ widget }) {
  // Get the component to render, e.g., StatCardWidget
  const WidgetComponent = widgetComponents[widget.component];

  // If we don't find it, render an error
  if (!WidgetComponent) {
    return <UnknownWidget component={widget.component} />;
  }

  // Render the correct widget, passing in its data source
  return <WidgetComponent dataSource={widget.dataSource} />;
}