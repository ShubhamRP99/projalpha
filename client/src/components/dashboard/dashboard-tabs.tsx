import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: "Projects" },
    { id: "resources", label: "Resources" },
    { id: "pipeline", label: "Pipeline" },
    { id: "recruitment", label: "Recruitment" }
  ];
  
  return (
    <div className="mb-6 border-b border-gray-200">
      <ul className="flex space-x-8 -mb-px">
        {tabs.map(tab => (
          <li key={tab.id}>
            <Button
              variant="ghost"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
