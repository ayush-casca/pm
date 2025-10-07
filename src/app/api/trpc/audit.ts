import { z } from 'zod';
import { publicProcedure, router } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';

export const auditRouter = router({
  getByProject: publicProcedure
    .input(z.object({ 
      projectId: z.string(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      return await prisma.auditLog.findMany({
        where: { projectId: input.projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  create: publicProcedure
    .input(z.object({
      projectId: z.string(),
      userId: z.string(),
      header: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await prisma.auditLog.create({
        data: input,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
    }),
});
