// src/app/components/StatCard.jsx

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const StatCard2 = ({ title, value, icon, description }) => {
  return (
    <Card className="h-full flex border border-gray-200 shadow-md rounded-md p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-2xl">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard2;