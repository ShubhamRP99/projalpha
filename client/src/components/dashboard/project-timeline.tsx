import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function ProjectTimeline() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter">("month");
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Project Timeline</CardTitle>
          <div className="flex items-center">
            <div className="border border-gray-200 rounded-md overflow-hidden flex text-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className={timeframe === "week" ? "bg-primary-50 text-primary-600 font-medium" : ""}
                onClick={() => setTimeframe("week")}
              >
                Week
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={timeframe === "month" ? "bg-primary-50 text-primary-600 font-medium" : ""}
                onClick={() => setTimeframe("month")}
              >
                Month
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={timeframe === "quarter" ? "bg-primary-50 text-primary-600 font-medium" : ""}
                onClick={() => setTimeframe("quarter")}
              >
                Quarter
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          <>
            <div className="chart-container h-64 border border-gray-100 rounded-lg bg-neutral-50 flex items-center justify-center mb-4">
              <p className="text-neutral-400 text-sm">Project Timeline Chart</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-start gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                <span className="text-neutral-700">Active Projects</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-neutral-300 mr-2"></div>
                <span className="text-neutral-700">Completed Projects</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-secondary-400 mr-2"></div>
                <span className="text-neutral-700">Pipeline Projects</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-neutral-700">At Risk Projects</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
