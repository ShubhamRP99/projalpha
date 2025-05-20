import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isBefore, isToday, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { experienceBands } from "@shared/schema";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema for project creation
const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  code: z.string().min(3, "Project code must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.coerce.date({
    errorMap: () => ({ message: "Please select a valid start date" })
  }).refine(date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, {
    message: "Start date cannot be in the past"
  }),
  endDate: z.coerce.date({
    errorMap: () => ({ message: "Please select a valid end date" })
  }),
  requirements: z.array(z.object({
    skillId: z.number().min(1, "Please select a skill"),
    experienceBand: z.string().min(1, "Please select an experience level"),
    peopleNeeded: z.number().min(1, "At least 1 person required"),
    hoursPerMonth: z.number().min(1, "Hours per month must be at least 1"),
  })).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projectName, setProjectName] = useState('');
  
  // Fetch skills for requirements dropdown
  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  // Fetch existing projects to ensure code uniqueness
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });
  
  // Generate project code based on name
  const generateProjectCode = (name: string) => {
    if (!name) return '';
    
    // Get first 3 letters in uppercase
    const prefix = name.substring(0, 3).toUpperCase();
    
    // Find existing project codes with this prefix to determine next number
    const existingCodes = projects?.filter(p => p.code?.startsWith(`${prefix}-`)) || [];
    const nextNumber = existingCodes.length + 1;
    
    // Format with leading zeros
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };
  
  // Update code when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProjectName(name);
    const code = generateProjectCode(name);
    form.setValue('code', code);
  };
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      requirements: [
        {
          skillId: undefined as unknown as number,
          experienceBand: "",
          peopleNeeded: 1,
          hoursPerMonth: 160,
        }
      ],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requirements",
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      // Format dates properly for the API
      const formattedData = {
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
        createdBy: user?.id,
      };
      
      // Create project first
      const projectRes = await apiRequest("POST", "/api/projects", formattedData);
      const project = await projectRes.json();
      
      // Add requirements if provided
      if (data.requirements && data.requirements.length > 0) {
        for (const req of data.requirements) {
          if (req.skillId) {
            await apiRequest("POST", `/api/projects/${project.id}/requirements`, req);
          }
        }
      }
      
      return project;
    },
    onSuccess: () => {
      toast({
        title: "Project created",
        description: "The project has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddRequirement = () => {
    append({
      skillId: undefined as unknown as number,
      experienceBand: "",
      peopleNeeded: 1,
      hoursPerMonth: 160,
    });
  };
  
  const onSubmit = (data: ProjectFormData) => {
    // Filter out any requirements that don't have a skillId
    const validRequirements = data.requirements?.filter(req => req.skillId) || [];
    createProjectMutation.mutate({
      ...data,
      requirements: validRequirements,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project and add skill requirements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Project details section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Project Details</h3>
            </div>
            
            {/* Project name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name*</Label>
              <Input 
                id="name" 
                placeholder="Enter project name" 
                {...form.register("name")}
                onChange={handleNameChange}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            {/* Project code */}
            <div className="space-y-2">
              <Label htmlFor="code">Project Code* (Auto-generated)</Label>
              <Input 
                id="code" 
                placeholder="e.g., PRJ-001" 
                disabled
                {...form.register("code")}
              />
              <p className="text-xs text-gray-500">Code will be auto-generated based on project name</p>
              {form.formState.errors.code && (
                <p className="text-red-500 text-sm">{form.formState.errors.code.message}</p>
              )}
            </div>
            
            {/* Start date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.getValues("startDate") && "text-muted-foreground"
                    )}
                  >
                    {form.getValues("startDate") ? (
                      format(form.getValues("startDate"), "PPP")
                    ) : (
                      <span>Select a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.getValues("startDate") || undefined}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("startDate", date);
                        
                        // Also validate end date in relation to this new start date
                        const endDateValue = form.getValues("endDate");
                        if (endDateValue && isBefore(endDateValue, date)) {
                          form.setError("endDate", {
                            message: "End date must be after start date"
                          });
                        } else {
                          form.clearErrors("endDate");
                        }
                      }
                    }}
                    disabled={(date) => 
                      // Disable dates in the past
                      isBefore(date, new Date()) && !isToday(date)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.startDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            
            {/* End date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.getValues("endDate") && "text-muted-foreground"
                    )}
                  >
                    {form.getValues("endDate") ? (
                      format(form.getValues("endDate"), "PPP")
                    ) : (
                      <span>Select a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.getValues("endDate") || undefined}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("endDate", date);
                        
                        // Validate against start date
                        const startDateValue = form.getValues("startDate");
                        if (startDateValue && isBefore(date, startDateValue)) {
                          form.setError("endDate", {
                            message: "End date must be after start date"
                          });
                        } else {
                          form.clearErrors("endDate");
                        }
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates in the past
                      if (isBefore(date, new Date()) && !isToday(date)) {
                        return true;
                      }
                      
                      // Disable dates before start date (if selected)
                      const startDate = form.getValues("startDate");
                      if (startDate && date && isBefore(date, startDate) && !isToday(date)) {
                        return true;
                      }
                      
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.endDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.endDate.message}</p>
              )}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter project description" 
                rows={3}
                {...form.register("description")}
              />
            </div>
            
            {/* Skill Requirements section */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium mb-4">Skill Requirements</h3>
            </div>
            
            {/* Skills table */}
            <div className="md:col-span-2">
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>People</TableHead>
                      <TableHead>Hours/Month</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Select
                            onValueChange={(value) => {
                              form.setValue(`requirements.${index}.skillId`, parseInt(value));
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Skill" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingSkills ? (
                                <div className="p-2 text-center">Loading skills...</div>
                              ) : (
                                skills?.map((skill) => (
                                  <SelectItem key={skill.id} value={skill.id.toString()}>
                                    {skill.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) => {
                              form.setValue(`requirements.${index}.experienceBand`, value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                              {experienceBands.map((band) => (
                                <SelectItem key={band} value={band}>
                                  {band} years
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            defaultValue={1}
                            {...form.register(`requirements.${index}.peopleNeeded`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            defaultValue={160}
                            {...form.register(`requirements.${index}.hoursPerMonth`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 p-1 h-8 w-8"
                            onClick={() => remove(index)}
                          >
                            <span className="material-icons">delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="mt-2 flex items-center text-primary text-sm font-medium"
                onClick={handleAddRequirement}
              >
                <span className="material-icons text-[18px] mr-1">add_circle</span>
                Add Skill Requirement
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
