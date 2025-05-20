import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { calculateTimeLeft } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

interface ProjectListProps {
  projects: any[] | undefined;
  isLoading: boolean;
  onSelectProject: (id: number) => void;
}

export function ProjectList({ projects, isLoading, onSelectProject }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter projects based on search query
  const filteredProjects = projects?.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Determine project status based on dates
  const getProjectStatus = (project: any) => {
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    
    if (now < startDate) {
      return { status: "Not Started", color: "bg-blue-100 text-blue-700" };
    } else if (now > endDate) {
      return { status: "Completed", color: "bg-green-100 text-green-700" };
    } else {
      // Calculate progress percentage
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      
      if (progress > 90) {
        return { status: "Ending Soon", color: "bg-amber-100 text-amber-700", progress };
      }
      return { status: "In Progress", color: "bg-blue-100 text-blue-700", progress };
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle>All Projects</CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const { status, color, progress } = getProjectStatus(project);
                
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-neutral-500">Code: {project.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(project.startDate)}</span>
                          <span className="text-neutral-300">→</span>
                          <span>{formatDate(project.endDate)}</span>
                        </div>
                        {progress !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={progress} className="w-32" />
                            <span className="text-xs text-neutral-500">{progress}%</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={color}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Staffing:</span>
                          <span className="text-sm font-medium">
                            {project.assignmentsCount}/{project.requirementsCount}
                          </span>
                        </div>
                        <Progress 
                          value={project.fulfillmentPercentage} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSelectProject(project.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <div className="text-neutral-500 text-lg mb-2">No projects found</div>
            <p className="text-neutral-400 mb-4">
              {searchQuery 
                ? "Try adjusting your search criteria"
                : "Start by creating your first project"}
            </p>
            {searchQuery && (
              <Button 
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
