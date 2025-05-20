import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Bell, HelpCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
}

export function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Extract the current section from the URL
  const section = location.split('/')[1] || 'dashboard';
  const pageTitle = title || section.charAt(0).toUpperCase() + section.slice(1);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log(`Searching for: ${searchQuery}`);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
      {/* Left side - Page title and breadcrumbs */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">{pageTitle}</h1>
        {subtitle && (
          <div className="text-sm text-neutral-500 mt-1">
            {subtitle}
          </div>
        )}
        {!subtitle && (
          <div className="text-sm text-neutral-500 mt-1">
            <span>Home</span>
            {section !== 'dashboard' && (
              <>
                <span className="mx-1">/</span>
                <span className="capitalize">{section}</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Right side - Search and Notifications */}
      <div className="flex items-center space-x-4">
        {/* Search box */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Input
            type="text"
            placeholder="Search..."
            className="bg-neutral-50 border border-neutral-200 rounded-md py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        </form>
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-neutral-600" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium">New project created</span>
                <span className="text-sm text-neutral-500">E-commerce Platform has been created</span>
                <span className="text-xs text-neutral-400 mt-1">2 hours ago</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium">Project assignment</span>
                <span className="text-sm text-neutral-500">You've been assigned to Cloud Migration</span>
                <span className="text-xs text-neutral-400 mt-1">Yesterday</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium">Timesheet reminder</span>
                <span className="text-sm text-neutral-500">Please submit your timesheet for this week</span>
                <span className="text-xs text-neutral-400 mt-1">2 days ago</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer flex justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5 text-neutral-600" />
        </Button>
      </div>
    </div>
  );
}
