import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { experienceBands, ratings } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Schema for the form
const skillRatingSchema = z.object({
  skillId: z.number({
    required_error: "Please select a skill",
  }),
  experienceBand: z.enum(experienceBands, {
    required_error: "Please select an experience band",
  }),
  rating: z.enum(ratings, {
    required_error: "Please select a rating",
  }),
  yearsOfExperience: z.number({
    required_error: "Years of experience is required",
  }).min(0, "Years must be positive").max(50, "Please enter a valid number of years"),
});

type SkillRatingFormData = z.infer<typeof skillRatingSchema>;

export function SkillRatingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sliderValue, setSliderValue] = useState(0);
  
  // Fetch skills for dropdown
  const { data: skills, isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills"],
  });
  
  // Initialize the form
  const form = useForm<SkillRatingFormData>({
    resolver: zodResolver(skillRatingSchema),
    defaultValues: {
      skillId: undefined,
      experienceBand: undefined,
      rating: undefined,
      yearsOfExperience: 0,
    },
  });
  
  // Watch experience band to update slider range
  const watchExperienceBand = form.watch("experienceBand");
  
  // Get the min and max years for the slider based on experience band
  const getYearRange = (band?: string): [number, number] => {
    if (!band) return [0, 2];
    
    switch(band) {
      case "0-2": return [0, 2];
      case "2-5": return [0, 5];  // Always start from 0
      case "5-7": return [0, 7];  // Always start from 0
      case "7-10": return [0, 10]; // Always start from 0
      case "10+": return [0, 20];  // Always start from 0
      default: return [0, 2];
    }
  };
  
  const [minYears, maxYears] = getYearRange(watchExperienceBand);
  
  // Update years of experience when slider changes
  const handleSliderChange = (value: number[]) => {
    const years = value[0];
    setSliderValue(years);
    form.setValue("yearsOfExperience", years);
  };
  
  // Update slider when experience band changes
  const handleExperienceBandChange = (value: string) => {
    form.setValue("experienceBand", value as any);
    
    // Set default years based on the band
    const [min, max] = getYearRange(value);
    const defaultYears = (min + max) / 2;
    form.setValue("yearsOfExperience", defaultYears);
    setSliderValue(defaultYears);
  };
  
  // Create/update skill mapping mutation
  const skillMappingMutation = useMutation({
    mutationFn: async (data: SkillRatingFormData) => {
      const res = await apiRequest(
        "POST", 
        `/api/employees/${user?.id}/skills`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Skill mapping updated",
        description: "Your skill has been successfully updated",
      });
      
      // Reset form inputs
      form.reset();
      setSliderValue(0);
      
      // Force strong cache invalidation - this ensures all components using the data will refresh
      queryClient.invalidateQueries();
      
      // Force immediate refetch to ensure UI update for critical data paths
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/employees/${user?.id}/skills`] });
        queryClient.refetchQueries({ queryKey: ["/api/dashboard/skill-distribution"] });
        queryClient.refetchQueries({ queryKey: ["/api/skills"] });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error updating skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SkillRatingFormData) => {
    skillMappingMutation.mutate(data);
  };
  
  // Generate years label for slider
  const getYearsLabel = () => {
    const years = form.getValues("yearsOfExperience");
    return years ? `${years.toFixed(1)} years` : "Select years";
  };
  
  // Calculate slider percentage based on years and range
  const sliderPercentage = minYears === maxYears 
    ? 100 
    : ((sliderValue - minYears) / (maxYears - minYears)) * 100;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="skillId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skill</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingSkills ? (
                    <div className="p-2 text-center">Loading skills...</div>
                  ) : (
                    skills?.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id.toString()}>
                        {skill.name} ({skill.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="experienceBand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Band</FormLabel>
              <Select
                onValueChange={handleExperienceBandChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience band" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {experienceBands.map((band) => (
                    <SelectItem key={band} value={band}>
                      {band} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skill Rating</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your proficiency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ratings.map((rating) => (
                    <SelectItem key={rating} value={rating}>
                      {rating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="yearsOfExperience"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Years of Experience in a Skill</FormLabel>
                <span className="text-sm">{getYearsLabel()}</span>
              </div>
              <FormControl>
                <div>
                  <Slider
                    disabled={!watchExperienceBand}
                    value={[sliderValue]}
                    min={minYears}
                    max={maxYears}
                    step={0.1}
                    onValueChange={handleSliderChange}
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>{minYears}</span>
                    <span>{maxYears}</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={skillMappingMutation.isPending}
        >
          {skillMappingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Skill"}
        </Button>
      </form>
    </Form>
  );
}
