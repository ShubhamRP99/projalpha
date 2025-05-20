import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Schema for assignment
const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  skillId: z.string().min(1, "Skill is required"),
  experienceBand: z.string().min(1, "Experience level is required"),
  assignedHoursPerMonth: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, { 
    message: "Hours per month must be greater than 0" 
  })
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  requirementId?: number;
  skillId?: number;
  experienceBand?: string;
  hoursPerMonth?: number;
  fromRequirement?: boolean;
}

export function AssignTeamMemberModal({ 
  isOpen, 
  onClose, 
  projectId,
  requirementId,
  skillId,
  experienceBand,
  hoursPerMonth,
  fromRequirement = false
}: AssignTeamMemberModalProps) {
  const { toast } = useToast();
  
  // Reset form with updated values when modal opens or props change
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: "",
      skillId: "",
      experienceBand: "",
      assignedHoursPerMonth: "40"
    }
  });
  
  // Reset form values when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      form.reset({
        employeeId: "",
        skillId: skillId ? skillId.toString() : "",
        experienceBand: experienceBand || "",
        assignedHoursPerMonth: hoursPerMonth ? hoursPerMonth.toString() : "40"
      });
    }
  }, [isOpen, skillId, experienceBand, hoursPerMonth, form]);
  
  // Get list of employees
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Get list of skills
  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  const assignTeamMemberMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/assignments`, {
        ...data,
        employeeId: parseInt(data.employeeId, 10),
        skillId: parseInt(data.skillId, 10),
        assignedHoursPerMonth: parseInt(data.assignedHoursPerMonth, 10)
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team member assigned",
        description: "The team member has been assigned to the project successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/employees`] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error assigning team member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: AssignmentFormData) => {
    assignTeamMemberMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Team Member</DialogTitle>
          <DialogDescription>
            Assign an employee to this project based on skill requirements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee*</Label>
            <Select 
              onValueChange={(value) => form.setValue("employeeId", value)}
              defaultValue={form.getValues("employeeId")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {users && users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.employeeId && (
              <p className="text-red-500 text-sm">{form.formState.errors.employeeId.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skillId">Skill*</Label>
            <Select 
              onValueChange={(value) => form.setValue("skillId", value)}
              value={form.getValues("skillId")}
              disabled={fromRequirement}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {skills && skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id.toString()}>
                    {skill.name} ({skill.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.skillId && (
              <p className="text-red-500 text-sm">{form.formState.errors.skillId.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experienceBand">Experience Level*</Label>
            <Select 
              onValueChange={(value) => form.setValue("experienceBand", value)}
              value={form.getValues("experienceBand")}
              disabled={fromRequirement}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {["0-2", "2-5", "5-7", "7-10", "10+"].map((band) => (
                  <SelectItem key={band} value={band}>
                    {band}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.experienceBand && (
              <p className="text-red-500 text-sm">{form.formState.errors.experienceBand.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignedHoursPerMonth">Assigned Hours Per Month*</Label>
            <Input 
              id="assignedHoursPerMonth" 
              type="number" 
              min="1"
              {...form.register("assignedHoursPerMonth")}
            />
            {form.formState.errors.assignedHoursPerMonth && (
              <p className="text-red-500 text-sm">{form.formState.errors.assignedHoursPerMonth.message}</p>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignTeamMemberMutation.isPending}>
              {assignTeamMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}