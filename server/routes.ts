import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import { 
  insertSkillSchema, 
  insertSkillMappingSchema, 
  extendedInsertSkillMappingSchema,
  insertProjectSchema,
  insertProjectRequirementSchema,
  insertProjectAssignmentSchema,
  insertTimesheetSchema,
  extendedInsertTimesheetSchema,
  insertProjectPipelineSchema,
  extendedInsertProjectPipelineSchema,
  insertPipelineSkillDemandSchema,
  insertActivitySchema
} from "@shared/schema";

// Helper to format ZodError
const formatZodError = (error: ZodError) => {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
};

// Helper to check user roles
const checkRole = (role: string | string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Not authorized");
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // ==================== Skills API ====================
  // Get all skills
  app.get("/api/skills", async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });
  
  // Create new skill (admin only)
  app.post("/api/skills", checkRole("admin"), async (req, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      
      // Check if skill already exists
      const existingSkill = await storage.getSkillByName(skillData.name);
      if (existingSkill) {
        return res.status(400).json({ message: "Skill already exists" });
      }
      
      const skill = await storage.createSkill(skillData);
      
      // Log activity
      await storage.createActivity({
        type: "skill_created",
        description: `New skill created: ${skill.name}`,
        userId: req.user?.id,
        relatedId: skill.id
      });
      
      res.status(201).json(skill);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to create skill" });
    }
  });
  
  // Update skill (admin only)
  app.patch("/api/skills/:id", checkRole("admin"), async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      const updatedData = req.body;
      
      // Get the skill
      const skill = await storage.getSkill(skillId);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Update skill using the storage method
      const updatedSkill = await storage.updateSkill(skillId, updatedData);
      if (!updatedSkill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: "skill_updated",
        description: `Skill "${updatedSkill.name}" was updated`,
        userId: req.user?.id,
        relatedId: updatedSkill.id
      });
      
      res.status(200).json(updatedSkill);
    } catch (error) {
      res.status(500).json({ message: "Failed to update skill" });
    }
  });
  
  // Delete skill (admin only)
  app.delete("/api/skills/:id", checkRole("admin"), async (req, res) => {
    try {
      const skillId = parseInt(req.params.id);
      
      // Get the skill
      const skill = await storage.getSkill(skillId);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      
      // Check if skill is in use - don't delete if it is
      const skillMappings = await storage.getSkillMappingsBySkill(skillId);
      if (skillMappings && skillMappings.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete skill that's in use by employees. Remove all employee skill ratings first." 
        });
      }
      
      // Delete the skill directly using the storage method
      const deleted = await storage.deleteSkill(skillId);
      
      if (deleted) {
        // Log activity
        await storage.createActivity({
          type: "skill_deleted",
          description: `Skill "${skill.name}" was deleted`,
          userId: req.user?.id,
          relatedId: skillId
        });
        
        return res.status(200).json({ message: "Skill deleted successfully" });
      }
      
      res.status(404).json({ message: "Skill not found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // ==================== Skill Mappings API ====================
  // Get employee skill mappings
  app.get("/api/employees/:employeeId/skills", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      // Only allow users to see their own skills or admins/managers to see everyone's
      if (
        !req.isAuthenticated() || 
        (req.user.id !== employeeId && 
         !['admin', 'project_manager'].includes(req.user.role))
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const skillMappings = await storage.getSkillMappingsByEmployee(employeeId);
      
      // Fetch skill details for each mapping
      const mappingsWithDetails = await Promise.all(
        skillMappings.map(async (mapping) => {
          const skill = await storage.getSkill(mapping.skillId);
          return {
            ...mapping,
            skillName: skill?.name || "Unknown",
            skillCategory: skill?.category || "Unknown"
          };
        })
      );
      
      res.json(mappingsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill mappings" });
    }
  });
  
  // Create/update employee skill mapping
  app.post("/api/employees/:employeeId/skills", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      // Only allow users to update their own skills
      if (!req.isAuthenticated() || req.user.id !== employeeId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const skillData = extendedInsertSkillMappingSchema.parse({
        ...req.body,
        employeeId
      });
      
      // Check if skill exists
      const skill = await storage.getSkill(skillData.skillId);
      if (!skill) {
        return res.status(400).json({ message: "Skill not found" });
      }
      
      // Check if mapping already exists
      const existingMappings = await storage.getSkillMappingsByEmployee(employeeId);
      const existingMapping = existingMappings.find(
        m => m.skillId === skillData.skillId && m.experienceBand === skillData.experienceBand
      );
      
      let mapping;
      if (existingMapping) {
        // Update existing
        mapping = await storage.updateSkillMapping(existingMapping.id, skillData);
      } else {
        // Create new
        mapping = await storage.createSkillMapping(skillData);
      }
      
      // Log activity
      await storage.createActivity({
        type: "skill_mapping_updated",
        description: `Skill mapping updated for ${skill.name}`,
        userId: req.user.id,
        relatedId: mapping?.id
      });
      
      res.status(201).json(mapping);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to update skill mapping" });
    }
  });

  // ==================== Projects API ====================
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const projects = await storage.getAllProjects();
      
      // Enhance with requirement counts
      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          const requirements = await storage.getProjectRequirementsByProject(project.id);
          const assignments = await storage.getProjectAssignmentsByProject(project.id);
          
          return {
            ...project,
            requirementsCount: requirements.length,
            assignmentsCount: assignments.length,
            fulfillmentPercentage: requirements.length 
              ? Math.round((assignments.length / requirements.length) * 100) 
              : 0
          };
        })
      );
      
      res.json(projectsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  // Get single project with details
  app.get("/api/projects/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get requirements and assignments
      const requirements = await storage.getProjectRequirementsByProject(projectId);
      const assignments = await storage.getProjectAssignmentsByProject(projectId);
      
      // Get creator info
      const creator = await storage.getUser(project.createdBy);
      
      // Enhance with details
      const requirementsWithDetails = await Promise.all(
        requirements.map(async (req) => {
          const skill = await storage.getSkill(req.skillId);
          return {
            ...req,
            skillName: skill?.name || "Unknown"
          };
        })
      );
      
      const assignmentsWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const skill = await storage.getSkill(assignment.skillId);
          const employee = await storage.getUser(assignment.employeeId);
          return {
            ...assignment,
            skillName: skill?.name || "Unknown",
            employeeName: employee?.name || "Unknown"
          };
        })
      );
      
      res.json({
        ...project,
        createdByEmail: creator?.email || "Unknown",
        createdByName: creator?.name || "Admin",
        requirements: requirementsWithDetails,
        assignments: assignmentsWithDetails
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project details" });
    }
  });
  
  // Create new project (admin only)
  app.post("/api/projects", checkRole("admin"), async (req, res) => {
    try {
      // Explicitly convert date strings to Date objects before validation
      const rawData = req.body;
      const processedData = {
        ...rawData,
        startDate: rawData.startDate ? new Date(rawData.startDate) : new Date(),
        endDate: rawData.endDate ? new Date(rawData.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdBy: req.user.id
      };
      
      // Now parse with Zod
      const projectData = insertProjectSchema.parse(processedData);
      
      // Check if project code already exists
      const existingProject = await storage.getProjectByCode(projectData.code);
      if (existingProject) {
        return res.status(400).json({ message: "Project code already exists" });
      }
      
      const project = await storage.createProject(projectData);
      
      // Log activity
      await storage.createActivity({
        type: "project_created",
        description: `New project created: ${project.name}`,
        userId: req.user.id,
        relatedId: project.id
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  // Add project requirement
  app.post("/api/projects/:projectId/requirements", checkRole("admin"), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const requirementData = insertProjectRequirementSchema.parse({
        ...req.body,
        projectId
      });
      
      // Check if skill exists
      const skill = await storage.getSkill(requirementData.skillId);
      if (!skill) {
        return res.status(400).json({ message: "Skill not found" });
      }
      
      const requirement = await storage.createProjectRequirement(requirementData);
      
      // Log activity
      await storage.createActivity({
        type: "project_requirement_added",
        description: `Requirement added to ${project.name}: ${skill.name}`,
        userId: req.user.id,
        relatedId: project.id
      });
      
      res.status(201).json(requirement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to add project requirement" });
    }
  });
  
  // Assign employee to project
  app.post("/api/projects/:projectId/assignments", checkRole(["admin", "project_manager"]), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const assignmentData = insertProjectAssignmentSchema.parse({
        ...req.body,
        projectId,
        assignedBy: req.user.id
      });
      
      // Check if employee exists
      const employee = await storage.getUser(assignmentData.employeeId);
      if (!employee) {
        return res.status(400).json({ message: "Employee not found" });
      }
      
      // Check if skill exists
      const skill = await storage.getSkill(assignmentData.skillId);
      if (!skill) {
        return res.status(400).json({ message: "Skill not found" });
      }
      
      const assignment = await storage.createProjectAssignment(assignmentData);
      
      // Log activity
      await storage.createActivity({
        type: "employee_assigned",
        description: `${employee.name} assigned to ${project.name} for ${skill.name}`,
        userId: req.user.id,
        relatedId: project.id
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to assign employee to project" });
    }
  });

  // ==================== Timesheets API ====================
  // Get employee timesheets
  app.get("/api/employees/:employeeId/timesheets", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      
      // Only allow users to see their own timesheets or managers to see everyone's
      if (
        !req.isAuthenticated() || 
        (req.user.id !== employeeId && 
         !['admin', 'project_manager'].includes(req.user.role))
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const timesheets = await storage.getTimesheetsByEmployee(employeeId);
      
      // Enhance with project details
      const timesheetsWithDetails = await Promise.all(
        timesheets.map(async (timesheet) => {
          const project = await storage.getProject(timesheet.projectId);
          return {
            ...timesheet,
            projectName: project?.name || "Unknown",
            projectCode: project?.code || "Unknown"
          };
        })
      );
      
      res.json(timesheetsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timesheets" });
    }
  });
  
  // Create timesheet entry
  app.post("/api/timesheets", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const timesheetData = extendedInsertTimesheetSchema.parse({
        ...req.body,
        employeeId: req.user.id
      });
      
      // Validate project exists and user is assigned to it
      const project = await storage.getProject(timesheetData.projectId);
      if (!project) {
        return res.status(400).json({ message: "Project not found" });
      }
      
      const assignments = await storage.getProjectAssignmentsByEmployee(req.user.id);
      const isAssigned = assignments.some(a => a.projectId === timesheetData.projectId);
      
      if (!isAssigned) {
        return res.status(400).json({ message: "You are not assigned to this project" });
      }
      
      // Check daily 8-hour limit
      const date = new Date(timesheetData.date);
      const existingTimesheets = await storage.getTimesheetsByEmployeeAndDate(req.user.id, date);
      
      const totalHours = existingTimesheets.reduce((sum, t) => sum + t.hours, 0);
      if (totalHours + timesheetData.hours > 8) {
        return res.status(400).json({ 
          message: `Daily limit exceeded. You already have ${totalHours} hours logged for this date.`
        });
      }
      
      const timesheet = await storage.createTimesheet(timesheetData);
      
      res.status(201).json(timesheet);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to create timesheet entry" });
    }
  });

  // ==================== Sales Pipeline API ====================
  // Get all pipeline projects
  app.get("/api/pipeline", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const pipelines = await storage.getAllProjectPipelines();
      
      // Enhance with skill demand details
      const pipelinesWithDetails = await Promise.all(
        pipelines.map(async (pipeline) => {
          const demands = await storage.getPipelineSkillDemandsByPipeline(pipeline.id);
          
          // Get skill details for demands
          const demandsWithDetails = await Promise.all(
            demands.map(async (demand) => {
              const skill = await storage.getSkill(demand.skillId);
              return {
                ...demand,
                skillName: skill?.name || "Unknown"
              };
            })
          );
          
          return {
            ...pipeline,
            demands: demandsWithDetails
          };
        })
      );
      
      res.json(pipelinesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline projects" });
    }
  });
  
  // Create pipeline project (sales role only)
  app.post("/api/pipeline", checkRole(["admin", "sales"]), async (req, res) => {
    try {
      // Explicitly convert date strings to Date objects before validation
      const rawData = req.body;
      
      // Ensure proper date handling and validation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Parse dates with proper validation
      let startDate;
      if (rawData.expectedStartDate) {
        startDate = new Date(rawData.expectedStartDate);
        // Ensure start date is not in the past
        if (startDate < today) {
          return res.status(400).json({ message: "Start date cannot be in the past" });
        }
      } else {
        startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      }
      
      let endDate;
      if (rawData.expectedEndDate) {
        endDate = new Date(rawData.expectedEndDate);
        // Ensure end date is after start date
        if (endDate < startDate) {
          return res.status(400).json({ message: "End date must be after start date" });
        }
      } else {
        endDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); // 120 days from now
      }
      
      const processedData = {
        ...rawData,
        expectedStartDate: startDate,
        expectedEndDate: endDate,
        createdBy: req.user.id
      };
      
      // Now parse with Zod
      const pipelineData = extendedInsertProjectPipelineSchema.parse(processedData);
      
      const pipeline = await storage.createProjectPipeline(pipelineData);
      
      // Log activity
      await storage.createActivity({
        type: "pipeline_created",
        description: `New pipeline project created: ${pipeline.name}`,
        userId: req.user.id,
        relatedId: pipeline.id
      });
      
      res.status(201).json(pipeline);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to create pipeline project" });
    }
  });
  
  // Add skill demand to pipeline
  app.post("/api/pipeline/:pipelineId/skills", checkRole(["admin", "sales"]), async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.pipelineId);
      
      // Check if pipeline exists
      const pipeline = await storage.getProjectPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline project not found" });
      }
      
      const demandData = insertPipelineSkillDemandSchema.parse({
        ...req.body,
        pipelineId
      });
      
      // Check if skill exists
      const skill = await storage.getSkill(demandData.skillId);
      if (!skill) {
        return res.status(400).json({ message: "Skill not found" });
      }
      
      const demand = await storage.createPipelineSkillDemand(demandData);
      
      // Log activity
      await storage.createActivity({
        type: "pipeline_skill_added",
        description: `Skill demand added to ${pipeline.name}: ${skill.name}`,
        userId: req.user.id,
        relatedId: pipeline.id
      });
      
      res.status(201).json(demand);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      res.status(500).json({ message: "Failed to add skill demand" });
    }
  });

  // ==================== Dashboard API ====================
  // Get dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });
  
  // Get skill distribution
  app.get("/api/dashboard/skill-distribution", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const distribution = await storage.getSkillDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill distribution" });
    }
  });
  
  // Get recruitment needs
  app.get("/api/dashboard/recruitment-needs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const needs = await storage.getRecruitmentNeeds();
      res.json(needs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recruitment needs" });
    }
  });
  
  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getAllActivities(limit);
      
      // Enhance with user details
      const activitiesWithDetails = await Promise.all(
        activities.map(async (activity) => {
          let user = null;
          if (activity.userId) {
            user = await storage.getUser(activity.userId);
          }
          
          return {
            ...activity,
            userName: user ? user.name : "System"
          };
        })
      );
      
      res.json(activitiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ==================== User Management API ====================
  // Get all users (admin only)
  app.get("/api/users", checkRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove password from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ==================== Skill Categories API ====================
  // List of predefined skill categories
  const skillCategories = [
    { id: 1, name: "Frontend" },
    { id: 2, name: "Backend" },
    { id: 3, name: "DevOps" },
    { id: 4, name: "Database" },
    { id: 5, name: "Mobile" },
    { id: 6, name: "Design" },
    { id: 7, name: "AI/ML" },
    { id: 8, name: "Testing" }
  ];
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      res.json(skillCategories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Create new category (admin only)
  app.post("/api/categories", checkRole("admin"), async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.length < 2) {
        return res.status(400).json({ message: "Category name must be at least 2 characters" });
      }
      
      // Check if category already exists
      const existingCategory = skillCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }
      
      // Generate new ID
      const newId = Math.max(...skillCategories.map(c => c.id), 0) + 1;
      
      // Add new category
      const newCategory = { id: newId, name };
      skillCategories.push(newCategory);
      
      // Log activity
      await storage.createActivity({
        type: "category_created",
        description: `New skill category created: ${name}`,
        userId: req.user?.id,
        relatedId: newId
      });
      
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Update category (admin only)
  app.patch("/api/categories/:id", checkRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.length < 2) {
        return res.status(400).json({ message: "Category name must be at least 2 characters" });
      }
      
      // Find category
      const categoryIndex = skillCategories.findIndex(c => c.id === id);
      if (categoryIndex === -1) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if new name already exists
      const existingWithName = skillCategories.find(c => 
        c.id !== id && c.name.toLowerCase() === name.toLowerCase()
      );
      if (existingWithName) {
        return res.status(400).json({ message: "Category name already taken" });
      }
      
      // Update category
      const oldName = skillCategories[categoryIndex].name;
      skillCategories[categoryIndex].name = name;
      
      // Log activity
      await storage.createActivity({
        type: "category_updated",
        description: `Skill category renamed from "${oldName}" to "${name}"`,
        userId: req.user?.id,
        relatedId: id
      });
      
      res.json(skillCategories[categoryIndex]);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // Delete category (admin only)
  app.delete("/api/categories/:id", checkRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Find category
      const categoryIndex = skillCategories.findIndex(c => c.id === id);
      if (categoryIndex === -1) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if category is in use
      const skills = await storage.getAllSkills();
      const categoryInUse = skills.some(skill => skill.category === skillCategories[categoryIndex].name);
      
      if (categoryInUse) {
        return res.status(400).json({ message: "Cannot delete category that's in use by skills" });
      }
      
      // Remove category
      const removedCategory = skillCategories.splice(categoryIndex, 1)[0];
      
      // Log activity
      await storage.createActivity({
        type: "category_deleted",
        description: `Skill category deleted: ${removedCategory.name}`,
        userId: req.user?.id,
        relatedId: id
      });
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Create HTTP server for the Express app
  const httpServer = createServer(app);

  return httpServer;
}
