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
 * Universal Node System: Every item (note, task, project, person, event, idea) is a first-class node
 * Nodes can be linked to any other node via the relationships table
 */
export const nodes = mysqlTable("nodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Node type: task, note, project, person, event, idea, etc. */
  type: varchar("type", { length: 32 }).notNull().default("note"),
  /** Rich-text body content */
  body: text("body"),
  /** JSON-encoded properties: status, tags, priority, dueDate, etc. */
  properties: text("properties"),
  /** Comma-separated tags for quick filtering */
  tags: text("tags"),
  /** For tasks: status (inbox, next, someday, done) */
  status: varchar("status", { length: 32 }).default("inbox"),
  /** For time blocks: start time (ISO string) */
  startTime: varchar("startTime", { length: 64 }),
  /** For time blocks: end time (ISO string) */
  endTime: varchar("endTime", { length: 64 }),
  /** Canvas position: x coordinate (for graph layout) */
  canvasX: int("canvasX").default(0),
  /** Canvas position: y coordinate (for graph layout) */
  canvasY: int("canvasY").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Node = typeof nodes.$inferSelect;
export type InsertNode = typeof nodes.$inferInsert;

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

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