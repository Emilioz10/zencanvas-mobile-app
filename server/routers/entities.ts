/**
 * Entities router — ontological objects with typed properties and bi-directional links
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { drizzle } from "drizzle-orm/mysql2";
import { entities, entityLinks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (e) {
      console.warn("[entities] DB connect failed:", e);
      _db = null;
    }
  }
  return _db;
}

const entityTypeEnum = z.enum([
  "person", "document", "task", "project", "medication",
  "money", "place", "event", "concept", "tool", "debt",
  "appointment", "guide", "contact", "goal",
]);

const linkTypeEnum = z.enum([
  "related", "depends_on", "blocks", "part_of",
  "references", "caused_by", "resolves", "owns",
]);

export const entitiesRouter = router({
  /** List all entities for the current user, optionally filtered by type/domain */
  list: protectedProcedure
    .input(z.object({
      entityType: z.string().optional(),
      domain: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.userId, ctx.user.id),
            input?.entityType ? eq(entities.entityType, input.entityType) : undefined,
            input?.domain ? eq(entities.domain, input.domain) : undefined,
            input?.status ? eq(entities.status, input.status) : undefined,
          )
        )
        .orderBy(desc(entities.updatedAt));
      return rows;
    }),

  /** Get a single entity by ID with its links */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [entity] = await db
        .select()
        .from(entities)
        .where(and(eq(entities.id, input.id), eq(entities.userId, ctx.user.id)));
      if (!entity) throw new Error("Entity not found");

      // Get all links where this entity is source or target
      const outgoing = await db
        .select()
        .from(entityLinks)
        .where(and(eq(entityLinks.fromEntityId, input.id), eq(entityLinks.userId, ctx.user.id)));

      const incoming = await db
        .select()
        .from(entityLinks)
        .where(and(eq(entityLinks.toEntityId, input.id), eq(entityLinks.userId, ctx.user.id)));

      // Fetch linked entity names for display
      const linkedIds = [
        ...outgoing.map((l: typeof entityLinks.$inferSelect) => l.toEntityId),
        ...incoming.map((l: typeof entityLinks.$inferSelect) => l.fromEntityId),
      ].filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);

      let linkedEntities: typeof entities.$inferSelect[] = [];
      if (linkedIds.length > 0) {
        const allEntities = await db
          .select()
          .from(entities)
          .where(eq(entities.userId, ctx.user.id));
        linkedEntities = allEntities.filter((e: typeof entities.$inferSelect) => linkedIds.includes(e.id));
      }

      return { entity, outgoing, incoming, linkedEntities };
    }),

  /** Create a new entity */
  create: protectedProcedure
    .input(z.object({
      entityType: entityTypeEnum,
      name: z.string().min(1).max(255),
      icon: z.string().optional(),
      color: z.string().optional(),
      body: z.string().optional(),
      properties: z.string().optional(), // JSON string
      tags: z.string().optional(),
      domain: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(entities).values({
        userId: ctx.user.id,
        entityType: input.entityType,
        name: input.name,
        icon: input.icon ?? "📌",
        color: input.color ?? "#6366f1",
        body: input.body ?? "",
        properties: input.properties ?? "{}",
        tags: input.tags ?? "",
        domain: input.domain ?? "",
        status: "active",
      });
      const id = (result as any).insertId as number;
      const [created] = await db.select().from(entities).where(eq(entities.id, id));
      return created;
    }),

  /** Update an entity */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      body: z.string().optional(),
      properties: z.string().optional(),
      tags: z.string().optional(),
      domain: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db
        .update(entities)
        .set(data)
        .where(and(eq(entities.id, id), eq(entities.userId, ctx.user.id)));
      const [updated] = await db.select().from(entities).where(eq(entities.id, id));
      return updated;
    }),

  /** Delete an entity (cascades to its links) */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(entities)
        .where(and(eq(entities.id, input.id), eq(entities.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Create a link between two entities */
  link: protectedProcedure
    .input(z.object({
      fromEntityId: z.number(),
      toEntityId: z.number(),
      linkType: linkTypeEnum,
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Prevent duplicate links
      const existing = await db
        .select()
        .from(entityLinks)
        .where(
          and(
            eq(entityLinks.userId, ctx.user.id),
            eq(entityLinks.fromEntityId, input.fromEntityId),
            eq(entityLinks.toEntityId, input.toEntityId),
            eq(entityLinks.linkType, input.linkType),
          )
        );
      if (existing.length > 0) return existing[0];

      const [result] = await db.insert(entityLinks).values({
        userId: ctx.user.id,
        fromEntityId: input.fromEntityId,
        toEntityId: input.toEntityId,
        linkType: input.linkType,
        label: input.label ?? "",
      });
      const id = (result as any).insertId as number;
      const [created] = await db.select().from(entityLinks).where(eq(entityLinks.id, id));
      return created;
    }),

  /** Delete a link */
  unlink: protectedProcedure
    .input(z.object({ linkId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(entityLinks)
        .where(and(eq(entityLinks.id, input.linkId), eq(entityLinks.userId, ctx.user.id)));
      return { success: true };
    }),
});
