import { pgTable, text, serial, integer, boolean, timestamp, real, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Skill entities
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  name: true,
  category: true,
});

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

// Employee Skill Mapping
export const skillMappings = pgTable("skill_mappings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  experienceBand: text("experience_band").notNull(), // 0-2, 2-5.5, 5.5-7, 7-10, 10+
  rating: text("rating").notNull(), // Beginner, Intermediate, Expert
  yearsOfExperience: real("years_of_experience").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSkillMappingSchema = createInsertSchema(skillMappings).pick({
  employeeId: true,
  skillId: true,
  experienceBand: true,
  rating: true,
  yearsOfExperience: true,
});

export type InsertSkillMapping = z.infer<typeof insertSkillMappingSchema>;
export type SkillMapping = typeof skillMappings.$inferSelect;

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  code: true,
  description: true,
  startDate: true,
  endDate: true,
  createdBy: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project Requirements
export const projectRequirements = pgTable("project_requirements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  experienceBand: text("experience_band").notNull(),
  peopleNeeded: integer("people_needed").notNull(),
  hoursPerMonth: integer("hours_per_month").notNull(),
});

export const insertProjectRequirementSchema = createInsertSchema(projectRequirements).pick({
  projectId: true,
  skillId: true,
  experienceBand: true,
  peopleNeeded: true,
  hoursPerMonth: true,
});

export type InsertProjectRequirement = z.infer<typeof insertProjectRequirementSchema>;
export type ProjectRequirement = typeof projectRequirements.$inferSelect;

// Project Assignments
export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  experienceBand: text("experience_band").notNull(),
  assignedHoursPerMonth: integer("assigned_hours_per_month").notNull(),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).pick({
  projectId: true,
  employeeId: true,
  skillId: true,
  experienceBand: true,
  assignedHoursPerMonth: true,
  assignedBy: true,
});

export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;

// Timesheets
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: timestamp("date").notNull(),
  hours: real("hours").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheets).pick({
  employeeId: true,
  projectId: true,
  date: true,
  hours: true,
});

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;

// Project Pipeline
export const projectPipelines = pgTable("project_pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  expectedStartDate: timestamp("expected_start_date").notNull(),
  expectedEndDate: timestamp("expected_end_date").notNull(),
  status: text("status").notNull(), // Prospect, Negotiation, Won, Lost
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectPipelineSchema = createInsertSchema(projectPipelines).pick({
  name: true,
  expectedStartDate: true,
  expectedEndDate: true,
  status: true,
  createdBy: true,
});

export type InsertProjectPipeline = z.infer<typeof insertProjectPipelineSchema>;
export type ProjectPipeline = typeof projectPipelines.$inferSelect;

// Pipeline Skill Demand
export const pipelineSkillDemands = pgTable("pipeline_skill_demands", {
  id: serial("id").primaryKey(),
  pipelineId: integer("pipeline_id").notNull().references(() => projectPipelines.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  experienceBand: text("experience_band").notNull(),
  peopleNeeded: integer("people_needed").notNull(),
});

export const insertPipelineSkillDemandSchema = createInsertSchema(pipelineSkillDemands).pick({
  pipelineId: true,
  skillId: true,
  experienceBand: true,
  peopleNeeded: true,
});

export type InsertPipelineSkillDemand = z.infer<typeof insertPipelineSkillDemandSchema>;
export type PipelineSkillDemand = typeof pipelineSkillDemands.$inferSelect;

// Activities Log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // project_created, employee_joined, skill_updated, etc.
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  relatedId: integer("related_id"), // ID of related entity (project, skill, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  userId: true,
  relatedId: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Enums
export const experienceBands = ["0-2", "2-5", "5-7", "7-10", "10+"] as const;
export const ratings = ["Beginner", "Intermediate", "Expert"] as const;
export const userRoles = ["admin", "project_manager", "employee", "sales", "recruitment"] as const;
export const pipelineStatuses = ["Prospect", "Negotiation", "Won", "Lost"] as const;

// Extended schemas with validation
export const extendedInsertUserSchema = insertUserSchema.extend({
  role: z.enum(userRoles),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const extendedInsertSkillMappingSchema = insertSkillMappingSchema.extend({
  experienceBand: z.enum(experienceBands),
  rating: z.enum(ratings),
  yearsOfExperience: z.number().min(0).max(50),
});

export const extendedInsertTimesheetSchema = insertTimesheetSchema.extend({
  hours: z.number().min(0.5).max(8),
});

export const extendedInsertProjectPipelineSchema = insertProjectPipelineSchema.extend({
  status: z.enum(pipelineStatuses),
});
