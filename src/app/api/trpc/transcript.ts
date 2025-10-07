import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';
import { analyzeTranscriptWithClaude } from '@/lib/claude';
import { logAuditEvent, logTicketUpdate } from '@/lib/audit';

export const transcriptRouter = router({
  // Get all transcripts for a project
  getProjectTranscripts: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.transcript.findMany({
        where: { projectId: input.projectId },
        include: {
          uploader: true,
          tickets: {
            include: {
              assignees: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Create a new transcript
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      content: z.string(),
      projectId: z.string(),
      uploaderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Create the transcript
      const transcript = await prisma.transcript.create({
        data: {
          name: input.name,
          content: input.content,
          projectId: input.projectId,
          uploaderId: input.uploaderId,
          processingStatus: 'pending',
        },
        include: {
          uploader: true,
        },
      });

      // Start AI processing in background (don't await)
      // This simulates how it would work with a real AI service
      processTranscriptWithAI(transcript.id);

      // Return the transcript immediately with "processing" status
      return transcript;
    }),

  // Get a single transcript
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.transcript.findUnique({
        where: { id: input.id },
        include: {
          uploader: true,
          project: true,
          tickets: {
            include: {
              assignees: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });
    }),

  // Delete a transcript
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.transcript.delete({
        where: { id: input.id },
      });
    }),

  // Reprocess a transcript
  reprocess: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Update status to processing
      await prisma.transcript.update({
        where: { id: input.id },
        data: { processingStatus: 'processing' },
      });

      // Trigger AI processing
      processTranscriptWithAI(input.id);

      return { success: true };
    }),
});

// AI Processing function (to be implemented)
async function processTranscriptWithAI(transcriptId: string) {
  try {
    // Update status to processing
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { processingStatus: 'processing' },
    });

    // Get the transcript
    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
      include: {
        project: {
          include: {
            projectUsers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!transcript) {
      throw new Error('Transcript not found');
    }

    // Analyze transcript with Claude
    const analysis = await analyzeTranscriptWithClaude(
      transcript.name,
      transcript.content,
      transcript.project.projectUsers
    );

    // Calculate suggested assignees based on workload
    const projectUsers = transcript.project.projectUsers;
    const suggestedAssignees = await calculateSuggestedAssignees(transcript.projectId, projectUsers);

    // Create tickets from Claude's analysis
    const ticketPromises = analysis.actionItems.map(async (item) => {
      // Map Claude's role suggestion to actual user
      let assigneeId: string | undefined;
      switch (item.suggestedAssigneeRole) {
        case 'engineer':
          assigneeId = suggestedAssignees.engineer;
          break;
        case 'pm':
          assigneeId = suggestedAssignees.pm;
          break;
        case 'admin':
          assigneeId = suggestedAssignees.admin;
          break;
        default:
          assigneeId = suggestedAssignees.any;
      }

      const ticket = await prisma.ticket.create({
        data: {
          name: item.name,
          description: `${item.description}\n\n**AI Reasoning:** ${item.reasoning}`,
          priority: item.priority,
          ticketStatus: 'todo',
          creatorStatus: 'pending',
          projectId: transcript.projectId,
          transcriptId: transcript.id,
          creatorId: transcript.uploaderId,
          citations: JSON.stringify(item.citations || [{
            text: `Generated from transcript: ${transcript.name}`,
            timestamp: new Date().toISOString(),
            context: 'AI Analysis'
          }]),
          assignees: assigneeId ? {
            create: {
              userId: assigneeId,
            },
          } : undefined,
        },
      });

      // Log audit events for AI-generated tickets
      await logAuditEvent({
        userId: transcript.uploaderId,
        projectId: transcript.projectId,
        header: 'AI Ticket Generated',
        description: `AI generated ticket "${item.name}" from transcript "${transcript.name}"`,
      });

      await logTicketUpdate({
        userId: transcript.uploaderId,
        ticketId: ticket.id,
        prevStatus: 'none',
        afterStatus: 'todo',
        description: `AI created ticket "${item.name}" with status "To Do" (pending review)`,
      });

      return ticket;
    });

    await Promise.all(ticketPromises);

    // Update transcript with Claude's analysis
    const formattedAnalysis = `AI Analysis of "${transcript.name}":

**Summary:** ${analysis.summary}

**Key Topics:** ${analysis.keyTopics.join(', ')}

**Action Items Generated:** ${analysis.actionItems.length} tickets created with smart role-based assignments.

**Tickets Created:**
${analysis.actionItems.map((item, i) => 
  `${i + 1}. ${item.name} (${item.priority} priority) → ${item.suggestedAssigneeRole}`
).join('\n')}`;

    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        aiAnalysis: formattedAnalysis,
        processingStatus: 'completed',
      },
    });

  } catch (error) {
    console.error('AI processing failed:', error);
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { processingStatus: 'failed' },
    });
  }
}

// Calculate suggested assignees based on current workload
async function calculateSuggestedAssignees(projectId: string, projectUsers: any[]) {
  // Get current ticket counts for each user
  const userWorkloads = await Promise.all(
    projectUsers.map(async (pu) => {
      const ticketCount = await prisma.assignee.count({
        where: {
          userId: pu.userId,
          ticket: {
            projectId: projectId,
            ticketStatus: {
              in: ['todo', 'in_progress'],
            },
          },
        },
      });
      
      return {
        userId: pu.userId,
        role: pu.role,
        ticketCount,
        user: pu.user,
      };
    })
  );

  // Sort by workload (ascending)
  userWorkloads.sort((a, b) => a.ticketCount - b.ticketCount);

  // Find best candidates by role
  const engineers = userWorkloads.filter(u => u.role === 'engineer');
  const pms = userWorkloads.filter(u => u.role === 'pm');
  const admins = userWorkloads.filter(u => u.role === 'admin');

  return {
    engineer: engineers[0]?.userId || userWorkloads[0]?.userId,
    pm: pms[0]?.userId || admins[0]?.userId || userWorkloads[0]?.userId,
    admin: admins[0]?.userId || userWorkloads[0]?.userId,
    any: userWorkloads[0]?.userId,
  };
}
