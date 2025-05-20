import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for the form
const skillFormSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

interface AddSkillFormProps {
  buttonLabel?: string;
}

export function AddSkillForm({ buttonLabel = "Add New Skill" }: AddSkillFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  // Get categories from the API
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Initialize the form
  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      category: "",
    },
  });
  
  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      const res = await apiRequest("POST", "/api/skills", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skill created",
        description: "The skill has been added successfully",
      });
      // Invalidate all affected queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/skill-distribution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SkillFormData) => {
    createSkillMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{buttonLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
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
                onClick={() => setOpen(false)}
                disabled={createSkillMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createSkillMutation.isPending}
              >
                {createSkillMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : "Add Skill"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}