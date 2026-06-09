import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertNode,
  users,
  nodes,
  relationships,
  suggestedRelationships,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all nodes for a user with optional filtering
 */
export async function getUserNodes(
  userId: number,
  filters?: { type?: string; status?: string; tags?: string }
) {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [eq(nodes.userId, userId)];

  if (filters?.type) {
    conditions.push(eq(nodes.type, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(nodes.status, filters.status));
  }

  return db
    .select()
    .from(nodes)
    .where(and(...conditions));
}

/**
 * Get a single node by ID
 */
export async function getNode(nodeId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new node
 */
export async function createNode(
  userId: number,
  data: {
    type: string;
    body?: string;
    properties?: string;
    tags?: string;
    status?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(nodes).values({
    userId,
    ...data,
  });

  return result;
}

/**
 * Update a node
 */
export async function updateNode(
  nodeId: number,
  userId: number,
  data: Partial<InsertNode>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(nodes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)));
}

/**
 * Delete a node (cascades to relationships)
 */
export async function deleteNode(nodeId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(nodes)
    .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)));
}

/**
 * Get all relationships for a node (both incoming and outgoing)
 */
export async function getNodeRelationships(nodeId: number, userId: number) {
  const db = await getDb();
  if (!db) return { outgoing: [], incoming: [] };

  const outgoing = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.fromNodeId, nodeId),
        eq(relationships.userId, userId)
      )
    );

  const incoming = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.toNodeId, nodeId),
        eq(relationships.userId, userId)
      )
    );

  return { outgoing, incoming };
}

/**
 * Create a relationship between two nodes
 */
export async function createRelationship(
  userId: number,
  fromNodeId: number,
  toNodeId: number,
  type: string,
  label?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(relationships).values({
    userId,
    fromNodeId,
    toNodeId,
    type,
    label,
  });
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(
  relationshipId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(relationships)
    .where(
      and(
        eq(relationships.id, relationshipId),
        eq(relationships.userId, userId)
      )
    );
}

/**
 * Get all suggested relationships for a user
 */
export async function getSuggestedRelationships(
  userId: number,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [eq(suggestedRelationships.userId, userId)];

  if (status) {
    conditions.push(eq(suggestedRelationships.status, status));
  }

  return db
    .select()
    .from(suggestedRelationships)
    .where(and(...conditions));
}

/**
 * Accept a suggested relationship (create actual relationship)
 */
export async function acceptSuggestedRelationship(
  suggestionId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const suggestion = await db
    .select()
    .from(suggestedRelationships)
    .where(
      and(
        eq(suggestedRelationships.id, suggestionId),
        eq(suggestedRelationships.userId, userId)
      )
    )
    .limit(1);

  if (!suggestion[0]) throw new Error("Suggestion not found");

  const s = suggestion[0];
  await createRelationship(
    userId,
    s.fromNodeId,
    s.toNodeId,
    s.type,
    s.label || undefined
  );

  await db
    .update(suggestedRelationships)
    .set({ status: "accepted" })
    .where(eq(suggestedRelationships.id, suggestionId));
}

/**
 * Reject a suggested relationship
 */
export async function rejectSuggestedRelationship(
  suggestionId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(suggestedRelationships)
    .set({ status: "rejected" })
    .where(
      and(
        eq(suggestedRelationships.id, suggestionId),
        eq(suggestedRelationships.userId, userId)
      )
    );
}
