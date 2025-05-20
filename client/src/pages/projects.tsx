import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { AddRequirementModal } from "@/components/projects/add-requirement-modal";
import { AssignTeamMemberModal } from "@/components/projects/assign-team-member-modal";
import { ProjectList } from "@/components/projects/project-list";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, experienceBandToLabel } from "@/lib/utils";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active-projects");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddRequirementModalOpen, setIsAddRequirementModalOpen] = useState(false);
  const [isAssignMemberModalOpen, setIsAssignMemberModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<{
    id: number;
    skillId: number;
    experienceBand: string;
    hoursPerMonth?: number;
  } | null>(null);
  
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  const { data: selectedProject, isLoading: isLoadingProject } = useQuery({
    queryKey: [`/api/projects/${selectedProjectId}`],
    enabled: !!selectedProjectId,
  });
  
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/employees/${user?.id}/assignments`],
    enabled: !!user?.id && activeTab === "my-projects",
  });
  
  const isAdmin = user?.role === "admin";
  const isProjectManager = user?.role === "project_manager";
  const canCreateProject = isAdmin;
  const canAssignResources = isAdmin || isProjectManager;

  const renderActiveProjects = () => {
    if (selectedProjectId) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => setSelectedProjectId(null)}
            >
              <span className="material-icons mr-2 text-sm">arrow_back</span>
              Back to Projects
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProject ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : selectedProject && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedProject.name}</h3>
                      <p className="text-neutral-500">Code: {selectedProject.code}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-neutral-500">Start Date:</div>
                      <div>{formatDate(selectedProject.startDate)}</div>
                      
                      <div className="text-neutral-500">End Date:</div>
                      <div>{formatDate(selectedProject.endDate)}</div>
                      
                      <div className="text-neutral-500">Created By:</div>
                      <div>{selectedProject.createdByEmail || "Admin"}</div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Description:</h4>
                      <p className="text-sm">{selectedProject.description || 'No description provided.'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Skill Requirements</CardTitle>
                  {canCreateProject && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        setIsAddRequirementModalOpen(true);
                      }}
                    >
                      Add Requirement
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProject ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : selectedProject && selectedProject.requirements?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>People Needed</TableHead>
                        <TableHead>Hours/Month</TableHead>
                        <TableHead>Assigned</TableHead>
                        {canAssignResources && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.requirements.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.skillName}</TableCell>
                          <TableCell>{experienceBandToLabel(req.experienceBand)}</TableCell>
                          <TableCell>{req.peopleNeeded}</TableCell>
                          <TableCell>{req.hoursPerMonth}</TableCell>
                          <TableCell>
                            {selectedProject.assignments?.filter(
                              a => a.skillId === req.skillId && a.experienceBand === req.experienceBand
                            ).length || 0} / {req.peopleNeeded}
                          </TableCell>
                          {canAssignResources && (
                            <TableCell>
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setSelectedRequirement({
                                    id: req.id,
                                    skillId: req.skillId,
                                    experienceBand: req.experienceBand,
                                    hoursPerMonth: req.hoursPerMonth
                                  });
                                  setIsAssignMemberModalOpen(true);
                                }}
                              >
                                Assign
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">No skill requirements defined for this project.</p>
                    {canCreateProject && (
                      <Button variant="outline" size="sm">Add First Requirement</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProject ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : selectedProject && selectedProject.assignments?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Hours/Month</TableHead>
                        <TableHead>Assigned Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.employeeName}</TableCell>
                          <TableCell>{assignment.skillName}</TableCell>
                          <TableCell>{experienceBandToLabel(assignment.experienceBand)}</TableCell>
                          <TableCell>{assignment.assignedHoursPerMonth}</TableCell>
                          <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">No team members assigned to this project yet.</p>
                    {canAssignResources && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAssignMemberModalOpen(true)}
                      >
                        Assign Team Members
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    } else {
      return (
        <ProjectList 
          projects={projects} 
          isLoading={isLoadingProjects} 
          onSelectProject={setSelectedProjectId}
        />
      );
    }
  };

  const renderMyProjects = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Project Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Experience Level</TableHead>
                  <TableHead>Hours/Month</TableHead>
                  <TableHead>Project Timeline</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.projectName}</TableCell>
                    <TableCell>{assignment.skillName}</TableCell>
                    <TableCell>{experienceBandToLabel(assignment.experienceBand)}</TableCell>
                    <TableCell>{assignment.assignedHoursPerMonth}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDate(assignment.projectStartDate)} - {formatDate(assignment.projectEndDate)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Log Time</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500 mb-4">You are not assigned to any projects yet.</p>
              <p className="text-sm text-neutral-400">Your project manager will assign you to projects.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderProjectAdmin = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 mb-6">
            This section allows administrators to manage projects, add skill requirements, and oversee project staffing.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader className="bg-primary-50 pb-3">
                <CardTitle className="text-primary-700">Create Project</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-neutral-500 mb-4">
                  Create a new project with name, code, dates and description.
                </p>
                <Button className="w-full" onClick={() => setIsCreateModalOpen(true)}>
                  Create New Project
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-1">
              <CardHeader className="bg-secondary-50 pb-3">
                <CardTitle className="text-secondary-700">Manage Requirements</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-neutral-500 mb-4">
                  Define skill requirements and resource needs for existing projects.
                </p>
                <Button variant="secondary" className="w-full">
                  Manage Requirements
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-1">
              <CardHeader className="bg-neutral-100 pb-3">
                <CardTitle className="text-neutral-700">Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-neutral-500 mb-4">
                  Assign employees to projects based on skills and availability.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <AppLayout title="Projects">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Tabs defaultValue="active-projects" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active-projects">Active Projects</TabsTrigger>
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              {canCreateProject && <TabsTrigger value="create-project">Project Administration</TabsTrigger>}
            </TabsList>
          </Tabs>
        </div>
        
        {canCreateProject && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <span className="material-icons mr-2 text-sm">add</span>
            New Project
          </Button>
        )}
      </div>
      
      {activeTab === "active-projects" && renderActiveProjects()}
      {activeTab === "my-projects" && renderMyProjects()}
      {activeTab === "create-project" && renderProjectAdmin()}
      
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      {selectedProjectId && (
        <>
          <AddRequirementModal
            isOpen={isAddRequirementModalOpen}
            onClose={() => setIsAddRequirementModalOpen(false)}
            projectId={selectedProjectId}
          />
          
          <AssignTeamMemberModal
            isOpen={isAssignMemberModalOpen}
            onClose={() => {
              setIsAssignMemberModalOpen(false);
              setSelectedRequirement(null);
            }}
            projectId={selectedProjectId}
            skillId={selectedRequirement?.skillId}
            experienceBand={selectedRequirement?.experienceBand}
            hoursPerMonth={selectedRequirement?.hoursPerMonth}
            fromRequirement={selectedRequirement !== null}
          />
        </>
      )}
    </AppLayout>
  );
}
