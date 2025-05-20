import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experienceBandToLabel, getPriorityColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("requirements");
  const [timeframe, setTimeframe] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  
  const { data: recruitmentNeeds, isLoading: isLoadingRecruitmentNeeds } = useQuery({
    queryKey: ["/api/dashboard/recruitment-needs"],
  });
  
  const { data: skillDistribution, isLoading: isLoadingSkillDistribution } = useQuery({
    queryKey: ["/api/dashboard/skill-distribution"],
  });
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ["/api/pipeline"],
  });
  
  return (
    <AppLayout title="Recruitment Planning">
      <Tabs defaultValue="requirements" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="requirements">Recruitment Requirements</TabsTrigger>
          <TabsTrigger value="bench">Bench Status</TabsTrigger>
          <TabsTrigger value="planning">Strategic Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <CardTitle>Skill Requirements Matrix</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select defaultValue={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30days">Next 30 Days</SelectItem>
                    <SelectItem value="90days">Next 90 Days</SelectItem>
                    <SelectItem value="6months">Next 6 Months</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Skill Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    <SelectItem value="critical">Critical Skills</SelectItem>
                    <SelectItem value="shortage">Shortages Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecruitmentNeeds ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : recruitmentNeeds && recruitmentNeeds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Experience Level</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Gap</TableHead>
                      <TableHead>Fulfillment</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruitmentNeeds.map((need, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{need.skillName}</TableCell>
                        <TableCell>{experienceBandToLabel(need.experienceBand)}</TableCell>
                        <TableCell>{need.needed}</TableCell>
                        <TableCell>{need.available}</TableCell>
                        <TableCell className="font-medium text-red-600">
                          {need.needed - need.available > 0 ? need.needed - need.available : 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={need.fulfillmentPercentage} className="w-[80px]" />
                            <span className="text-xs">{need.fulfillmentPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(need.priority)}>
                            {need.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Create Job</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No recruitment requirements found.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Demand Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Current Projects</span>
                      <span className="text-sm">45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Pipeline Projects</span>
                      <span className="text-sm">35%</span>
                    </div>
                    <Progress value={35} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Attrition Replacement</span>
                      <span className="text-sm">15%</span>
                    </div>
                    <Progress value={15} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Strategic Hiring</span>
                      <span className="text-sm">5%</span>
                    </div>
                    <Progress value={5} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quarterly Hiring Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 border border-gray-100 rounded-lg bg-neutral-50 flex items-center justify-center mb-4">
                  <p className="text-neutral-400 text-sm">Quarterly Hiring Forecast Chart</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium text-neutral-500">Q1 2023</h3>
                    <div className="text-2xl font-bold mt-1">23</div>
                    <p className="text-xs text-neutral-400 mt-1">Positions</p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium text-neutral-500">Q2 2023</h3>
                    <div className="text-2xl font-bold mt-1">18</div>
                    <p className="text-xs text-neutral-400 mt-1">Positions</p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium text-neutral-500">Q3 2023</h3>
                    <div className="text-2xl font-bold mt-1">31</div>
                    <p className="text-xs text-neutral-400 mt-1">Positions</p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium text-neutral-500">Q4 2023</h3>
                    <div className="text-2xl font-bold mt-1">27</div>
                    <p className="text-xs text-neutral-400 mt-1">Positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bench" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Bench Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 border border-gray-100 rounded-lg bg-neutral-50 flex items-center justify-center mb-6">
                <p className="text-neutral-400 text-sm">Bench Allocation Chart</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Total Bench</h3>
                      <div className="text-3xl font-bold">47</div>
                      <p className="text-xs text-neutral-400 mt-1">Employees</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Billable Bench</h3>
                      <div className="text-3xl font-bold text-green-600">32</div>
                      <p className="text-xs text-neutral-400 mt-1">Ready for projects</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Non-Billable</h3>
                      <div className="text-3xl font-bold text-amber-600">15</div>
                      <p className="text-xs text-neutral-400 mt-1">In training/onboarding</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Junior (0-2)</TableHead>
                    <TableHead>Mid (2-5.5)</TableHead>
                    <TableHead>Senior (5.5-7)</TableHead>
                    <TableHead>Tech Lead (7-10)</TableHead>
                    <TableHead>Architect (10+)</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">React.js</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">11</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Node.js</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">8</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Python</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">8</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Java</TableCell>
                    <TableCell>6</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="font-medium">14</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">DevOps</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">4</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">AWS</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="font-medium">2</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <CardTitle>Bench Utilization Forecast</CardTitle>
              <Select defaultValue="30days">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Next 30 Days</SelectItem>
                  <SelectItem value="60days">Next 60 Days</SelectItem>
                  <SelectItem value="90days">Next 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-64 border border-gray-100 rounded-lg bg-neutral-50 flex items-center justify-center">
                <p className="text-neutral-400 text-sm">Bench Utilization Forecast Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Hiring Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-500 mb-6">
                Plan your hiring strategy based on projected demand, bench availability, and skill gaps.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Critical Skills Gap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Gap</TableHead>
                          <TableHead>Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">DevOps (7-10 yrs)</TableCell>
                          <TableCell className="text-red-600">-3</TableCell>
                          <TableCell>
                            <Badge className="bg-red-50 text-red-700 border-red-100">
                              High
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">AWS (10+ yrs)</TableCell>
                          <TableCell className="text-red-600">-2</TableCell>
                          <TableCell>
                            <Badge className="bg-red-50 text-red-700 border-red-100">
                              High
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Data Science (5.5-7 yrs)</TableCell>
                          <TableCell className="text-amber-600">-2</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-50 text-amber-700 border-amber-100">
                              Medium
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Emerging Skills Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Projects</TableHead>
                          <TableHead>Timeframe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Kubernetes</TableCell>
                          <TableCell>5</TableCell>
                          <TableCell>Q2 2023</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">GenAI / LLMs</TableCell>
                          <TableCell>3</TableCell>
                          <TableCell>Q3 2023</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Flutter</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>Q3 2023</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recruitment Strategy Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-blue-50">
                      <h3 className="font-medium mb-2 flex items-center">
                        <span className="material-icons mr-2 text-blue-600">lightbulb</span>
                        Prioritize Senior DevOps and AWS Hiring
                      </h3>
                      <p className="text-sm">
                        Current pipeline shows critical demand for senior DevOps and AWS architects. 
                        Recommend increasing referral bonus for these roles and expanding search to include remote candidates.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-md bg-green-50">
                      <h3 className="font-medium mb-2 flex items-center">
                        <span className="material-icons mr-2 text-green-600">school</span>
                        Upskill Current Employees
                      </h3>
                      <p className="text-sm">
                        Identify mid-level engineers with potential for upskilling in high-demand areas. 
                        Implement training program for 12 engineers in DevOps and cloud technologies.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-md bg-purple-50">
                      <h3 className="font-medium mb-2 flex items-center">
                        <span className="material-icons mr-2 text-purple-600">trending_up</span>
                        Prepare for Emerging Tech
                      </h3>
                      <p className="text-sm">
                        Based on pipeline trends, initiate early hiring for AI/ML specialists. 
                        Consider creating a specialized team focused on emerging technologies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
