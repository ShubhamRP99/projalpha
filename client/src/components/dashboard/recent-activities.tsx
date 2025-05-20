import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

// Helper function to get icon for activity type
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'project_created':
      return 'business_center';
    case 'employee_joined':
    case 'user_registered':
      return 'person_add';
    case 'skill_mapping_updated':
    case 'skill_created':
    case 'skill_updated':
      return 'psychology';
    case 'pipeline_created':
    case 'pipeline_updated':
    case 'pipeline_skill_added':
      return 'trending_up';
    default:
      return 'notifications';
  }
};

export function RecentActivities() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities?limit=4"],
  });
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>Recent Activities</CardTitle>
        <Button 
          variant="link" 
          className="text-primary font-medium hover:text-primary-700 flex items-center p-0"
        >
          View All
          <span className="material-icons ml-1 text-[16px]">chevron_right</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </>
          ) : activities && activities.length > 0 ? (
            activities.map((activity, index) => {
              // Calculate relative time (e.g., "2 hours ago")
              const activityDate = new Date(activity.createdAt);
              const now = new Date();
              const diffMs = now.getTime() - activityDate.getTime();
              const diffMins = Math.round(diffMs / 60000);
              const diffHours = Math.round(diffMs / 3600000);
              const diffDays = Math.round(diffMs / 86400000);
              
              let timeAgo;
              if (diffMins < 60) {
                timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
              } else if (diffHours < 24) {
                timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
              } else {
                timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
              }
              
              return (
                <div className="flex" key={index}>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <span className="material-icons text-neutral-500 text-sm">
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">{activity.description}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {timeAgo} • by {activity.userName}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <p className="text-neutral-500">No recent activities to display.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
