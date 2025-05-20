import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { experienceBandToLabel, getPriorityColor } from "@/lib/utils";
import { useLocation } from "wouter";

export function RecruitmentNeeds() {
  const [_, setLocation] = useLocation();
  
  const { data: recruitmentNeeds, isLoading } = useQuery({
    queryKey: ["/api/dashboard/recruitment-needs"],
  });
  
  // Sort recruitment needs by priority (high, medium, low)
  const sortedNeeds = recruitmentNeeds?.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, 3); // Show only top 3 needs
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>Recruitment Needs</CardTitle>
        <Button 
          variant="link" 
          className="text-primary font-medium hover:text-primary-700 flex items-center p-0"
          onClick={() => setLocation("/recruitment")}
        >
          View All
          <span className="material-icons ml-1 text-[16px]">chevron_right</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </>
          ) : sortedNeeds && sortedNeeds.length > 0 ? (
            sortedNeeds.map((need, index) => {
              const gap = need.needed - need.available;
              
              return (
                <div 
                  key={index}
                  className={`p-3 border rounded-md ${getPriorityColor(need.priority)}`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 ${need.priority === 'high' ? 'bg-red-100 rounded' : need.priority === 'medium' ? 'bg-amber-100 rounded' : 'bg-neutral-100 rounded'}`}>
                      <span className={`material-icons ${need.priority === 'high' ? 'text-red-500' : need.priority === 'medium' ? 'text-amber-500' : 'text-neutral-500'}`}>
                        {need.priority === 'high' ? 'priority_high' : need.priority === 'medium' ? 'warning' : 'info'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-neutral-800 font-medium text-sm">
                        {need.skillName}
                      </h3>
                      <div className="flex items-center mt-1 text-neutral-600 text-xs">
                        <span className="bg-neutral-200 px-2 py-0.5 rounded">
                          {experienceBandToLabel(need.experienceBand)}
                        </span>
                        <span className="mx-2">•</span>
                        <span>Needed: {need.needed}</span>
                        <span className="mx-2">•</span>
                        <span>Available: {need.available}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Progress 
                      value={need.fulfillmentPercentage} 
                      className={`w-full ${
                        need.priority === 'high' 
                          ? 'bg-red-200' 
                          : need.priority === 'medium' 
                            ? 'bg-amber-200' 
                            : 'bg-neutral-200'
                      }`}
                    />
                    <span className={`ml-3 text-xs font-medium ${
                      need.priority === 'high' 
                        ? 'text-red-700' 
                        : need.priority === 'medium' 
                          ? 'text-amber-700' 
                          : 'text-neutral-700'
                    }`}>
                      {need.fulfillmentPercentage}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <p className="text-neutral-500">No critical hiring needs at the moment.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
