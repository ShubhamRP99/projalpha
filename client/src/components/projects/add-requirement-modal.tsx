import { useState } from "react";
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
import { experienceBands } from "@shared/schema";
import { Loader2 } from "lucide-react";

const requirementSchema = z.object({
  skillId: z.string().min(1, "Skill is required"),
  experienceBand: z.string().min(1, "Experience level is required"),
  peopleNeeded: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, { message: "Number of people must be greater than 0" }),
  hoursPerMonth: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, { message: "Hours per month must be greater than 0" })
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

export function AddRequirementModal({ isOpen, onClose, projectId }: AddRequirementModalProps) {
  const { toast } = useToast();
  
  const form = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      skillId: "",
      experienceBand: "",
      peopleNeeded: "1",
      hoursPerMonth: "40"
    }
  });
  
  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  const addRequirementMutation = useMutation({
    mutationFn: async (data: RequirementFormData) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/requirements`, {
        ...data,
        skillId: parseInt(data.skillId, 10),
        peopleNeeded: parseInt(data.peopleNeeded, 10),
        hoursPerMonth: parseInt(data.hoursPerMonth, 10)
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Requirement added",
        description: "The skill requirement has been added to the project.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding requirement",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: RequirementFormData) => {
    addRequirementMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Skill Requirement</DialogTitle>
          <DialogDescription>
            Define a new skill requirement for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="skillId">Required Skill*</Label>
            <Select 
              onValueChange={(value) => form.setValue("skillId", value)}
              defaultValue={form.getValues("skillId")}
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
              defaultValue={form.getValues("experienceBand")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {experienceBands.map((band) => (
                  <SelectItem key={band} value={band}>
                    {band} years
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.experienceBand && (
              <p className="text-red-500 text-sm">{form.formState.errors.experienceBand.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="peopleNeeded">Number of People Needed*</Label>
            <Input 
              id="peopleNeeded" 
              type="number" 
              min="1"
              {...form.register("peopleNeeded")}
            />
            {form.formState.errors.peopleNeeded && (
              <p className="text-red-500 text-sm">{form.formState.errors.peopleNeeded.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hoursPerMonth">Hours Per Month*</Label>
            <Input 
              id="hoursPerMonth" 
              type="number" 
              min="1"
              {...form.register("hoursPerMonth")}
            />
            {form.formState.errors.hoursPerMonth && (
              <p className="text-red-500 text-sm">{form.formState.errors.hoursPerMonth.message}</p>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addRequirementMutation.isPending}>
              {addRequirementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Requirement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}