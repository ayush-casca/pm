import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string | null; // Made optional for system events
  projectId: string;
  header: string;
  description: string;
}

export interface TicketUpdateData {
  userId: string;
  ticketId: string;
  prevStatus: string;
  afterStatus: string;
  description: string;
}

/**
 * Generic function to log audit events
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId === 'system' ? null : data.userId,
        projectId: data.projectId,
        header: data.header,
        description: data.description,
      },
    });
    
    // Log system events to console for debugging
    if (data.userId === 'system' || !data.userId) {
      console.log(`📝 System event logged: ${data.header} - ${data.description}`);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging shouldn't break the main flow
  }
}

/**
 * Helper function to log system events (no user)
 */
export async function logSystemEvent(projectId: string, header: string, description: string): Promise<void> {
  return logAuditEvent({
    userId: null,
    projectId,
    header,
    description,
  });
}

/**
 * Log ticket update events
 */
export async function logTicketUpdate(data: TicketUpdateData): Promise<void> {
  try {
    await prisma.ticketUpdate.create({
      data: {
        userId: data.userId,
        ticketId: data.ticketId,
        prevStatus: data.prevStatus,
        afterStatus: data.afterStatus,
        description: data.description,
      },
    });
  } catch (error) {
    console.error('Failed to log ticket update:', error);
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Helper to format assignee changes for logging
 */
export function formatAssigneeChange(
  oldAssignees: { user: { id: string; name: string | null; email: string } }[],
  newAssignees: { user: { id: string; name: string | null; email: string } }[]
): { added: string[], removed: string[] } {
  const oldIds = new Set(oldAssignees.map(a => a.user.id));
  const newIds = new Set(newAssignees.map(a => a.user.id));

  const added = newAssignees
    .filter(a => !oldIds.has(a.user.id))
    .map(a => a.user.name || a.user.email);

  const removed = oldAssignees
    .filter(a => !newIds.has(a.user.id))
    .map(a => a.user.name || a.user.email);

  return { added, removed };
}

/**
 * Helper to format status change for display
 */
export function formatStatusChange(oldStatus: string | null, newStatus: string | null): string {
  const statusMap: Record<string, string> = {
    'todo': 'To Do',
    'in_progress': 'In Progress',
    'done': 'Done'
  };

  const oldDisplay = oldStatus ? statusMap[oldStatus] || oldStatus : 'None';
  const newDisplay = newStatus ? statusMap[newStatus] || newStatus : 'None';

  return `${oldDisplay} → ${newDisplay}`;
}

/**
 * Helper to format priority change for display
 */
export function formatPriorityChange(oldPriority: string | null, newPriority: string | null): string {
  const oldDisplay = oldPriority ? oldPriority.charAt(0).toUpperCase() + oldPriority.slice(1) : 'None';
  const newDisplay = newPriority ? newPriority.charAt(0).toUpperCase() + newPriority.slice(1) : 'None';

  return `${oldDisplay} → ${newDisplay}`;
}
