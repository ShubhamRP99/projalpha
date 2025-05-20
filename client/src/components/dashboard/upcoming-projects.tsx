import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateTimeLeft } from "@/lib/utils";
import { useLocation } from "wouter";

export function UpcomingProjects() {
  const [_, setLocation] = useLocation();
  
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["/api/pipeline"],
  });
  
  // Filter and sort upcoming projects by start date
  const upcomingProjects = pipeline
    ?.filter(project => 
      project.status === "Negotiation" || project.status === "Won"
    )
    .sort((a, b) => 
      new Date(a.expectedStartDate).getTime() - new Date(b.expectedStartDate).getTime()
    )
    .slice(0, 2); // Show only next 2 upcoming projects
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>Upcoming Projects</CardTitle>
        <Button 
          variant="link" 
          className="text-primary font-medium hover:text-primary-700 flex items-center p-0"
          onClick={() => setLocation("/sales")}
        >
          View All
          <span className="material-icons ml-1 text-[16px]">chevron_right</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full rounded-md" />
              <Skeleton className="h-28 w-full rounded-md" />
            </>
          ) : upcomingProjects && upcomingProjects.length > 0 ? (
            upcomingProjects.map((project, index) => {
              const timeLeft = calculateTimeLeft(project.expectedStartDate);
              
              return (
                <div 
                  key={index} 
                  className="p-3 border border-primary-100 rounded-md hover:bg-primary-50 cursor-pointer"
                  onClick={() => setLocation(`/sales?pipeline=${project.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-neutral-800 font-medium">{project.name}</h3>
                      <p className="text-neutral-500 text-sm mt-1">
                        Status: {project.status}
                      </p>
                    </div>
                    <div className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded">
                      Starting in {timeLeft}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-neutral-600">Required Skills:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.demands?.slice(0, 3).map((demand, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs"
                        >
                          {demand.skillName}
                        </span>
                      ))}
                      {project.demands && project.demands.length > 3 && (
                        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
                          +{project.demands.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500 mb-4">No upcoming projects in the pipeline.</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/sales")}
              >
                Go to Sales Pipeline
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
