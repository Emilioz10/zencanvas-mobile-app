import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Life Domains: Categories for organizing life aspects
 * Examples: health, relationships, finance, work, personal_growth, education, hobbies
 */
export const lifeDomains = mysqlTable("lifeDomains", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  icon: varchar("icon", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LifeDomain = typeof lifeDomains.$inferSelect;
export type InsertLifeDomain = typeof lifeDomains.$inferInsert;

/**
 * Universal Node System: Every item (note, task, project, person, event, idea) is a first-class node
 * Nodes can be linked to any other node via the relationships table
 */
export const nodes = mysqlTable("nodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Node type: task, note, project, person, event, idea, life_skill, etc. */
  type: varchar("type", { length: 32 }).notNull().default("note"),
  /** Rich-text body content (supports Markdown) */
  body: text("body"),
  /** JSON-encoded properties: status, tags, priority, dueDate, etc. */
  properties: text("properties"),
  /** Comma-separated tags for quick filtering */
  tags: text("tags"),
  /** For tasks: status (inbox, next, someday, done, blocked, in_progress) */
  status: varchar("status", { length: 32 }).default("inbox"),
  /** For time blocks: start time (ISO string) */
  startTime: varchar("startTime", { length: 64 }),
  /** For time blocks: end time (ISO string) */
  endTime: varchar("endTime", { length: 64 }),
  /** Canvas position: x coordinate */
  canvasX: int("canvasX").default(0),
  /** Canvas position: y coordinate */
  canvasY: int("canvasY").default(0),
  /** Canvas card width in pixels */
  canvasWidth: int("canvasWidth").default(220),
  /** Canvas card height in pixels (0 = auto) */
  canvasHeight: int("canvasHeight").default(0),
  /** Card background color (hex) */
  cardColor: varchar("cardColor", { length: 16 }),
  /** Attached file URL (image, PDF, doc) */
  attachmentUrl: text("attachmentUrl"),
  /** Attached file type: image, pdf, doc, other */
  attachmentType: varchar("attachmentType", { length: 32 }),
  /** Attached file name for display */
  attachmentName: varchar("attachmentName", { length: 255 }),
  /** Language: en or he (for RTL support) */
  language: varchar("language", { length: 8 }).default("en"),
  /** JSON Canvas node type: text | file | link | group | flashcard */
  canvasNodeType: varchar("canvasNodeType", { length: 32 }).default("text"),
  /** For link nodes: the URL */
  canvasUrl: text("canvasUrl"),
  /** For group nodes: display label */
  canvasLabel: varchar("canvasLabel", { length: 255 }),
  /** For group nodes: background image URL */
  canvasBackground: text("canvasBackground"),
  /** For group nodes: background style (cover|ratio|repeat) */
  canvasBackgroundStyle: varchar("canvasBackgroundStyle", { length: 16 }),
  /** For flashcard nodes: the answer/back side */
  flashcardBack: text("flashcardBack"),
  /** Canvas color: hex or preset 1-6 */
  canvasColor: varchar("canvasColor", { length: 16 }),
  /** z-index order on canvas */
  canvasZIndex: int("canvasZIndex").default(0),
  /** Module type: task | project | contact | finance | file | bookmark | note | list */
  moduleType: varchar("moduleType", { length: 32 }),
  /** JSON-encoded structured template fields (per module type) */
  templateData: text("templateData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Node = typeof nodes.$inferSelect;
export type InsertNode = typeof nodes.$inferInsert;

/**
 * Enhanced Node Metadata: Store additional properties as JSON
 * Includes: color, domain links, limitations, support needs, etc.
 */
export const nodeMetadata = mysqlTable("nodeMetadata", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: int("nodeId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  /** Color for visual identification (hex or pastel name) */
  color: varchar("color", { length: 32 }).default("#f3f4f6"),
  /** Link to life domain */
  lifeDomainId: int("lifeDomainId").references(() => lifeDomains.id),
  /** For people nodes: relationship type (friend, family, mentor, support, etc.) */
  relationshipType: varchar("relationshipType", { length: 64 }),
  /** For tasks: estimated effort (easy, medium, hard) */
  effort: varchar("effort", { length: 32 }),
  /** For tasks: priority (low, medium, high, critical) */
  priority: varchar("priority", { length: 32 }).default("medium"),
  /** For life-situation tasks: limitations or challenges */
  limitations: text("limitations"),
  /** Support needed: financial, emotional, medical, educational, etc. */
  supportNeeded: text("supportNeeded"),
  /** Custom JSON for extensibility */
  customData: text("customData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NodeMetadata = typeof nodeMetadata.$inferSelect;
export type InsertNodeMetadata = typeof nodeMetadata.$inferInsert;

/**
 * Bi-directional Relationships: Typed links between any two nodes
 * Each relationship has a type (depends_on, owns, references, related_to, etc.)
 */
export const relationships = mysqlTable("relationships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Source node ID */
  fromNodeId: int("fromNodeId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  /** Target node ID */
  toNodeId: int("toNodeId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  /** Relationship type: depends_on, owns, references, related_to, blocked_by, etc. */
  type: varchar("type", { length: 64 }).notNull().default("related_to"),
  /** Optional label for the relationship (displayed on graph edge) */
  label: varchar("label", { length: 255 }),
  /** Edge color: hex or preset 1-6 */
  edgeColor: varchar("edgeColor", { length: 16 }),
  /** Side the edge starts from: top|right|bottom|left */
  fromSide: varchar("fromSide", { length: 8 }),
  /** Side the edge ends at: top|right|bottom|left */
  toSide: varchar("toSide", { length: 8 }),
  /** Arrow shape at start: none|arrow */
  fromEnd: varchar("fromEnd", { length: 8 }).default("none"),
  /** Arrow shape at end: none|arrow */
  toEnd: varchar("toEnd", { length: 8 }).default("arrow"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

/**
 * Task Dependencies: Links between tasks showing dependencies
 * Example: "Task B depends on Task A" means A must be done before B
 */
export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Task that depends on another */
  dependentTaskId: int("dependentTaskId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  /** Task that must be completed first */
  dependsOnTaskId: int("dependsOnTaskId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  /** Type: blocks, required_before, related_to */
  type: varchar("type", { length: 32 }).default("required_before"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Life Skills Guides: Instructions for daily life tasks
 * Example: How to wash dishes, fold clothes, manage anxiety
 */
export const lifeSkillsGuides = mysqlTable("lifeSkillsGuides", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Reference to the task this guide is for */
  taskId: int("taskId").references(() => nodes.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  /** JSON array of steps with text, images, and GIFs */
  steps: text("steps"),
  /** Difficulty level: easy, medium, hard */
  difficulty: varchar("difficulty", { length: 32 }).default("medium"),
  /** Estimated time in minutes */
  estimatedTime: int("estimatedTime"),
  /** JSON array of media URLs (images, GIFs) */
  mediaUrls: text("mediaUrls"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LifeSkillsGuide = typeof lifeSkillsGuides.$inferSelect;
export type InsertLifeSkillsGuide = typeof lifeSkillsGuides.$inferInsert;

/**
 * Suggested Relationships: AI-generated suggestions for missing connections
 * User can accept/reject suggestions to create actual relationships
 */
export const suggestedRelationships = mysqlTable("suggestedRelationships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fromNodeId: int("fromNodeId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  toNodeId: int("toNodeId").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }),
  /** AI confidence score (0-1) */
  confidence: int("confidence").notNull().default(0),
  /** Reason why AI suggested this link */
  reason: text("reason"),
  /** Status: pending, accepted, rejected */
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuggestedRelationship = typeof suggestedRelationships.$inferSelect;
export type InsertSuggestedRelationship = typeof suggestedRelationships.$inferInsert;

/**
 * Daily Life Logs: Quick-entry tracking for daily life events
 * Topics: dog (פיצ'), baby (רני), health (בריאות), money (כסף), task (משימה), relationship (אלי)
 * Based on NarraBaby + Everyday Tasks patterns
 */
export const dailyLogs = mysqlTable("dailyLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Topic/category: dog | baby | health | money | task | relationship | other */
  topic: varchar("topic", { length: 32 }).notNull(),
  /** Event type within topic: e.g. feeding | walk | medication | sleep | diaper | note */
  eventType: varchar("eventType", { length: 64 }).notNull().default("note"),
  /** Numeric value (e.g. ml for feeding, minutes for walk) */
  value: varchar("value", { length: 64 }),
  /** Unit for the value (ml, g, min, ₪, etc.) */
  unit: varchar("unit", { length: 16 }),
  /** Free text notes */
  notes: text("notes"),
  /** When the event happened (defaults to now) */
  eventAt: timestamp("eventAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = typeof dailyLogs.$inferInsert;

/**
 * People: Tracked individuals in the user's life
 * FRM (Friends/Family/Contacts Relationship Management)
 * Each person has a relationship type, color, and emoji avatar
 */
export const people = mysqlTable("people", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Display name */
  name: varchar("name", { length: 128 }).notNull(),
  /** Emoji or initials for avatar */
  avatar: varchar("avatar", { length: 8 }).default("👤"),
  /** Card color (hex) */
  color: varchar("color", { length: 16 }).default("#6366f1"),
  /** Relationship type: family | partner | friend | doctor | official | work | other */
  relationshipType: varchar("relationshipType", { length: 32 }).default("other"),
  /** Phone number */
  phone: varchar("phone", { length: 32 }),
  /** Notes about this person */
  notes: text("notes"),
  /** Target contact frequency in days (0 = no target) */
  contactFrequencyDays: int("contactFrequencyDays").default(0),
  /** Is this person active/visible */
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Person = typeof people.$inferSelect;
export type InsertPerson = typeof people.$inferInsert;

/**
 * Interactions: Every logged contact/event with a person
 * Tap-to-log: no free text required — just type + quality score
 */
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  personId: int("personId").notNull().references(() => people.id, { onDelete: "cascade" }),
  /**
   * Interaction type:
   * talk | message | meeting | argument | good_moment | appointment | payment | task_done | task_pending
   */
  type: varchar("type", { length: 32 }).notNull().default("talk"),
  /** Quality score 1-5 (1=very bad, 3=neutral, 5=very good) */
  score: int("score").default(3),
  /** Optional short note (not required) */
  note: varchar("note", { length: 255 }),
  /** Duration in minutes (optional) */
  durationMinutes: int("durationMinutes"),
  /** When the interaction happened */
  happenedAt: timestamp("happenedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Entities: Ontological objects — the real knowledge graph nodes
 * Each entity has a type, name, properties (JSON), and Markdown body
 * Types: person | document | task | project | medication | money | place | event | concept | tool
 */
export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Entity type — determines which properties are shown */
  entityType: varchar("entityType", { length: 64 }).notNull().default("concept"),
  /** Display name — the primary label */
  name: varchar("name", { length: 255 }).notNull(),
  /** Emoji icon for visual identification */
  icon: varchar("icon", { length: 8 }).default("📌"),
  /** Card color (hex) for visual differentiation */
  color: varchar("color", { length: 16 }).default("#6366f1"),
  /** Markdown body — rendered with HebMd, supports GFM + callouts + wikilinks */
  body: text("body"),
  /** JSON object of typed properties per entity type */
  properties: text("properties"),
  /** Status: active | archived | draft */
  status: varchar("status", { length: 32 }).default("active"),
  /** Tags: comma-separated */
  tags: text("tags"),
  /** Life domain: health | money | family | work | admin | self */
  domain: varchar("domain", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;

/**
 * Entity Links: Typed bi-directional relationships between entities
 * link types: related | depends_on | blocks | part_of | references | caused_by | resolves | owns
 */
export const entityLinks = mysqlTable("entityLinks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fromEntityId: int("fromEntityId").notNull().references(() => entities.id, { onDelete: "cascade" }),
  toEntityId: int("toEntityId").notNull().references(() => entities.id, { onDelete: "cascade" }),
  /** Link type — semantic relationship */
  linkType: varchar("linkType", { length: 64 }).notNull().default("related"),
  /** Optional short label shown on the connection */
  label: varchar("label", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityLink = typeof entityLinks.$inferSelect;
export type InsertEntityLink = typeof entityLinks.$inferInsert;
