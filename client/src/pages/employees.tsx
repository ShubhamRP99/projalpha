import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { data: selectedEmployee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: [`/api/users/${selectedEmployeeId}`],
    enabled: !!selectedEmployeeId,
  });
  
  const { data: employeeSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: [`/api/employees/${selectedEmployeeId}/skills`],
    enabled: !!selectedEmployeeId,
  });
  
  const { data: employeeProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: [`/api/employees/${selectedEmployeeId}/assignments`],
    enabled: !!selectedEmployeeId,
  });
  
  // Filter users based on search query and selected role
  const filteredUsers = users?.filter(user => {
    const matchesSearch = (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  return (
    <AppLayout title="Employee Management">
      {selectedEmployeeId ? (
        <div className="space-y-6">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedEmployeeId(null)}
            >
              <span className="material-icons mr-2 text-sm">arrow_back</span>
              Back to Employee List
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <span className="material-icons mr-2 text-sm">edit</span>
                Edit Profile
              </Button>
              <Button variant="outline">
                <span className="material-icons mr-2 text-sm">assignment</span>
                Assign to Project
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                {isLoadingEmployee ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                ) : selectedEmployee && (
                  <div className="text-center">
                    <Avatar className="h-32 w-32 mx-auto mb-4">
                      <AvatarFallback className="text-2xl">
                        {getInitials(selectedEmployee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{selectedEmployee.name}</h2>
                    <p className="text-neutral-500 mb-4">{selectedEmployee.email}</p>
                    
                    <Badge className="capitalize mb-4">
                      {selectedEmployee.role.replace('_', ' ')}
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-left mt-6">
                      <div className="text-neutral-500 font-medium">Employee ID:</div>
                      <div>{selectedEmployee.id}</div>
                      
                      <div className="text-neutral-500 font-medium">Username:</div>
                      <div>{selectedEmployee.username}</div>
                      
                      <div className="text-neutral-500 font-medium">Joined Date:</div>
                      <div>{new Date(selectedEmployee.createdAt).toLocaleDateString()}</div>
                      
                      <div className="text-neutral-500 font-medium">Status:</div>
                      <div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSkills ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : employeeSkills && employeeSkills.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Experience Level</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Years</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeSkills.map(skill => (
                          <TableRow key={skill.id}>
                            <TableCell className="font-medium">{skill.skillName}</TableCell>
                            <TableCell>{skill.skillCategory}</TableCell>
                            <TableCell>{skill.experienceBand}</TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-700">
                                {skill.rating}
                              </Badge>
                            </TableCell>
                            <TableCell>{skill.yearsOfExperience}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">No skills have been added yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Project Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : employeeProjects && employeeProjects.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Role/Skill</TableHead>
                          <TableHead>Assigned Hours</TableHead>
                          <TableHead>Assignment Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeProjects.map(assignment => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.projectName}</TableCell>
                            <TableCell>{assignment.skillName}</TableCell>
                            <TableCell>{assignment.assignedHoursPerMonth} hrs/month</TableCell>
                            <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-700">
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">Not assigned to any projects.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10 w-full sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select defaultValue={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="recruitment">Recruitment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <span className="material-icons mr-2 text-sm">person_add</span>
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm onSuccess={() => setIsFormDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEmployeeId(user.id)}
                          >
                            View
                          </Button>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No employees found matching your criteria.</p>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
