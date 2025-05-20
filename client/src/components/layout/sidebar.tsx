import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItem = {
  label: string;
  icon: string;
  href: string;
  roles: string[];
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [
      { 
        label: "Dashboard", 
        icon: "dashboard", 
        href: "/", 
        roles: ["admin", "project_manager", "employee", "sales", "recruitment"] 
      },
      { 
        label: "Skill Management", 
        icon: "psychology", 
        href: "/skills", 
        roles: ["admin", "project_manager", "employee", "sales", "recruitment"] 
      },
      { 
        label: "Projects", 
        icon: "business_center", 
        href: "/projects", 
        roles: ["admin", "project_manager", "employee"] 
      },
      { 
        label: "Timesheets", 
        icon: "schedule", 
        href: "/timesheets", 
        roles: ["admin", "project_manager", "employee"] 
      },
      { 
        label: "Sales Pipeline", 
        icon: "trending_up", 
        href: "/sales", 
        roles: ["admin", "project_manager", "sales"] 
      },
      { 
        label: "Recruitment", 
        icon: "people", 
        href: "/recruitment", 
        roles: ["admin", "recruitment"] 
      },
      { 
        label: "Employees", 
        icon: "badge", 
        href: "/employees", 
        roles: ["admin", "project_manager"] 
      },
    ]
  },
  {
    title: "Administration",
    items: [
      { 
        label: "Settings", 
        icon: "settings", 
        href: "/settings", 
        roles: ["admin"] 
      },
      { 
        label: "User Management", 
        icon: "admin_panel_settings", 
        href: "/users", 
        roles: ["admin"] 
      },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  if (!user) {
    return null;
  }
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {isMobile && (
        <div className="fixed top-4 left-4 z-30">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white shadow-md" 
            onClick={toggleSidebar}
          >
            <span className="material-icons">
              {isOpen ? "close" : "menu"}
            </span>
          </Button>
        </div>
      )}
      
      <aside 
        className={cn(
          "bg-white w-64 border-r border-gray-200 h-full flex flex-col",
          "fixed lg:relative z-20 transition-all duration-300 ease-in-out",
          {
            "translate-x-0": isOpen,
            "-translate-x-full lg:translate-x-0": !isOpen
          }
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-primary text-white font-bold text-xl p-2 rounded-md">C</div>
            <h1 className="text-lg font-semibold ml-2">Coditas WFM</h1>
          </div>
        </div>
        
        {/* User profile section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="material-icons text-neutral-500">person</span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-neutral-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="mt-6 mb-2 px-6 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul>
                {section.items
                  .filter(item => user && item.roles.includes(user.role))
                  .map((item, itemIndex) => (
                    <li key={itemIndex} className="mb-1 px-3">
                      <div 
                        onClick={() => {
                          if (isMobile) setIsOpen(false);
                          window.location.href = item.href;
                        }}
                        className={cn(
                          "flex items-center py-2 px-3 rounded-md text-sm cursor-pointer",
                          location === item.href
                            ? "sidebar-link active bg-primary text-white"
                            : "sidebar-link text-neutral-700 hover:bg-gray-100"
                        )}
                      >
                        <span 
                          className={cn(
                            "material-icons mr-3 text-[20px]",
                            location === item.href ? "" : "text-neutral-500"
                          )}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                    </li>
                  ))
                }
              </ul>
            </div>
          ))}
        </nav>
        
        {/* Logout option */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center py-2 px-3 text-sm text-neutral-700 hover:bg-neutral-100 rounded-md w-full"
          >
            <span className="material-icons mr-3 text-[20px] text-neutral-500">logout</span>
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
