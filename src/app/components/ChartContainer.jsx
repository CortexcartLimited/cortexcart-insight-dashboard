import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

const ChartContainer = ({ title, children, className }) => (
  <Card className={cn("h-full flex flex-col border border-gray-200 shadow", className)}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      {children}
    </CardContent>
  </Card>
);

export default ChartContainer;