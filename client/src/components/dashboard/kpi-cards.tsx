import { Card, CardContent } from "@/components/ui/card";
import { cn, getTrendColor, getTrendIcon } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function KPICards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const kpiData = [
    {
      label: "Active Projects",
      value: metrics?.activeProjects || 0,
      icon: "business_center",
      iconBg: "bg-blue-50",
      iconColor: "text-primary",
      trend: 4.3,
      trendText: "vs last month"
    },
    {
      label: "Bench Employees",
      value: metrics?.benchEmployees || 0,
      icon: "people",
      iconBg: "bg-purple-50",
      iconColor: "text-accent-500",
      trend: -2.1,
      trendText: "vs last month",
      inverse: true
    },
    {
      label: "Pipeline Projects",
      value: metrics?.pipelineProjects || 0,
      icon: "trending_up",
      iconBg: "bg-green-50",
      iconColor: "text-secondary-500",
      trend: 7.2,
      trendText: "vs last month"
    },
    {
      label: "Critical Skill Gaps",
      value: metrics?.skillGaps || 0,
      icon: "warning",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      trendText: "Requires immediate attention"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {kpiData.map((kpi, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-neutral-500 text-sm font-medium">{kpi.label}</h3>
                <p className="text-2xl font-semibold mt-1">{kpi.value}</p>
              </div>
              <div className={cn("p-2 rounded-md", kpi.iconBg)}>
                <span className={cn("material-icons", kpi.iconColor)}>{kpi.icon}</span>
              </div>
            </div>
            <div className="flex items-center">
              {kpi.trend ? (
                <>
                  <span className={cn("text-sm flex items-center mr-2", getTrendColor(kpi.trend, kpi.inverse))}>
                    <span className="material-icons text-[16px]">{getTrendIcon(kpi.trend)}</span>
                    {Math.abs(kpi.trend)}%
                  </span>
                  <span className="text-neutral-500 text-xs">{kpi.trendText}</span>
                </>
              ) : (
                <span className="text-neutral-500 text-xs">{kpi.trendText}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
