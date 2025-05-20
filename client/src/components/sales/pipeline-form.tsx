import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isBefore, isToday, addDays, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { pipelineStatuses, experienceBands } from "@shared/schema";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Schema for pipeline project
const pipelineSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  expectedStartDate: z.coerce.date({
    errorMap: () => ({ message: "Please select a valid start date" })
  }).refine(date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, {
    message: "Start date cannot be in the past"
  }),
  expectedEndDate: z.coerce.date({
    errorMap: () => ({ message: "Please select a valid end date" })
  }),
  status: z.enum(pipelineStatuses, {
    required_error: "Please select a status",
  }),
  demands: z.array(z.object({
    skillId: z.number({
      required_error: "Please select a skill",
    }),
    experienceBand: z.enum(experienceBands, {
      required_error: "Please select an experience level",
    }),
    peopleNeeded: z.number().min(1, "At least 1 person required"),
  })).optional(),
}).refine(data => data.expectedEndDate >= data.expectedStartDate, {
  message: "End date must be after start date",
  path: ["expectedEndDate"],
});

type PipelineFormData = z.infer<typeof pipelineSchema>;

interface PipelineFormProps {
  onSuccess?: () => void;
}

export function PipelineForm({ onSuccess }: PipelineFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch skills for dropdown
  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  // Get today's date at midnight for date validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Initialize form
  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      name: "",
      expectedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      expectedEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      status: "Prospect",
      demands: [
        {
          skillId: undefined as unknown as number,
          experienceBand: "2-5",
          peopleNeeded: 1,
        }
      ],
    },
    mode: "onChange", // Enable real-time validation
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "demands",
  });
  
  // Create pipeline project mutation
  const createPipelineMutation = useMutation({
    mutationFn: async (data: PipelineFormData) => {
      // Format dates properly for the API
      const formattedData = {
        ...data,
        // Ensure dates are passed as serializable ISO strings
        expectedStartDate: data.expectedStartDate,
        expectedEndDate: data.expectedEndDate,
        createdBy: user?.id,
      };
      
      // Create pipeline project first
      const pipelineRes = await apiRequest("POST", "/api/pipeline", formattedData);
      const pipeline = await pipelineRes.json();
      
      // Add skill demands
      if (data.demands && data.demands.length > 0) {
        for (const demand of data.demands) {
          if (demand.skillId) {
            await apiRequest("POST", `/api/pipeline/${pipeline.id}/skills`, demand);
          }
        }
      }
      
      return pipeline;
    },
    onSuccess: () => {
      toast({
        title: "Pipeline project created",
        description: "The project has been added to the pipeline",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error creating pipeline project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddDemand = () => {
    append({
      skillId: undefined as unknown as number,
      experienceBand: "2-5",
      peopleNeeded: 1,
    });
  };
  
  const onSubmit = (data: PipelineFormData) => {
    // Filter out any demands that don't have a skillId
    const validDemands = data.demands?.filter(demand => demand.skillId) || [];
    createPipelineMutation.mutate({
      ...data,
      demands: validDemands,
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Project Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pipeline project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expectedStartDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Start Date*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        
                        // Also validate end date in relation to this new start date
                        const endDateValue = form.getValues("expectedEndDate");
                        if (endDateValue && date && isBefore(endDateValue, date)) {
                          form.setError("expectedEndDate", {
                            message: "End date must be after start date"
                          });
                        } else {
                          form.clearErrors("expectedEndDate");
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expectedEndDate"
            render={({ field }) => {
              const startDate = form.getValues("expectedStartDate");
              
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected End Date*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          // Disable dates in the past
                          if (isBefore(date, new Date()) && !isToday(date)) {
                            return true;
                          }
                          
                          // Disable dates before start date (if selected)
                          if (startDate && isBefore(date, startDate)) {
                            return true;
                          }
                          
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Status*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pipelineStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Skill demands */}
        <div className="space-y-3">
          <div className="font-medium">Skill Requirements</div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Experience Level</TableHead>
                  <TableHead>People Needed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Select
                        onValueChange={(value) => {
                          form.setValue(`demands.${index}.skillId`, parseInt(value));
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
                        defaultValue={field.experienceBand}
                        onValueChange={(value) => {
                          form.setValue(`demands.${index}.experienceBand`, value as any);
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
                        defaultValue="1"
                        {...form.register(`demands.${index}.peopleNeeded`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
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
            className="flex items-center text-sm"
            onClick={handleAddDemand}
          >
            <span className="material-icons text-[18px] mr-1">add_circle</span>
            Add Skill Requirement
          </Button>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
            disabled={createPipelineMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPipelineMutation.isPending}
          >
            {createPipelineMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : "Create Pipeline Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
