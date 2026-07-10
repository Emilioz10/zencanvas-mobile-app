import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { drizzle } from "drizzle-orm/mysql2";
import { people, interactions } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── DB Helper ─────────────────────────────────────────────────────────────
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (e) {
      console.warn("[people] DB connect failed:", e);
      _db = null;
    }
  }
  return _db;
}

// ─── Router ────────────────────────────────────────────────────────────────

export const peopleRouter = router({
  /** List all people with last-contact stats */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(people)
      .where(and(eq(people.userId, ctx.user.id), eq(people.isActive, 1)))
      .orderBy(people.name);

    const enriched = await Promise.all(
      rows.map(async (p) => {
        const lastArr = await db
          .select()
          .from(interactions)
          .where(eq(interactions.personId, p.id))
          .orderBy(desc(interactions.happenedAt))
          .limit(1);

        const stats = await db
          .select({
            count: sql<number>`count(*)`,
            avgScore: sql<number>`avg(score)`,
          })
          .from(interactions)
          .where(eq(interactions.personId, p.id));

        return {
          ...p,
          lastInteraction: lastArr[0] ?? null,
          totalInteractions: Number(stats[0]?.count ?? 0),
          avgScore: Number(stats[0]?.avgScore ?? 3),
        };
      })
    );
    return enriched;
  }),

  /** Get single person with interactions */
  get: protectedProcedure
    .input(z.object({ personId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [person] = await db
        .select()
        .from(people)
        .where(and(eq(people.id, input.personId), eq(people.userId, ctx.user.id)));
      if (!person) throw new Error("Person not found");

      const interactionList = await db
        .select()
        .from(interactions)
        .where(and(eq(interactions.personId, input.personId), eq(interactions.userId, ctx.user.id)))
        .orderBy(desc(interactions.happenedAt))
        .limit(100);

      return { person, interactions: interactionList };
    }),

  /** Create a new person */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        avatar: z.string().max(8).optional(),
        color: z.string().max(16).optional(),
        relationshipType: z
          .enum(["family", "partner", "friend", "doctor", "official", "work", "other"])
          .optional(),
        phone: z.string().max(32).optional(),
        notes: z.string().optional(),
        contactFrequencyDays: z.number().min(0).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [result] = await db.insert(people).values({
        userId: ctx.user.id,
        name: input.name,
        avatar: input.avatar ?? "👤",
        color: input.color ?? "#6366f1",
        relationshipType: input.relationshipType ?? "other",
        phone: input.phone,
        notes: input.notes,
        contactFrequencyDays: input.contactFrequencyDays ?? 0,
      });
      return { id: (result as any).insertId as number };
    }),

  /** Update a person */
  update: protectedProcedure
    .input(
      z.object({
        personId: z.number(),
        name: z.string().min(1).max(128).optional(),
        avatar: z.string().max(8).optional(),
        color: z.string().max(16).optional(),
        relationshipType: z
          .enum(["family", "partner", "friend", "doctor", "official", "work", "other"])
          .optional(),
        phone: z.string().max(32).optional(),
        notes: z.string().optional(),
        contactFrequencyDays: z.number().min(0).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { personId, ...fields } = input;
      await db
        .update(people)
        .set(fields)
        .where(and(eq(people.id, personId), eq(people.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Soft-delete a person */
  delete: protectedProcedure
    .input(z.object({ personId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .update(people)
        .set({ isActive: 0 })
        .where(and(eq(people.id, input.personId), eq(people.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Log an interaction — tap-to-log, note is optional */
  logInteraction: protectedProcedure
    .input(
      z.object({
        personId: z.number(),
        type: z.enum([
          "talk",
          "message",
          "meeting",
          "argument",
          "good_moment",
          "appointment",
          "payment",
          "task_done",
          "task_pending",
        ]),
        score: z.number().min(1).max(5).optional(),
        note: z.string().max(255).optional(),
        durationMinutes: z.number().min(0).optional(),
        happenedAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [result] = await db.insert(interactions).values({
        userId: ctx.user.id,
        personId: input.personId,
        type: input.type,
        score: input.score ?? 3,
        note: input.note,
        durationMinutes: input.durationMinutes,
        happenedAt: input.happenedAt ? new Date(input.happenedAt) : new Date(),
      });
      return { id: (result as any).insertId as number };
    }),

  /** Delete an interaction */
  deleteInteraction: protectedProcedure
    .input(z.object({ interactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .delete(interactions)
        .where(
          and(eq(interactions.id, input.interactionId), eq(interactions.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
