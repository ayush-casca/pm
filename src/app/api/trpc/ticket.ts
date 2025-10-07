import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, logTicketUpdate, formatStatusChange } from '@/lib/audit';

export const ticketRouter = router({
  // Get all tickets for a project
  getProjectTickets: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.ticket.findMany({
        where: { 
          projectId: input.projectId,
          creatorStatus: 'approved' // Only show approved tickets in tickets tab
        },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
          },
          creator: true, // Include creator information
        },
        orderBy: { createdAt: 'desc' }, // Newest first
      });
    }),

  // Create a new ticket
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      dueDate: z.string().optional(),
      assigneeIds: z.array(z.string()).optional(),
      createdById: z.string(), // Add creator ID
    }))
    .mutation(async ({ input }) => {
      const { assigneeIds, createdById, ...ticketData } = input;
      
      const ticket = await prisma.ticket.create({
        data: {
          ...ticketData,
          creatorId: createdById, // Set the creator
          ticketStatus: 'todo', // Default status
          creatorStatus: 'approved', // Manual tickets are auto-approved
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });

      // Add assignees if provided
      if (assigneeIds && assigneeIds.length > 0) {
        await prisma.assignee.createMany({
          data: assigneeIds.map(userId => ({
            ticketId: ticket.id,
            userId,
          })),
        });
      }

      // Get the created ticket with relations for logging
      const createdTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          creator: true, // Include creator information
        },
      });

      // Log audit events
      if (createdTicket) {
        // Log ticket creation in audit log
        await logAuditEvent({
          userId: createdById,
          projectId: ticket.projectId,
          header: 'Ticket Created',
          description: `Created ticket "${ticket.name}"`,
        });

        // Log initial status in ticket updates
        await logTicketUpdate({
          userId: createdById,
          ticketId: ticket.id,
          prevStatus: 'none',
          afterStatus: 'todo',
          description: `Created ticket "${ticket.name}" with status "To Do"`,
        });
      }

      return createdTicket;
    }),

  // Update an existing ticket
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      ticketStatus: z.enum(['todo', 'in_progress', 'done']).optional(),
      dueDate: z.string().optional(),
      assigneeIds: z.array(z.string()).optional(),
      githubUrl: z.string().optional(), // Add GitHub URL
      userId: z.string(), // User making the update
    }))
    .mutation(async ({ input }) => {
      const { id, assigneeIds, userId, ...updateData } = input;
      
      // Get original ticket for comparison
      const originalTicket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!originalTicket) {
        throw new Error('Ticket not found');
      }
      
      // Update ticket
      await prisma.ticket.update({
        where: { id },
        data: {
          ...updateData,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
      });

      // Update assignees if provided
      if (assigneeIds !== undefined) {
        // Remove existing assignees
        await prisma.assignee.deleteMany({
          where: { ticketId: id },
        });

        // Add new assignees
        if (assigneeIds.length > 0) {
          await prisma.assignee.createMany({
            data: assigneeIds.map(userId => ({
              ticketId: id,
              userId,
            })),
          });
        }
      }

      // Get updated ticket for logging
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          creator: true, // Include creator information
        },
      });

      if (!updatedTicket) {
        throw new Error('Failed to retrieve updated ticket');
      }

      // Log status changes
      if (input.ticketStatus && originalTicket.ticketStatus !== input.ticketStatus) {
        const statusChange = formatStatusChange(originalTicket.ticketStatus, input.ticketStatus);
        
        // Log in ticket updates
        await logTicketUpdate({
          userId,
          ticketId: id,
          prevStatus: originalTicket.ticketStatus || 'none',
          afterStatus: input.ticketStatus,
          description: `Status changed ${statusChange}`,
        });

        // Log in audit log
        await logAuditEvent({
          userId,
          projectId: originalTicket.projectId,
          header: 'Ticket Status Changed',
          description: `Changed ticket "${updatedTicket.name}" status ${statusChange}`,
        });
      }

      // Log description changes
      if (input.description !== undefined && originalTicket.description !== input.description) {
        const prevDesc = originalTicket.description || '(empty)';
        const newDesc = input.description || '(empty)';
        
        // Log in ticket updates
        await logTicketUpdate({
          userId,
          ticketId: id,
          prevStatus: 'description',
          afterStatus: 'description',
          description: `Description changed from "${prevDesc.substring(0, 50)}${prevDesc.length > 50 ? '...' : ''}" to "${newDesc.substring(0, 50)}${newDesc.length > 50 ? '...' : ''}"`,
        });

        // Log in audit log
        await logAuditEvent({
          userId,
          projectId: originalTicket.projectId,
          header: 'Ticket Description Updated',
          description: `Updated description for ticket "${updatedTicket.name}"`,
        });
      }

      // Log name changes
      if (input.name !== undefined && originalTicket.name !== input.name) {
        // Log in ticket updates
        await logTicketUpdate({
          userId,
          ticketId: id,
          prevStatus: 'name',
          afterStatus: 'name',
          description: `Name changed from "${originalTicket.name}" to "${input.name}"`,
        });

        // Log in audit log
        await logAuditEvent({
          userId,
          projectId: originalTicket.projectId,
          header: 'Ticket Name Updated',
          description: `Renamed ticket from "${originalTicket.name}" to "${input.name}"`,
        });
      }

      // Log priority changes
      if (input.priority !== undefined && originalTicket.priority !== input.priority) {
        const prevPriority = originalTicket.priority || 'None';
        const newPriority = input.priority || 'None';
        
        // Log in ticket updates
        await logTicketUpdate({
          userId,
          ticketId: id,
          prevStatus: 'priority',
          afterStatus: 'priority',
          description: `Priority changed from "${prevPriority}" to "${newPriority}"`,
        });

        // Log in audit log
        await logAuditEvent({
          userId,
          projectId: originalTicket.projectId,
          header: 'Ticket Priority Updated',
          description: `Changed priority for ticket "${updatedTicket.name}" from "${prevPriority}" to "${newPriority}"`,
        });
      }

      // Log due date changes
      if (input.dueDate !== undefined && originalTicket.dueDate?.toISOString().split('T')[0] !== input.dueDate) {
        const prevDate = originalTicket.dueDate ? originalTicket.dueDate.toISOString().split('T')[0] : 'None';
        const newDate = input.dueDate || 'None';
        
        // Log in ticket updates
        await logTicketUpdate({
          userId,
          ticketId: id,
          prevStatus: 'due_date',
          afterStatus: 'due_date',
          description: `Due date changed from "${prevDate}" to "${newDate}"`,
        });

        // Log in audit log
        await logAuditEvent({
          userId,
          projectId: originalTicket.projectId,
          header: 'Ticket Due Date Updated',
          description: `Changed due date for ticket "${updatedTicket.name}" from "${prevDate}" to "${newDate}"`,
        });
      }

      // Log assignee changes
      if (assigneeIds !== undefined) {
        const oldAssigneeNames = originalTicket.assignees.map(a => a.user.name || a.user.email);
        const newAssigneeNames = updatedTicket.assignees.map(a => a.user.name || a.user.email);
        
        if (JSON.stringify(oldAssigneeNames.sort()) !== JSON.stringify(newAssigneeNames.sort())) {
          // Log in ticket updates
          await logTicketUpdate({
            userId,
            ticketId: id,
            prevStatus: 'assignees',
            afterStatus: 'assignees',
            description: `Assignees changed from "${oldAssigneeNames.join(', ') || 'None'}" to "${newAssigneeNames.join(', ') || 'None'}"`,
          });

          // Log in audit log
          await logAuditEvent({
            userId,
            projectId: originalTicket.projectId,
            header: 'Ticket Assignees Updated',
            description: `Updated assignees for ticket "${updatedTicket.name}" to: ${newAssigneeNames.join(', ') || 'None'}`,
          });
        }
      }

      return updatedTicket;
    }),

  // Delete a ticket
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Delete related records first
      await prisma.assignee.deleteMany({
        where: { ticketId: input.id },
      });
      
      await prisma.ticketComment.deleteMany({
        where: { ticketId: input.id },
      });
      
      await prisma.ticketUpdate.deleteMany({
        where: { ticketId: input.id },
      });

      // Delete the ticket
      return await prisma.ticket.delete({
        where: { id: input.id },
      });
    }),

  // Get a single ticket by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.ticket.findUnique({
        where: { id: input.id },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          project: true,
        },
      });
    }),

  // Get pending tickets for a project (for review)
  getPendingTickets: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.ticket.findMany({
        where: { 
          projectId: input.projectId,
          creatorStatus: 'pending'
        },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          creator: true,
          transcript: true,
        },
        orderBy: { createdAt: 'desc' }, // Newest first
      });
    }),

  // Approve a ticket
  approve: publicProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const ticket = await prisma.ticket.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: input.id },
        data: { creatorStatus: 'approved' },
      });

      // Log audit events
      await logAuditEvent({
        userId: input.userId,
        projectId: ticket.projectId,
        header: 'Ticket Approved',
        description: `Approved ticket "${ticket.name}"`,
      });

      return updatedTicket;
    }),

  // Reject a ticket
  reject: publicProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const ticket = await prisma.ticket.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: input.id },
        data: { creatorStatus: 'rejected' },
      });

      // Log audit events
      await logAuditEvent({
        userId: input.userId,
        projectId: ticket.projectId,
        header: 'Ticket Rejected',
        description: `Rejected ticket "${ticket.name}"`,
      });

      return updatedTicket;
    }),

  // Bulk approve tickets
  bulkApprove: publicProcedure
    .input(z.object({ ids: z.array(z.string()), userId: z.string() }))
    .mutation(async ({ input }) => {
      // Get tickets for audit logging
      const tickets = await prisma.ticket.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, name: true, projectId: true },
      });

      const result = await prisma.ticket.updateMany({
        where: { id: { in: input.ids } },
        data: { creatorStatus: 'approved' },
      });

      // Log audit events for each ticket
      await Promise.all(tickets.map(ticket => 
        logAuditEvent({
          userId: input.userId,
          projectId: ticket.projectId,
          header: 'Ticket Approved',
          description: `Bulk approved ticket "${ticket.name}"`,
        })
      ));

      return result;
    }),

  // Bulk reject tickets
  bulkReject: publicProcedure
    .input(z.object({ ids: z.array(z.string()), userId: z.string() }))
    .mutation(async ({ input }) => {
      // Get tickets for audit logging
      const tickets = await prisma.ticket.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, name: true, projectId: true },
      });

      const result = await prisma.ticket.updateMany({
        where: { id: { in: input.ids } },
        data: { creatorStatus: 'rejected' },
      });

      // Log audit events for each ticket
      await Promise.all(tickets.map(ticket => 
        logAuditEvent({
          userId: input.userId,
          projectId: ticket.projectId,
          header: 'Ticket Rejected',
          description: `Bulk rejected ticket "${ticket.name}"`,
        })
      ));

      return result;
    }),

  // Get all tickets related to transcripts (for expandable transcript view)
  getTranscriptTickets: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.ticket.findMany({
        where: { 
          projectId: input.projectId,
          transcriptId: { not: null }, // Only tickets from transcripts
        },
        include: {
          assignees: {
            include: {
              user: true,
            },
          },
          creator: true,
          transcript: true,
        },
        orderBy: { createdAt: 'desc' }, // Newest first
      });
    }),

  // Add comment to ticket
  addComment: publicProcedure
    .input(z.object({
      ticketId: z.string(),
      userId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const comment = await prisma.ticketComment.create({
        data: {
          ticketId: input.ticketId,
          userId: input.userId,
          content: input.content,
        },
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

      // Get ticket for audit logging
      const ticket = await prisma.ticket.findUnique({
        where: { id: input.ticketId },
        select: { name: true, projectId: true },
      });

      if (ticket) {
        // Log audit event
        await logAuditEvent({
          userId: input.userId,
          projectId: ticket.projectId,
          header: 'Comment Added',
          description: `Added comment to ticket "${ticket.name}"`,
        });
      }

      return comment;
    }),

  // Get comments for ticket
  getComments: publicProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.ticketComment.findMany({
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
        orderBy: { createdAt: 'asc' }, // Oldest first for conversation flow
      });
    }),
});
