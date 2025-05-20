import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function SkillDistribution() {
  const [skillFilter, setSkillFilter] = useState("all");
  
  const { data: distribution, isLoading } = useQuery({
    queryKey: ["/api/dashboard/skill-distribution"],
  });
  
  // Filter distribution data based on the selected filter
  const filteredData = distribution?.filter(item => {
    if (skillFilter === "all") return true;
    if (skillFilter === "tech") return ["Frontend", "Backend", "Cloud", "Infrastructure"].includes(item.skillCategory);
    if (skillFilter === "soft") return item.skillCategory === "Soft Skills";
    if (skillFilter === "domain") return item.skillCategory === "Domain";
    return true;
  });
  
  // Highlight rows that have skill gaps (e.g., few senior resources)
  const shouldHighlightRow = (item: any) => {
    // Highlight if there's a significant gap in senior skills
    return (item.bands["10+"] <= 2 || item.bands["7-10"] <= 3) && item.total >= 40;
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Skill Distribution</CardTitle>
        <Select
          defaultValue={skillFilter}
          onValueChange={setSkillFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            <SelectItem value="tech">Technical</SelectItem>
            <SelectItem value="soft">Soft Skills</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Skill</TableHead>
                  <TableHead className="text-left">0-2 yrs</TableHead>
                  <TableHead className="text-left">2-5.5 yrs</TableHead>
                  <TableHead className="text-left">5.5-7 yrs</TableHead>
                  <TableHead className="text-left">7-10 yrs</TableHead>
                  <TableHead className="text-left">10+ yrs</TableHead>
                  <TableHead className="text-left">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData?.map((item, index) => (
                  <TableRow 
                    key={index}
                    className={shouldHighlightRow(item) ? "bg-yellow-50" : "hover:bg-neutral-50"}
                  >
                    <TableCell className="font-medium">{item.skillName}</TableCell>
                    <TableCell>{item.bands["0-2"]}</TableCell>
                    <TableCell>{item.bands["2-5.5"]}</TableCell>
                    <TableCell>{item.bands["5.5-7"]}</TableCell>
                    <TableCell className={item.bands["7-10"] <= 3 ? "text-red-600 font-medium" : ""}>
                      {item.bands["7-10"]}
                    </TableCell>
                    <TableCell className={item.bands["10+"] <= 2 ? "text-red-600 font-medium" : ""}>
                      {item.bands["10+"]}
                    </TableCell>
                    <TableCell className="font-medium">{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!isLoading && filteredData && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-neutral-500 text-sm">
                  Showing <span className="font-medium">{filteredData.length}</span> of{" "}
                  <span className="font-medium">{distribution?.length}</span> skills
                </div>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="mr-2">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
