import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SkillRatingForm } from "@/components/skills/skill-rating-form";
import { AddSkillForm } from "@/components/skills/add-skill-form";
import { EditSkillForm } from "@/components/skills/edit-skill-form";
import { CategoriesManagement } from "@/components/skills/categories-management";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate, getRatingColor } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function SkillsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-skills");
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: mySkills, isLoading: isLoadingMySkills } = useQuery({
    queryKey: [`/api/employees/${user?.id}/skills`],
    enabled: !!user?.id,
  });
  
  const { data: allSkills, isLoading: isLoadingAllSkills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  // Get skill distribution data for each skill (for organization overview)
  const { data: skillDistribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ["/api/dashboard/skill-distribution"],
  });
  
  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      await apiRequest("DELETE", `/api/skills/${skillId}`);
    },
    onSuccess: () => {
      toast({
        title: "Skill deleted",
        description: "The skill has been removed successfully",
      });
      // Invalidate all affected queries to refresh all components
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/skill-distribution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting skill",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle edit button click
  const handleEditSkill = (skill: any) => {
    setSelectedSkill(skill);
    setEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDeleteSkill = (skill: any) => {
    setSelectedSkill(skill);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete action
  const confirmDelete = () => {
    if (selectedSkill) {
      deleteSkillMutation.mutate(selectedSkill.id);
    }
  };
  
  return (
    <AppLayout title="Skill Management">
      <Tabs defaultValue="my-skills" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-skills">My Skills</TabsTrigger>
          {(user?.role === "admin" || user?.role === "project_manager") && (
            <TabsTrigger value="all-skills">Organization Skills</TabsTrigger>
          )}
          {user?.role === "admin" && (
            <TabsTrigger value="manage-skills">Manage Skills</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="my-skills">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Add/Update Skill</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillRatingForm />
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>My Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingMySkills ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : mySkills && mySkills.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Experience Band</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Years of Experience in a Skill</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mySkills.map((skill) => (
                          <TableRow key={skill.id}>
                            <TableCell className="font-medium">{skill.skillName}</TableCell>
                            <TableCell>{skill.skillCategory}</TableCell>
                            <TableCell>{skill.experienceBand}</TableCell>
                            <TableCell>
                              <Badge className={getRatingColor(skill.rating)}>
                                {skill.rating}
                              </Badge>
                            </TableCell>
                            <TableCell>{skill.yearsOfExperience}</TableCell>
                            <TableCell>{formatDate(skill.updatedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">You haven't added any skills yet.</p>
                      <p className="text-sm text-neutral-400">Use the form on the left to add your skills.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="all-skills">
          <Card>
            <CardHeader>
              <CardTitle>Organization Skills Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllSkills || isLoadingDistribution ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : allSkills && allSkills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Employees</TableHead>
                      <TableHead>Beginner</TableHead>
                      <TableHead>Intermediate</TableHead>
                      <TableHead>Expert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSkills.map((skill) => {
                      // Find distribution data for this skill
                      const distribution = skillDistribution?.find((dist: any) => 
                        dist.skillId === skill.id
                      ) || { 
                        total: 0, 
                        beginner: 0, 
                        intermediate: 0, 
                        expert: 0 
                      };
                      
                      return (
                        <TableRow key={skill.id}>
                          <TableCell className="font-medium">{skill.name}</TableCell>
                          <TableCell>{skill.category}</TableCell>
                          <TableCell>{distribution.total || 0}</TableCell>
                          <TableCell>{distribution.beginner || 0}</TableCell>
                          <TableCell>{distribution.intermediate || 0}</TableCell>
                          <TableCell>{distribution.expert || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No skills data available.</p>
                  <p className="text-sm text-neutral-400">Add skills to the system to view the organization overview.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage-skills">
          <div className="grid gap-6">
            {/* Skills management section - moved to first position */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Skills</CardTitle>
                <AddSkillForm />
              </CardHeader>
              <CardContent>
                {isLoadingAllSkills ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : allSkills && allSkills.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Skill Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSkills.map((skill) => (
                        <TableRow key={skill.id}>
                          <TableCell>{skill.id}</TableCell>
                          <TableCell className="font-medium">{skill.name}</TableCell>
                          <TableCell>{skill.category}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleEditSkill(skill)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteSkill(skill)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">No skills have been added yet.</p>
                    <p className="text-sm text-neutral-400">Click the "Add New Skill" button to add skills to the system.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Categories section - moved to second position */}
            {user?.role === "admin" && (
              <div className="w-full">
                <CategoriesManagement />
              </div>
            )}
          </div>
          
          {/* Edit Skill Dialog */}
          {selectedSkill && (
            <EditSkillForm
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              skill={selectedSkill}
            />
          )}
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the skill "{selectedSkill?.name}".
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteSkillMutation.isPending}
                >
                  {deleteSkillMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
