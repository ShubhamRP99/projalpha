import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { PipelineForm } from "@/components/sales/pipeline-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getStatusColor, calculateTimeLeft } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ["/api/pipeline"],
  });
  
  const handleViewDemands = (pipelineId: number) => {
    setSelectedPipelineId(pipelineId);
    setActiveTab("skill-demands");
  };
  
  const selectedPipeline = pipelines?.find(p => p.id === selectedPipelineId);
  
  return (
    <AppLayout title="Sales Pipeline">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Tabs defaultValue="pipeline" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline Projects</TabsTrigger>
              <TabsTrigger value="skill-demands">Skill Demands</TabsTrigger>
              <TabsTrigger value="forecasting">Revenue Forecasting</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="material-icons mr-2 text-sm">add</span>
              Add to Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Project to Pipeline</DialogTitle>
            </DialogHeader>
            <PipelineForm onSuccess={() => setIsFormDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {activeTab === "pipeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : pipelines && pipelines.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Expected Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skills Required</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelines.map((pipeline) => (
                    <TableRow key={pipeline.id}>
                      <TableCell className="font-medium">{pipeline.name}</TableCell>
                      <TableCell>
                        {formatDate(pipeline.expectedStartDate)} - {formatDate(pipeline.expectedEndDate)}
                        <div className="text-xs text-neutral-500 mt-1">
                          Starting in {calculateTimeLeft(pipeline.expectedStartDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(pipeline.status)}>
                          {pipeline.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pipeline.demands?.slice(0, 3).map((demand) => (
                            <Badge key={demand.id} variant="outline" className="mr-1">
                              {demand.skillName}
                            </Badge>
                          ))}
                          {pipeline.demands && pipeline.demands.length > 3 && (
                            <Badge variant="outline">+{pipeline.demands.length - 3} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2"
                          onClick={() => handleViewDemands(pipeline.id)}
                        >
                          View Demands
                        </Button>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 mb-4">No pipeline projects available.</p>
                <Button variant="outline" onClick={() => setIsFormDialogOpen(true)}>
                  Add Your First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {activeTab === "skill-demands" && (
        <>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Skill Demands</CardTitle>
                {selectedPipeline && (
                  <p className="text-sm text-neutral-500 mt-1">
                    Project: {selectedPipeline.name}
                  </p>
                )}
              </div>
              {selectedPipeline && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("pipeline")}>
                  Back to Pipeline
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : selectedPipeline && selectedPipeline.demands && selectedPipeline.demands.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Experience Level</TableHead>
                      <TableHead>People Needed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPipeline.demands.map((demand) => (
                      <TableRow key={demand.id}>
                        <TableCell className="font-medium">{demand.skillName}</TableCell>
                        <TableCell>{demand.experienceBand}</TableCell>
                        <TableCell>{demand.peopleNeeded}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                          <Button variant="destructive" size="sm">Remove</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">
                    {selectedPipeline
                      ? "No skill demands defined for this project."
                      : "Select a pipeline project to view skill demands."}
                  </p>
                  {selectedPipeline && (
                    <Button variant="outline">Add Skill Demand</Button>
                  )}
                  {!selectedPipeline && (
                    <Button variant="outline" onClick={() => setActiveTab("pipeline")}>
                      View Pipeline Projects
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {selectedPipeline && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">Project Name:</div>
                      <div>{selectedPipeline.name}</div>
                      
                      <div className="text-sm font-medium">Status:</div>
                      <div>
                        <Badge className={getStatusColor(selectedPipeline.status)}>
                          {selectedPipeline.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium">Expected Start:</div>
                      <div>{formatDate(selectedPipeline.expectedStartDate)}</div>
                      
                      <div className="text-sm font-medium">Expected End:</div>
                      <div>{formatDate(selectedPipeline.expectedEndDate)}</div>
                      
                      <div className="text-sm font-medium">Time to Start:</div>
                      <div>{calculateTimeLeft(selectedPipeline.expectedStartDate)}</div>
                      
                      <div className="text-sm font-medium">Created By:</div>
                      <div>Sales Team</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resource Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500">
                      Total resources needed across all skills:
                    </p>
                    
                    <div className="text-3xl font-bold">
                      {selectedPipeline.demands?.reduce((sum, demand) => sum + demand.peopleNeeded, 0) || 0}
                    </div>
                    
                    <div className="pt-4">
                      <Button className="w-full">View Resource Gap Analysis</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      
      {activeTab === "forecasting" && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecasting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500 mb-6">
              Estimate potential revenue based on pipeline projects and their probability of conversion.
            </p>
            
            <div className="h-64 border border-gray-100 rounded-lg bg-neutral-50 flex items-center justify-center mb-6">
              <p className="text-neutral-400 text-sm">Revenue Forecast Chart</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Prospect</h3>
                    <div className="text-3xl font-bold text-blue-600">$1.2M</div>
                    <p className="text-xs text-neutral-400 mt-1">10 projects</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Negotiation</h3>
                    <div className="text-3xl font-bold text-amber-600">$850K</div>
                    <p className="text-xs text-neutral-400 mt-1">5 projects</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Won</h3>
                    <div className="text-3xl font-bold text-green-600">$540K</div>
                    <p className="text-xs text-neutral-400 mt-1">3 projects</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Revenue by Quarter</h3>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Negotiation</TableHead>
                      <TableHead>Won</TableHead>
                      <TableHead>Total Potential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Q1 2023</TableCell>
                      <TableCell>$320K</TableCell>
                      <TableCell>$250K</TableCell>
                      <TableCell>$180K</TableCell>
                      <TableCell className="font-medium">$750K</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Q2 2023</TableCell>
                      <TableCell>$410K</TableCell>
                      <TableCell>$300K</TableCell>
                      <TableCell>$210K</TableCell>
                      <TableCell className="font-medium">$920K</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Q3 2023</TableCell>
                      <TableCell>$250K</TableCell>
                      <TableCell>$180K</TableCell>
                      <TableCell>$150K</TableCell>
                      <TableCell className="font-medium">$580K</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Q4 2023</TableCell>
                      <TableCell>$220K</TableCell>
                      <TableCell>$120K</TableCell>
                      <TableCell>$0</TableCell>
                      <TableCell className="font-medium">$340K</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
