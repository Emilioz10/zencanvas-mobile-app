import { COOKIE_NAME } from "@shared/const";
import { aiRouter } from "./routers/ai";
import { extendedRouter } from "./routers/extended";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  getNodeRelationships,
  getAllRelationships,
  createRelationship,
  deleteRelationship,
  getSuggestedRelationships,
  acceptSuggestedRelationship,
  rejectSuggestedRelationship,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  ai: aiRouter,
  lifeDomains: extendedRouter.lifeDomains,
  nodeMetadata: extendedRouter.nodeMetadata,
  taskDependencies: extendedRouter.taskDependencies,
  lifeSkillsGuides: extendedRouter.lifeSkillsGuides,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Node management: create, read, update, delete nodes
   */
  nodes: router({
    /**
     * Get all nodes for current user with optional filtering
     */
    list: protectedProcedure
      .input(
        z.object({
          type: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return getUserNodes(ctx.user.id, {
          type: input.type,
          status: input.status,
        });
      }),

    /**
     * Get a single node by ID
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getNode(input.id, ctx.user.id);
      }),

    /**
     * Get a single node by ID (alias for get)
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getNode(input.id, ctx.user.id);
      }),

    /**
     * Create a new node
     */
    create: protectedProcedure
      .input(
        z.object({
          type: z.string().default("note"),
          body: z.string().optional(),
          properties: z.string().optional(),
          tags: z.string().optional(),
          status: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          canvasX: z.number().optional(),
          canvasY: z.number().optional(),
          canvasWidth: z.number().optional(),
          canvasHeight: z.number().optional(),
          cardColor: z.string().optional(),
          attachmentUrl: z.string().optional(),
          attachmentType: z.string().optional(),
          attachmentName: z.string().optional(),
          language: z.string().optional(),
          canvasNodeType: z.string().optional(),
          canvasUrl: z.string().optional(),
          canvasLabel: z.string().optional(),
          canvasBackground: z.string().optional(),
          canvasBackgroundStyle: z.string().optional(),
          flashcardBack: z.string().optional(),
          canvasColor: z.string().optional(),
          canvasZIndex: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createNode(ctx.user.id, input);
        return result;
      }),

    /**
     * Update an existing node
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.string().optional(),
          body: z.string().optional(),
          properties: z.string().optional(),
          tags: z.string().optional(),
          status: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          canvasX: z.number().optional(),
          canvasY: z.number().optional(),
          canvasWidth: z.number().optional(),
          canvasHeight: z.number().optional(),
          cardColor: z.string().optional(),
          attachmentUrl: z.string().optional(),
          attachmentType: z.string().optional(),
          attachmentName: z.string().optional(),
          language: z.string().optional(),
          canvasNodeType: z.string().optional(),
          canvasUrl: z.string().optional(),
          canvasLabel: z.string().optional(),
          canvasBackground: z.string().optional(),
          canvasBackgroundStyle: z.string().optional(),
          flashcardBack: z.string().optional(),
          canvasColor: z.string().optional(),
          canvasZIndex: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateNode(id, ctx.user.id, data);
        return { success: true };
      }),

    /**
     * Delete a node
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteNode(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * Relationship management: create, read, delete relationships
   */
  relationships: router({
    /**
     * Get all relationships for the current user (for canvas view)
     */
    all: protectedProcedure.query(async ({ ctx }) => {
      return getAllRelationships(ctx.user.id);
    }),

    /**
     * Get all relationships for a node (incoming and outgoing)
     */
    forNode: protectedProcedure
      .input(z.object({ nodeId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getNodeRelationships(input.nodeId, ctx.user.id);
      }),

    /**
     * Create a relationship between two nodes
     */
    create: protectedProcedure
      .input(
        z.object({
          fromNodeId: z.number(),
          toNodeId: z.number(),
          type: z.string(),
          label: z.string().optional(),
          edgeColor: z.string().optional(),
          fromSide: z.string().optional(),
          toSide: z.string().optional(),
          fromEnd: z.string().optional(),
          toEnd: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createRelationship(
          ctx.user.id,
          input.fromNodeId,
          input.toNodeId,
          input.type,
          input.label,
          { edgeColor: input.edgeColor, fromSide: input.fromSide, toSide: input.toSide, fromEnd: input.fromEnd, toEnd: input.toEnd }
        );
        return { success: true };
      }),

    /**
     * Delete a relationship
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteRelationship(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  /**
   * AI-powered suggestions: relationship suggestions and task decomposition
   */
  suggestions: router({
    /**
     * Get pending relationship suggestions
     */
    getPending: protectedProcedure.query(async ({ ctx }) => {
      return getSuggestedRelationships(ctx.user.id, "pending");
    }),

    /**
     * Accept a suggested relationship
     */
    accept: protectedProcedure
      .input(z.object({ suggestionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await acceptSuggestedRelationship(input.suggestionId, ctx.user.id);
        return { success: true };
      }),

    /**
     * Reject a suggested relationship
     */
    reject: protectedProcedure
      .input(z.object({ suggestionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await rejectSuggestedRelationship(input.suggestionId, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
