import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for the form
const skillFormSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

interface EditSkillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: {
    id: number;
    name: string;
    category: string;
  };
}

export function EditSkillForm({ open, onOpenChange, skill }: EditSkillFormProps) {
  const { toast } = useToast();
  
  // Get categories from the API
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Initialize the form
  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: skill.name,
      category: skill.category,
    },
  });
  
  // Update form values when skill changes
  useEffect(() => {
    if (skill) {
      form.reset({
        name: skill.name,
        category: skill.category,
      });
    }
  }, [skill, form]);
  
  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      // Make sure we have the correct content type
      const res = await apiRequest("PATCH", `/api/skills/${skill.id}`, data);
      if (!res.ok) {
        let errorText = "Failed to update skill";
        try {
          const errorData = await res.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          try {
            errorText = await res.text() || errorText;
          } catch (e2) {
            // Use default error message
          }
        }
        throw new Error(errorText);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skill updated",
        description: "The skill has been updated successfully",
      });
      // Invalidate all affected queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/skill-distribution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SkillFormData) => {
    updateSkillMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., React, Node.js, AWS" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateSkillMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateSkillMutation.isPending}
              >
                {updateSkillMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Update Skill"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}