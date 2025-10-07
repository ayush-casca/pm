import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const githubRouter = router({
  // Get all branches for a project
  getProjectBranches: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.gitHubBranch.findMany({
        where: { projectId: input.projectId },
        include: {
          ticket: true,
          user: true,
          pullRequests: {
            orderBy: { updatedAt: 'desc' },
          },
          commits: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // Get all PRs for a project
  getProjectPRs: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.pullRequest.findMany({
        where: { projectId: input.projectId },
        include: {
          ticket: true,
          user: true,
          branch: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // Get all commits for a project
  getProjectCommits: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.commit.findMany({
        where: { projectId: input.projectId },
        include: {
          ticket: true,
          user: true,
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to recent commits
      });
    }),

  // Get PRs for a specific ticket
  getTicketPRs: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.pullRequest.findMany({
        where: { ticketId: input.ticketId },
        include: {
          commits: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // Get commits for a specific ticket
  getTicketCommits: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.commit.findMany({
        where: { ticketId: input.ticketId },
        include: {
          pullRequest: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Manually create/link a PR
  createPR: publicProcedure
    .input(z.object({
      projectId: z.string(),
      githubId: z.number(),
      title: z.string(),
      body: z.string().optional(),
      state: z.string(),
      merged: z.boolean().optional(),
      author: z.string(),
      authorEmail: z.string().optional(),
      url: z.string(),
      branchName: z.string(),
      baseBranch: z.string().optional(),
      additions: z.number().optional(),
      deletions: z.number().optional(),
      changedFiles: z.number().optional(),
      ticketId: z.string().optional(),
      userId: z.string().optional(),
      createdById: z.string(), // Who linked this PR
    }))
    .mutation(async ({ input }) => {
      const { createdById, ...prData } = input;
      
      const pr = await prisma.pullRequest.create({
        data: {
          ...prData,
          additions: prData.additions || 0,
          deletions: prData.deletions || 0,
          changedFiles: prData.changedFiles || 0,
          baseBranch: prData.baseBranch || 'main',
        },
        include: {
          ticket: true,
          project: true,
        },
      });

      // Log PR creation
      await logAuditEvent({
        userId: createdById,
        projectId: input.projectId,
        header: 'Pull Request Linked',
        description: `Linked PR "${pr.title}" ${pr.ticketId ? `to ticket ${pr.ticket?.name}` : 'to project'}`,
      });

      return pr;
    }),

  // Manually create/link a commit
  createCommit: publicProcedure
    .input(z.object({
      projectId: z.string(),
      githubId: z.string(), // SHA
      message: z.string(),
      author: z.string(),
      authorEmail: z.string().optional(),
      url: z.string(),
      branchName: z.string().optional(),
      additions: z.number().optional(),
      deletions: z.number().optional(),
      changedFiles: z.number().optional(),
      ticketId: z.string().optional(),
      userId: z.string().optional(),
      pullRequestId: z.string().optional(),
      createdById: z.string(), // Who linked this commit
    }))
    .mutation(async ({ input }) => {
      const { createdById, ...commitData } = input;
      
      const commit = await prisma.commit.create({
        data: {
          ...commitData,
          additions: commitData.additions || 0,
          deletions: commitData.deletions || 0,
          changedFiles: commitData.changedFiles || 0,
        },
        include: {
          ticket: true,
          project: true,
        },
      });

      // Log commit creation
      await logAuditEvent({
        userId: createdById,
        projectId: input.projectId,
        header: 'Commit Linked',
        description: `Linked commit "${commit.message.substring(0, 50)}..." ${commit.ticketId ? `to ticket ${commit.ticket?.name}` : 'to project'}`,
      });

      return commit;
    }),

  // Link PR to ticket
  linkPRToTicket: publicProcedure
    .input(z.object({
      prId: z.string(),
      ticketId: z.string().optional(), // null to unlink
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const pr = await prisma.pullRequest.update({
        where: { id: input.prId },
        data: { ticketId: input.ticketId },
        include: {
          ticket: true,
          project: true,
        },
      });

      // Log linking/unlinking
      const action = input.ticketId ? 'Linked' : 'Unlinked';
      const description = input.ticketId 
        ? `Linked PR "${pr.title}" to ticket "${pr.ticket?.name}"`
        : `Unlinked PR "${pr.title}" from ticket`;

      await logAuditEvent({
        userId: input.userId,
        projectId: pr.projectId,
        header: `Pull Request ${action}`,
        description,
      });

      return pr;
    }),

  // Link commit to ticket
  linkCommitToTicket: publicProcedure
    .input(z.object({
      commitId: z.string(),
      ticketId: z.string().optional(), // null to unlink
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const commit = await prisma.commit.update({
        where: { id: input.commitId },
        data: { ticketId: input.ticketId },
        include: {
          ticket: true,
          project: true,
        },
      });

      // Log linking/unlinking
      const action = input.ticketId ? 'Linked' : 'Unlinked';
      const description = input.ticketId 
        ? `Linked commit "${commit.message.substring(0, 50)}..." to ticket "${commit.ticket?.name}"`
        : `Unlinked commit "${commit.message.substring(0, 50)}..." from ticket`;

      await logAuditEvent({
        userId: input.userId,
        projectId: commit.projectId,
        header: `Commit ${action}`,
        description,
      });

      return commit;
    }),

  // Update project GitHub repo
  updateProjectRepo: publicProcedure
    .input(z.object({
      id: z.string(),
      githubRepoUrl: z.string().optional(),
      githubRepoName: z.string().optional(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { userId, id, ...updateData } = input;

      console.log('🔍 Updating project repo:', updateData);
      let project;

      try {
      
      project = await prisma.project.update({
        where: { id },
        data: updateData,
      });
      } catch (error) {
        console.error('❌ Error updating project repo:', error);
        throw error;
      }

      // Log repo linking
      if (updateData.githubRepoUrl) {
        await logAuditEvent({
          userId,
          projectId: id,
          header: 'GitHub Repository Linked',
          description: `Linked GitHub repository: ${updateData.githubRepoName || updateData.githubRepoUrl}`,
        });
      }

      return project;
    }),

  // Delete PR
  deletePR: publicProcedure
    .input(z.object({ 
      id: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get PR details before deletion
      const pr = await prisma.pullRequest.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!pr) throw new Error('PR not found');

      // Delete the PR
      await prisma.pullRequest.delete({
        where: { id: input.id },
      });

      // Log deletion
      await logAuditEvent({
        userId: input.userId,
        projectId: pr.projectId,
        header: 'Pull Request Removed',
        description: `Removed PR "${pr.title}" from project`,
      });

      return { success: true };
    }),

  // Delete commit
  deleteCommit: publicProcedure
    .input(z.object({ 
      id: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get commit details before deletion
      const commit = await prisma.commit.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!commit) throw new Error('Commit not found');

      // Delete the commit
      await prisma.commit.delete({
        where: { id: input.id },
      });

      // Log deletion
      await logAuditEvent({
        userId: input.userId,
        projectId: commit.projectId,
        header: 'Commit Removed',
        description: `Removed commit "${commit.message.substring(0, 50)}..." from project`,
      });

      return { success: true };
    }),
});
