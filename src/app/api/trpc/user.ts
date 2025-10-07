import { z } from 'zod';
import { router, publicProcedure } from '@/lib/trpc-setup';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const userRouter = router({
  // Get all users
  getAll: publicProcedure
    .query(async () => {
      try {
        console.log('🔍 Fetching all users...');
        const users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
        });
        console.log(`✅ Found ${users.length} users`);
        return users;
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    }),

  // Get user by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: { id: input.id },
      });
    }),

  // Create new user
  create: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      name: z.string().optional(),
      role: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await prisma.user.create({
        data: input,
      });
    }),

  // Update user
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      role: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.user.update({
        where: { id },
        data,
      });
    }),

  // Delete user
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.user.delete({
        where: { id: input.id },
      });
    }),

  // Get all projects
  getProjects: publicProcedure
    .query(async () => {
      try {
        console.log('🔍 Fetching all projects...');
        const projects = await prisma.project.findMany({
          include: {
            projectUsers: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        console.log(`✅ Found ${projects.length} projects`);
        return projects;
      } catch (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }
    }),

  // Create project
  createProject: publicProcedure
    .input(z.object({
      name: z.string().min(1, 'Project name is required'),
      description: z.string().optional(),
      createdById: z.string(), // Add creator ID for audit logging
    }))
    .mutation(async ({ input }) => {
      const { createdById, ...projectData } = input;
      
      const project = await prisma.project.create({
        data: projectData,
      });

      // Log project creation
      await logAuditEvent({
        userId: createdById,
        projectId: project.id,
        header: 'Project Created',
        description: `Created project "${project.name}"${project.description ? ` with description: "${project.description}"` : ''}`,
      });

      return project;
    }),

  // Update project
  updateProject: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      updatedById: z.string(), // Add updater ID for audit logging
    }))
    .mutation(async ({ input }) => {
      const { id, updatedById, ...data } = input;
      
      // Get original project for comparison
      const originalProject = await prisma.project.findUnique({
        where: { id },
      });

      if (!originalProject) {
        throw new Error('Project not found');
      }

      // Update the project
      const updatedProject = await prisma.project.update({
        where: { id },
        data,
      });

      // Log name changes
      if (input.name !== undefined && originalProject.name !== input.name) {
        await logAuditEvent({
          userId: updatedById,
          projectId: id,
          header: 'Project Name Updated',
          description: `Renamed project from "${originalProject.name}" to "${input.name}"`,
        });
      }

      // Log description changes
      if (input.description !== undefined && originalProject.description !== input.description) {
        const prevDesc = originalProject.description || '(empty)';
        const newDesc = input.description || '(empty)';
        await logAuditEvent({
          userId: updatedById,
          projectId: id,
          header: 'Project Description Updated',
          description: `Updated project description from "${prevDesc}" to "${newDesc}"`,
        });
      }

      return updatedProject;
    }),

  // Get user's assigned projects
  getMyProjects: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.project.findMany({
        where: {
          projectUsers: {
            some: {
              userId: input.userId,
            },
          },
        },
        include: {
          projectUsers: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Get projects user is NOT assigned to
  getAvailableProjects: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.project.findMany({
        where: {
          projectUsers: {
            none: {
              userId: input.userId,
            },
          },
        },
        include: {
          projectUsers: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Add user to project
  addUserToProject: publicProcedure
    .input(z.object({
      projectId: z.string(),
      userId: z.string(),
      role: z.enum(['admin', 'pm', 'engineer']),
      addedById: z.string(), // Add who performed the action
    }))
    .mutation(async ({ input }) => {
      const { addedById, ...projectUserData } = input;
      
      const projectUser = await prisma.projectUser.create({
        data: projectUserData,
        include: {
          user: true,
          project: true,
        },
      });

      // Log user addition to project
      await logAuditEvent({
        userId: addedById,
        projectId: input.projectId,
        header: 'User Added to Project',
        description: `Added ${projectUser.user.name || projectUser.user.email} to project "${projectUser.project.name}" as ${input.role}`,
      });

      return projectUser;
    }),

  // Remove user from project
  removeUserFromProject: publicProcedure
    .input(z.object({
      projectId: z.string(),
      userId: z.string(),
      removedById: z.string(), // Add who performed the action
    }))
    .mutation(async ({ input }) => {
      // Get the project user before deletion for logging
      const projectUser = await prisma.projectUser.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        include: {
          user: true,
          project: true,
        },
      });

      if (!projectUser) {
        throw new Error('User not found in project');
      }

      // Delete the project user
      const deletedProjectUser = await prisma.projectUser.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });

      // Log user removal from project
      await logAuditEvent({
        userId: input.removedById,
        projectId: input.projectId,
        header: 'User Removed from Project',
        description: `Removed ${projectUser.user.name || projectUser.user.email} from project "${projectUser.project.name}" (was ${projectUser.role})`,
      });

      return deletedProjectUser;
    }),

  // Update user role in project
  updateUserRole: publicProcedure
    .input(z.object({
      projectId: z.string(),
      userId: z.string(),
      role: z.enum(['admin', 'pm', 'engineer']),
      updatedById: z.string(), // Add who performed the action
    }))
    .mutation(async ({ input }) => {
      // Get the original role for comparison
      const originalProjectUser = await prisma.projectUser.findUnique({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        include: {
          user: true,
          project: true,
        },
      });

      if (!originalProjectUser) {
        throw new Error('User not found in project');
      }

      // Update the role
      const updatedProjectUser = await prisma.projectUser.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
        include: {
          user: true,
          project: true,
        },
      });

      // Log role change if it actually changed
      if (originalProjectUser.role !== input.role) {
        await logAuditEvent({
          userId: input.updatedById,
          projectId: input.projectId,
          header: 'User Role Updated',
          description: `Changed ${updatedProjectUser.user.name || updatedProjectUser.user.email}'s role in project "${updatedProjectUser.project.name}" from ${originalProjectUser.role} to ${input.role}`,
        });
      }

      return updatedProjectUser;
    }),
});
