import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbExt from "../db-extended";

export const extendedRouter = router({
  // Life Domains
  lifeDomains: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await dbExt.getLifeDomains(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await dbExt.createLifeDomain(
          ctx.user.id,
          input.name,
          input.description,
          input.color
        );
      }),
  }),

  // Node Metadata
  nodeMetadata: router({
    getByNodeId: protectedProcedure
      .input(z.object({ nodeId: z.number() }))
      .query(async ({ input }) => {
        return await dbExt.getNodeMetadata(input.nodeId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          nodeId: z.number(),
          color: z.string().optional(),
          lifeDomainId: z.number().nullable().optional(),
          relationshipType: z.string().optional(),
          effort: z.string().optional(),
          priority: z.string().optional(),
          limitations: z.string().optional(),
          supportNeeded: z.string().optional(),
          customData: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { nodeId, ...data } = input;
        return await dbExt.updateNodeMetadata(nodeId, data);
      }),
  }),

  // Task Dependencies
  taskDependencies: router({
    getByNodeId: protectedProcedure
      .input(z.object({ nodeId: z.number() }))
      .query(async ({ input }) => {
        return await dbExt.getTaskDependencies(input.nodeId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          dependentTaskId: z.number(),
          dependsOnTaskId: z.number(),
          type: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await dbExt.createTaskDependency(
          ctx.user.id,
          input.dependentTaskId,
          input.dependsOnTaskId,
          input.type
        );
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await dbExt.deleteTaskDependency(input.id);
      }),
  }),

  // Life Skills Guides
  lifeSkillsGuides: router({
    getByTaskId: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await dbExt.getLifeSkillsGuidesByTaskId(input.taskId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          taskId: z.number().nullable(),
          title: z.string(),
          description: z.string().optional(),
          steps: z.string().optional(),
          difficulty: z.string().optional(),
          estimatedTime: z.number().optional(),
          mediaUrls: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await dbExt.createLifeSkillsGuide(
          ctx.user.id,
          input.taskId,
          input.title,
          input.description,
          input.steps,
          input.difficulty,
          input.estimatedTime,
          input.mediaUrls
        );
      }),
  }),

  // Daily Life Logs
  dailyLogs: router({
    list: protectedProcedure
      .input(z.object({ topic: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await dbExt.getDailyLogs(ctx.user.id, input.topic, input.limit);
      }),

    getLastByTopic: protectedProcedure
      .input(z.object({ topic: z.string(), eventType: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await dbExt.getLastLogByTopic(ctx.user.id, input.topic, input.eventType);
      }),

    create: protectedProcedure
      .input(
        z.object({
          topic: z.string(),
          eventType: z.string().default("note"),
          value: z.string().optional(),
          unit: z.string().optional(),
          notes: z.string().optional(),
          eventAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await dbExt.createDailyLog(
          ctx.user.id,
          input.topic,
          input.eventType,
          input.value,
          input.unit,
          input.notes,
          input.eventAt
        );
      }),
  }),
});
