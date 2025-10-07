import { z } from 'zod';
import { publicProcedure, router } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';

export const ticketUpdateRouter = router({
  getByTicket: publicProcedure
    .input(z.object({ 
      ticketId: z.string(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      return await prisma.ticketUpdate.findMany({
        where: { ticketId: input.ticketId },
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
      });
    }),

  getByProject: publicProcedure
    .input(z.object({ 
      projectId: z.string(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      return await prisma.ticketUpdate.findMany({
        where: { 
          ticket: { projectId: input.projectId }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          ticket: {
            select: {
              id: true,
              name: true,
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
      ticketId: z.string(),
      userId: z.string(),
      prevStatus: z.string(),
      afterStatus: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await prisma.ticketUpdate.create({
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
