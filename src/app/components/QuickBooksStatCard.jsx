// src/app/components/StatCard.jsx

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"; // Using your existing UI components
export default function QuickBooksStatCard({ title, value, icon: Icon, description }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}