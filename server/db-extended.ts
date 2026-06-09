import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { lifeDomains, nodeMetadata, taskDependencies, lifeSkillsGuides } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Life Domains
export async function createLifeDomain(userId: number, name: string, description?: string, color?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(lifeDomains).values({
    userId,
    name,
    description,
    color: color || "#6366f1",
  });

  return result;
}

export async function getLifeDomains(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(lifeDomains).where(eq(lifeDomains.userId, userId));
}

// Node Metadata
export async function getNodeMetadata(nodeId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(nodeMetadata).where(eq(nodeMetadata.nodeId, nodeId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateNodeMetadata(nodeId: number, data: {
  color?: string;
  lifeDomainId?: number | null;
  relationshipType?: string;
  effort?: string;
  priority?: string;
  limitations?: string;
  supportNeeded?: string;
  customData?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getNodeMetadata(nodeId);

  if (existing) {
    await db.update(nodeMetadata).set(data).where(eq(nodeMetadata.nodeId, nodeId));
  } else {
    await db.insert(nodeMetadata).values({
      nodeId,
      ...data,
    });
  }
}

// Task Dependencies
export async function createTaskDependency(
  userId: number,
  dependentTaskId: number,
  dependsOnTaskId: number,
  type: string = "required_before"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(taskDependencies).values({
    userId,
    dependentTaskId,
    dependsOnTaskId,
    type,
  });
}

export async function getTaskDependencies(nodeId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.dependentTaskId, nodeId));
}

export async function deleteTaskDependency(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(taskDependencies).where(eq(taskDependencies.id, id));
}

// Life Skills Guides
export async function createLifeSkillsGuide(
  userId: number,
  taskId: number | null,
  title: string,
  description?: string,
  steps?: string,
  difficulty?: string,
  estimatedTime?: number,
  mediaUrls?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(lifeSkillsGuides).values({
    userId,
    taskId,
    title,
    description,
    steps,
    difficulty: difficulty || "medium",
    estimatedTime,
    mediaUrls,
  });
}

export async function getLifeSkillsGuidesByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(lifeSkillsGuides).where(eq(lifeSkillsGuides.taskId, taskId));
}
