import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimesheetForm } from "@/components/timesheets/timesheet-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatShortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export default function TimesheetsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("daily");
  
  const { data: timesheets, isLoading } = useQuery({
    queryKey: [`/api/employees/${user?.id}/timesheets`],
    enabled: !!user?.id,
  });
  
  // Filter timesheets based on selected date and active tab
  const filteredTimesheets = timesheets?.filter(timesheet => {
    const timesheetDate = new Date(timesheet.date);
    
    if (activeTab === "daily" && selectedDate) {
      return (
        timesheetDate.getDate() === selectedDate.getDate() &&
        timesheetDate.getMonth() === selectedDate.getMonth() &&
        timesheetDate.getFullYear() === selectedDate.getFullYear()
      );
    }
    
    if (activeTab === "weekly" && selectedDate) {
      // Get the week start (Sunday) and end (Saturday)
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return timesheetDate >= weekStart && timesheetDate <= weekEnd;
    }
    
    if (activeTab === "monthly" && selectedDate) {
      return (
        timesheetDate.getMonth() === selectedDate.getMonth() &&
        timesheetDate.getFullYear() === selectedDate.getFullYear()
      );
    }
    
    return true;
  });
  
  // Calculate daily hours
  const dailyHours = filteredTimesheets?.reduce((total, timesheet) => {
    return total + timesheet.hours;
  }, 0) || 0;
  
  // Group timesheets by date for weekly/monthly view
  const groupedTimesheets = filteredTimesheets?.reduce((groups, timesheet) => {
    const date = formatShortDate(timesheet.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(timesheet);
    return groups;
  }, {} as Record<string, typeof timesheets>);
  
  return (
    <AppLayout title="Timesheets">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Time</CardTitle>
            </CardHeader>
            <CardContent>
              <TimesheetForm selectedDate={selectedDate} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="border rounded-md p-3"
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <CardTitle>My Timesheets</CardTitle>
                <div>
                  <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "daily" && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">
                        {selectedDate ? formatDate(selectedDate) : "Today"}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        Total Hours: {dailyHours} / 8
                        {dailyHours > 8 && (
                          <Badge variant="destructive" className="ml-2">Exceeds Daily Limit</Badge>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const yesterday = new Date(selectedDate || new Date());
                          yesterday.setDate(yesterday.getDate() - 1);
                          setSelectedDate(yesterday);
                        }}
                      >
                        Previous Day
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const tomorrow = new Date(selectedDate || new Date());
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setSelectedDate(tomorrow);
                        }}
                      >
                        Next Day
                      </Button>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : filteredTimesheets && filteredTimesheets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTimesheets.map((timesheet) => (
                          <TableRow key={timesheet.id}>
                            <TableCell className="font-medium">{timesheet.projectName}</TableCell>
                            <TableCell>{timesheet.projectCode}</TableCell>
                            <TableCell>{timesheet.hours}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">No timesheet entries for this day.</p>
                      <p className="text-sm text-neutral-400">Use the form on the left to log your time.</p>
                    </div>
                  )}
                </>
              )}
              
              {(activeTab === "weekly" || activeTab === "monthly") && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">
                      {activeTab === "weekly" ? "Weekly" : "Monthly"} Summary - {formatDate(selectedDate || new Date())}
                    </h3>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : groupedTimesheets && Object.keys(groupedTimesheets).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedTimesheets).map(([date, entries]) => {
                        const dailyTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);
                        
                        return (
                          <div key={date} className="border rounded-md overflow-hidden">
                            <div className="bg-neutral-50 px-4 py-2 flex justify-between items-center">
                              <div className="font-medium">{date}</div>
                              <div className="text-sm">
                                Total: {dailyTotal} hours
                                {dailyTotal > 8 && (
                                  <Badge variant="destructive" className="ml-2">Exceeds Limit</Badge>
                                )}
                              </div>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Project</TableHead>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Hours</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entries.map((timesheet) => (
                                  <TableRow key={timesheet.id}>
                                    <TableCell className="font-medium">{timesheet.projectName}</TableCell>
                                    <TableCell>{timesheet.projectCode}</TableCell>
                                    <TableCell>{timesheet.hours}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 mb-4">No timesheet entries for this period.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
