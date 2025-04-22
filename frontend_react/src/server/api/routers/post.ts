import { z } from "zod";
import { desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { posts } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.posts.findFirst({
      orderBy: [desc(posts.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(posts).values({
        name: input.name,
        createdById: ctx.session.user.id,
      });
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.posts.findMany({
      orderBy: [desc(posts.createdAt)],
    });
  }),
});
