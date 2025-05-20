import { users, type User, type InsertUser } from "@shared/schema";
import { skills, type Skill, type InsertSkill } from "@shared/schema";
import { skillMappings, type SkillMapping, type InsertSkillMapping } from "@shared/schema";
import { projects, type Project, type InsertProject } from "@shared/schema";
import { projectRequirements, type ProjectRequirement, type InsertProjectRequirement } from "@shared/schema";
import { projectAssignments, type ProjectAssignment, type InsertProjectAssignment } from "@shared/schema";
import { timesheets, type Timesheet, type InsertTimesheet } from "@shared/schema";
import { projectPipelines, type ProjectPipeline, type InsertProjectPipeline } from "@shared/schema";
import { pipelineSkillDemands, type PipelineSkillDemand, type InsertPipelineSkillDemand } from "@shared/schema";
import { activities, type Activity, type InsertActivity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Skills management
  getSkill(id: number): Promise<Skill | undefined>;
  getSkillByName(name: string): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, updateData: Partial<Skill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;
  getAllSkills(): Promise<Skill[]>;
  
  // Skill mappings
  getSkillMapping(id: number): Promise<SkillMapping | undefined>;
  getSkillMappingsByEmployee(employeeId: number): Promise<SkillMapping[]>;
  getSkillMappingsBySkill(skillId: number): Promise<SkillMapping[]>;
  createSkillMapping(mapping: InsertSkillMapping): Promise<SkillMapping>;
  updateSkillMapping(id: number, mapping: Partial<InsertSkillMapping>): Promise<SkillMapping | undefined>;
  
  // Projects management
  getProject(id: number): Promise<Project | undefined>;
  getProjectByCode(code: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  getAllProjects(): Promise<Project[]>;
  
  // Project requirements
  getProjectRequirement(id: number): Promise<ProjectRequirement | undefined>;
  getProjectRequirementsByProject(projectId: number): Promise<ProjectRequirement[]>;
  createProjectRequirement(requirement: InsertProjectRequirement): Promise<ProjectRequirement>;
  
  // Project assignments
  getProjectAssignment(id: number): Promise<ProjectAssignment | undefined>;
  getProjectAssignmentsByProject(projectId: number): Promise<ProjectAssignment[]>;
  getProjectAssignmentsByEmployee(employeeId: number): Promise<ProjectAssignment[]>;
  createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  
  // Timesheets
  getTimesheet(id: number): Promise<Timesheet | undefined>;
  getTimesheetsByEmployee(employeeId: number): Promise<Timesheet[]>;
  getTimesheetsByEmployeeAndDate(employeeId: number, date: Date): Promise<Timesheet[]>;
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  
  // Project pipeline
  getProjectPipeline(id: number): Promise<ProjectPipeline | undefined>;
  getAllProjectPipelines(): Promise<ProjectPipeline[]>;
  createProjectPipeline(pipeline: InsertProjectPipeline): Promise<ProjectPipeline>;
  
  // Pipeline skill demands
  getPipelineSkillDemand(id: number): Promise<PipelineSkillDemand | undefined>;
  getPipelineSkillDemandsByPipeline(pipelineId: number): Promise<PipelineSkillDemand[]>;
  createPipelineSkillDemand(demand: InsertPipelineSkillDemand): Promise<PipelineSkillDemand>;
  
  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashbaord metrics
  getDashboardMetrics(): Promise<{
    activeProjects: number;
    benchEmployees: number;
    pipelineProjects: number;
    skillGaps: number;
  }>;
  
  // Skills distribution
  getSkillDistribution(): Promise<any[]>;
  
  // Recruitment needs
  getRecruitmentNeeds(): Promise<any[]>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private skills: Map<number, Skill>;
  private skillMappings: Map<number, SkillMapping>;
  private projects: Map<number, Project>;
  private projectRequirements: Map<number, ProjectRequirement>;
  private projectAssignments: Map<number, ProjectAssignment>;
  private timesheets: Map<number, Timesheet>;
  private projectPipelines: Map<number, ProjectPipeline>;
  private pipelineSkillDemands: Map<number, PipelineSkillDemand>;
  private activities: Map<number, Activity>;
  
  private userIdCounter: number;
  private skillIdCounter: number;
  private skillMappingIdCounter: number;
  private projectIdCounter: number;
  private projectRequirementIdCounter: number;
  private projectAssignmentIdCounter: number;
  private timesheetIdCounter: number;
  private projectPipelineIdCounter: number;
  private pipelineSkillDemandIdCounter: number;
  private activityIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.skills = new Map();
    this.skillMappings = new Map();
    this.projects = new Map();
    this.projectRequirements = new Map();
    this.projectAssignments = new Map();
    this.timesheets = new Map();
    this.projectPipelines = new Map();
    this.pipelineSkillDemands = new Map();
    this.activities = new Map();
    
    this.userIdCounter = 1;
    this.skillIdCounter = 1;
    this.skillMappingIdCounter = 1;
    this.projectIdCounter = 1;
    this.projectRequirementIdCounter = 1;
    this.projectAssignmentIdCounter = 1;
    this.timesheetIdCounter = 1;
    this.projectPipelineIdCounter = 1;
    this.pipelineSkillDemandIdCounter = 1;
    this.activityIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed some initial data for development
    this.seedInitialData();
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Skills
  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }
  
  async getSkillByName(name: string): Promise<Skill | undefined> {
    return Array.from(this.skills.values()).find(skill => skill.name === name);
  }
  
  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = this.skillIdCounter++;
    const skill: Skill = { ...insertSkill, id };
    this.skills.set(id, skill);
    return skill;
  }
  
  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }
  
  // Delete a skill by ID
  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }
  
  // Update a skill by ID
  async updateSkill(id: number, updateData: Partial<Skill>): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;
    
    const updatedSkill = { ...skill, ...updateData };
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }
  
  // Skill mappings
  async getSkillMapping(id: number): Promise<SkillMapping | undefined> {
    return this.skillMappings.get(id);
  }
  
  async getSkillMappingsByEmployee(employeeId: number): Promise<SkillMapping[]> {
    return Array.from(this.skillMappings.values()).filter(
      mapping => mapping.employeeId === employeeId
    );
  }
  
  async getSkillMappingsBySkill(skillId: number): Promise<SkillMapping[]> {
    return Array.from(this.skillMappings.values()).filter(
      mapping => mapping.skillId === skillId
    );
  }
  
  async createSkillMapping(insertMapping: InsertSkillMapping): Promise<SkillMapping> {
    const id = this.skillMappingIdCounter++;
    const now = new Date();
    const mapping: SkillMapping = { 
      ...insertMapping, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.skillMappings.set(id, mapping);
    return mapping;
  }
  
  async updateSkillMapping(id: number, partialMapping: Partial<InsertSkillMapping>): Promise<SkillMapping | undefined> {
    const mapping = this.skillMappings.get(id);
    if (!mapping) return undefined;
    
    const updatedMapping: SkillMapping = {
      ...mapping,
      ...partialMapping,
      updatedAt: new Date()
    };
    this.skillMappings.set(id, updatedMapping);
    return updatedMapping;
  }
  
  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectByCode(code: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(project => project.code === code);
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { 
      ...insertProject, 
      id,
      createdAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  // Project requirements
  async getProjectRequirement(id: number): Promise<ProjectRequirement | undefined> {
    return this.projectRequirements.get(id);
  }
  
  async getProjectRequirementsByProject(projectId: number): Promise<ProjectRequirement[]> {
    return Array.from(this.projectRequirements.values()).filter(
      req => req.projectId === projectId
    );
  }
  
  async createProjectRequirement(insertRequirement: InsertProjectRequirement): Promise<ProjectRequirement> {
    const id = this.projectRequirementIdCounter++;
    const requirement: ProjectRequirement = { ...insertRequirement, id };
    this.projectRequirements.set(id, requirement);
    return requirement;
  }
  
  // Project assignments
  async getProjectAssignment(id: number): Promise<ProjectAssignment | undefined> {
    return this.projectAssignments.get(id);
  }
  
  async getProjectAssignmentsByProject(projectId: number): Promise<ProjectAssignment[]> {
    return Array.from(this.projectAssignments.values()).filter(
      assignment => assignment.projectId === projectId
    );
  }
  
  async getProjectAssignmentsByEmployee(employeeId: number): Promise<ProjectAssignment[]> {
    return Array.from(this.projectAssignments.values()).filter(
      assignment => assignment.employeeId === employeeId
    );
  }
  
  async createProjectAssignment(insertAssignment: InsertProjectAssignment): Promise<ProjectAssignment> {
    const id = this.projectAssignmentIdCounter++;
    const assignment: ProjectAssignment = { 
      ...insertAssignment, 
      id,
      assignedAt: new Date()
    };
    this.projectAssignments.set(id, assignment);
    return assignment;
  }
  
  // Timesheets
  async getTimesheet(id: number): Promise<Timesheet | undefined> {
    return this.timesheets.get(id);
  }
  
  async getTimesheetsByEmployee(employeeId: number): Promise<Timesheet[]> {
    return Array.from(this.timesheets.values()).filter(
      timesheet => timesheet.employeeId === employeeId
    );
  }
  
  async getTimesheetsByEmployeeAndDate(employeeId: number, date: Date): Promise<Timesheet[]> {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.timesheets.values()).filter(timesheet => {
      const timesheetDate = new Date(timesheet.date);
      timesheetDate.setHours(0, 0, 0, 0);
      return timesheet.employeeId === employeeId && 
             timesheetDate.getTime() === formattedDate.getTime();
    });
  }
  
  async createTimesheet(insertTimesheet: InsertTimesheet): Promise<Timesheet> {
    const id = this.timesheetIdCounter++;
    const timesheet: Timesheet = { 
      ...insertTimesheet, 
      id,
      createdAt: new Date()
    };
    this.timesheets.set(id, timesheet);
    return timesheet;
  }
  
  // Project pipeline
  async getProjectPipeline(id: number): Promise<ProjectPipeline | undefined> {
    return this.projectPipelines.get(id);
  }
  
  async getAllProjectPipelines(): Promise<ProjectPipeline[]> {
    return Array.from(this.projectPipelines.values());
  }
  
  async createProjectPipeline(insertPipeline: InsertProjectPipeline): Promise<ProjectPipeline> {
    const id = this.projectPipelineIdCounter++;
    const pipeline: ProjectPipeline = { 
      ...insertPipeline, 
      id,
      createdAt: new Date()
    };
    this.projectPipelines.set(id, pipeline);
    return pipeline;
  }
  
  // Pipeline skill demands
  async getPipelineSkillDemand(id: number): Promise<PipelineSkillDemand | undefined> {
    return this.pipelineSkillDemands.get(id);
  }
  
  async getPipelineSkillDemandsByPipeline(pipelineId: number): Promise<PipelineSkillDemand[]> {
    return Array.from(this.pipelineSkillDemands.values()).filter(
      demand => demand.pipelineId === pipelineId
    );
  }
  
  async createPipelineSkillDemand(insertDemand: InsertPipelineSkillDemand): Promise<PipelineSkillDemand> {
    const id = this.pipelineSkillDemandIdCounter++;
    const demand: PipelineSkillDemand = { ...insertDemand, id };
    this.pipelineSkillDemands.set(id, demand);
    return demand;
  }
  
  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async getAllActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Dashboard metrics
  async getDashboardMetrics(): Promise<{ activeProjects: number; benchEmployees: number; pipelineProjects: number; skillGaps: number; }> {
    const now = new Date();
    
    // Count active projects (projects that haven't ended yet)
    const activeProjects = Array.from(this.projects.values()).filter(
      project => new Date(project.endDate) >= now
    ).length;
    
    // Count employees on bench (not assigned to any active project)
    const assignedEmployeeIds = new Set(
      Array.from(this.projectAssignments.values()).map(assignment => assignment.employeeId)
    );
    const employeeIds = new Set(
      Array.from(this.users.values())
        .filter(user => user.role === 'employee')
        .map(user => user.id)
    );
    const benchEmployees = employeeIds.size - assignedEmployeeIds.size;
    
    // Count pipeline projects with status Prospect or Negotiation
    const pipelineProjects = Array.from(this.projectPipelines.values()).filter(
      pipeline => ['Prospect', 'Negotiation'].includes(pipeline.status)
    ).length;
    
    // Determine skill gaps (this is more complex in real world)
    // Here we're just counting skills where demand > supply for 10+ years experience
    const skillGaps = 5; // Simplified implementation
    
    return {
      activeProjects,
      benchEmployees,
      pipelineProjects,
      skillGaps
    };
  }
  
  // Skills distribution
  async getSkillDistribution(): Promise<any[]> {
    const skillDistribution: any[] = [];
    
    // Get all skills
    const allSkills = await this.getAllSkills();
    
    // For each skill, count employees by experience band and rating level
    for (const skill of allSkills) {
      const mappings = Array.from(this.skillMappings.values()).filter(
        mapping => mapping.skillId === skill.id
      );
      
      // Count by experience band
      const bands = {
        "0-2": mappings.filter(m => m.experienceBand === "0-2").length,
        "2-5": mappings.filter(m => m.experienceBand === "2-5").length,
        "5-7": mappings.filter(m => m.experienceBand === "5-7").length,
        "7-10": mappings.filter(m => m.experienceBand === "7-10").length,
        "10+": mappings.filter(m => m.experienceBand === "10+").length,
      };
      
      // Count by rating for organizational overview
      const beginner = mappings.filter(m => m.rating === "Beginner").length;
      const intermediate = mappings.filter(m => m.rating === "Intermediate").length;
      const expert = mappings.filter(m => m.rating === "Expert").length;
      
      const distribution = {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        bands,
        beginner,
        intermediate,
        expert,
        total: mappings.length
      };
      
      skillDistribution.push(distribution);
    }
    
    return skillDistribution;
  }
  
  // Recruitment needs
  async getRecruitmentNeeds(): Promise<any[]> {
    // This would be a more complex calculation in a real system
    // For now, returning sample data
    return [
      {
        skillId: 5,
        skillName: "DevOps",
        experienceBand: "7-10",
        needed: 4,
        available: 1,
        fulfillmentPercentage: 25,
        priority: "high"
      },
      {
        skillId: 3,
        skillName: "AWS",
        experienceBand: "10+",
        needed: 3,
        available: 2,
        fulfillmentPercentage: 66,
        priority: "medium"
      },
      {
        skillId: 1,
        skillName: "React.js",
        experienceBand: "5.5-7",
        needed: 5,
        available: 4,
        fulfillmentPercentage: 80,
        priority: "low"
      }
    ];
  }
  
  // Seed initial data for development
  private async seedInitialData() {
    // Add common skills
    const skillsData: InsertSkill[] = [
      { name: "React.js", category: "Frontend" },
      { name: "Node.js", category: "Backend" },
      { name: "AWS", category: "Cloud" },
      { name: "Python", category: "Backend" },
      { name: "DevOps", category: "Infrastructure" }
    ];
    
    for (const skill of skillsData) {
      await this.createSkill(skill);
    }
    
    // Add sample upcoming projects
    const upcomingProjects = [
      {
        name: "Cloud Migration",
        code: "CLDM-2023",
        skills: ["AWS", "DevOps"]
      },
      {
        name: "FinTech Mobile App",
        code: "FNAP-2023",
        skills: ["React.js", "Node.js"]
      }
    ];
    
    // Add sample activities
    const activities: InsertActivity[] = [
      {
        type: "project_created",
        description: "New Project Created: E-commerce Platform",
        userId: null,
        relatedId: null
      },
      {
        type: "employee_joined",
        description: "New Employee Joined: Priya Sharma",
        userId: null,
        relatedId: null
      },
      {
        type: "skill_updated",
        description: "Skills Updated: 14 employees updated their skills",
        userId: null,
        relatedId: null
      },
      {
        type: "pipeline_updated",
        description: "Pipeline Updated: Healthcare Project added to pipeline",
        userId: null,
        relatedId: null
      }
    ];
    
    for (const activity of activities) {
      await this.createActivity(activity);
    }
  }
}

export const storage = new MemStorage();
