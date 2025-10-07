import { z } from 'zod';
import { router, publicProcedure } from './trpc-setup';
import { userRouter } from '@/app/api/trpc/user';
import { ticketRouter } from '@/app/api/trpc/ticket';
import { transcriptRouter } from '@/app/api/trpc/transcript';
import { auditRouter } from '@/app/api/trpc/audit';
import { ticketUpdateRouter } from '@/app/api/trpc/ticketUpdate';
import { githubRouter } from '@/app/api/trpc/github';

// Main app router that combines all sub-routers
export const appRouter = router({
  // Keep the hello procedure for demo purposes
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}!`,
      };
    }),

  // Sub-routers
  user: userRouter,
  ticket: ticketRouter,
  transcript: transcriptRouter,
  audit: auditRouter,
  ticketUpdate: ticketUpdateRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
