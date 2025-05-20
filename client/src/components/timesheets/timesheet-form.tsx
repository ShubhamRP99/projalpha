import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Schema for the form
const timesheetSchema = z.object({
  projectId: z.number({
    required_error: "Please select a project",
  }),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please select a valid date",
  }),
  hours: z.number({
    required_error: "Hours are required",
  }).min(0.5, "Minimum 0.5 hours").max(8, "Maximum 8 hours per day"),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

interface TimesheetFormProps {
  selectedDate?: Date;
}

export function TimesheetForm({ selectedDate }: TimesheetFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user's project assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/employees/${user?.id}/assignments`],
    enabled: !!user?.id,
  });
  
  // Fetch user's timesheets for the selected date to check daily hours
  const formattedDate = selectedDate ? formatDate(selectedDate) : formatDate(new Date());
  const { data: timesheets, isLoading: isLoadingTimesheets } = useQuery({
    queryKey: [`/api/employees/${user?.id}/timesheets?date=${formattedDate}`],
    enabled: !!user?.id,
  });
  
  // Calculate total hours logged for the day
  const totalHoursForDay = timesheets?.reduce((sum, timesheet) => sum + timesheet.hours, 0) || 0;
  const remainingHours = Math.max(0, 8 - totalHoursForDay);
  
  // Initialize form
  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      projectId: undefined,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hours: Math.min(1, remainingHours),
    },
  });
  
  // Update form when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue("date", selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate, form]);
  
  // Update form when remaining hours changes
  useEffect(() => {
    const currentHours = form.getValues("hours");
    if (currentHours > remainingHours) {
      form.setValue("hours", remainingHours);
    }
  }, [remainingHours, form]);
  
  // Create timesheet mutation
  const timesheetMutation = useMutation({
    mutationFn: async (data: TimesheetFormData) => {
      const res = await apiRequest("POST", "/api/timesheets", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Timesheet created",
        description: "Your timesheet entry has been logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${user?.id}/timesheets`] });
      form.reset({
        projectId: undefined,
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        hours: Math.min(1, remainingHours),
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging time",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TimesheetFormData) => {
    timesheetMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingAssignments ? (
                    <div className="p-2 text-center">Loading projects...</div>
                  ) : assignments && assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <SelectItem key={assignment.projectId} value={assignment.projectId.toString()}>
                        {assignment.projectName} - {assignment.skillName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center">No projects assigned</div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between">
                <FormLabel>Hours</FormLabel>
                <span className="text-sm text-neutral-500">
                  {totalHoursForDay}/8 hours logged today
                </span>
              </div>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.5" 
                  min="0.5" 
                  max={remainingHours || 8} 
                  {...field}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              {remainingHours === 0 && (
                <p className="text-amber-500 text-sm">
                  You have already logged 8 hours for today
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={timesheetMutation.isPending || isLoadingAssignments || remainingHours === 0 || !assignments?.length}
        >
          {timesheetMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging Time...
            </>
          ) : "Log Time"}
        </Button>
        
        {!assignments?.length && !isLoadingAssignments && (
          <p className="text-neutral-500 text-sm text-center">
            You need to be assigned to a project before you can log time
          </p>
        )}
      </form>
    </Form>
  );
}
