import { AppLayout } from "@/components/layout/app-layout";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ProjectTimeline } from "@/components/dashboard/project-timeline";
import { SkillDistribution } from "@/components/dashboard/skill-distribution";
import { RecruitmentNeeds } from "@/components/dashboard/recruitment-needs";
import { UpcomingProjects } from "@/components/dashboard/upcoming-projects";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      {/* Tabs for different dashboard views */}
      <DashboardTabs />
      
      {/* Dashboard KPI cards */}
      <KPICards />
      
      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Charts and Tables */}
        <div className="lg:col-span-2">
          <ProjectTimeline />
          <SkillDistribution />
        </div>
        
        {/* Right column - Widgets and Stats */}
        <div className="lg:col-span-1">
          <RecruitmentNeeds />
          <UpcomingProjects />
          <RecentActivities />
        </div>
      </div>
    </AppLayout>
  );
}
