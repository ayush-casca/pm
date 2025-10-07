'use client';

import { trpc } from '@/lib/trpc-client';
import { useState, useEffect } from 'react';
import { ProjectsSidebar } from './components/ProjectsSidebar';
import { AddUserToProjectModal } from './components/AddUserToProjectModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketViewModal } from './components/TicketViewModal';
import { TicketTable } from './components/TicketTable';
import { TranscriptsTab } from './components/TranscriptsTab';
import { GitHubTab } from './components/GitHubTab';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function ProjectsPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'transcripts' | 'github' | 'activity'>('tickets');

  const { currentUserId } = useCurrentUser();
  const utils = trpc.useUtils();

  // Queries
  const { data: users } = trpc.user.getAll.useQuery();
  const { data: myProjects, isLoading: myProjectsLoading } = trpc.user.getMyProjects.useQuery({ 
    userId: currentUserId || '1' 
  }, {
    enabled: !!currentUserId
  });
  const { data: availableProjects, isLoading: availableProjectsLoading } = trpc.user.getAvailableProjects.useQuery({ 
    userId: currentUserId || '1' 
  }, {
    enabled: !!currentUserId
  });

  // Get tickets for selected project
  const { data: tickets = [], isLoading: ticketsLoading } = trpc.ticket.getProjectTickets.useQuery({ 
    projectId: selectedProject! 
    }, {
      enabled: !!selectedProject
    });

  // Get transcripts for selected project
  const { data: transcripts = [], isLoading: transcriptsLoading } = trpc.transcript.getProjectTranscripts.useQuery({ 
    projectId: selectedProject! 
  }, {
    enabled: !!selectedProject
  });

  // Get pending tickets for selected project
  const { data: pendingTickets = [], isLoading: pendingTicketsLoading } = trpc.ticket.getPendingTickets.useQuery({ 
    projectId: selectedProject! 
  }, {
    enabled: !!selectedProject
  });

  // Get all transcript-related tickets (pending, approved, rejected)
  const { data: transcriptTickets = [], isLoading: transcriptTicketsLoading } = trpc.ticket.getTranscriptTickets.useQuery({ 
    projectId: selectedProject! 
  }, {
    enabled: !!selectedProject
  });

  // Get audit log for selected project
  const { data: auditLogs = [], isLoading: auditLogsLoading } = trpc.audit.getByProject.useQuery({ 
    projectId: selectedProject! 
  }, {
    enabled: !!selectedProject
  });

  // Get project users for ticket assignment
  const selectedProjectData = myProjects?.find(p => p.id === selectedProject);
  const projectUsers = selectedProjectData?.projectUsers.map(pu => pu.user) || [];
  
  // Get current user to check permissions
  const currentUser = users?.find(u => u.id === currentUserId);
  // If currentUserId is null, treat as anonymous admin. Otherwise check user role.
  const isAdmin = !currentUserId || currentUser?.role === 'Admin';

  // Mutations
  const addUserToProject = trpc.user.addUserToProject.useMutation({
    onSuccess: (_, variables) => {
      setShowAddUser(false);
      setSelectedProject(null);
      utils.user.getMyProjects.invalidate();
      utils.user.getAvailableProjects.invalidate();
      utils.audit.getByProject.invalidate({ projectId: variables.projectId }); // Invalidate audit log for the project
    },
  });

  const createTicket = trpc.ticket.create.useMutation({
    onMutate: async (newTicket) => {
      // Cancel outgoing refetches
      await utils.ticket.getProjectTickets.cancel();

      // Snapshot previous value
      const previousTickets = utils.ticket.getProjectTickets.getData({ projectId: selectedProject! });

      // Optimistically update
      if (previousTickets && selectedProject) {
        const optimisticTicket = {
          id: `temp-${Date.now()}`, // Temporary ID
          name: newTicket.name,
          description: newTicket.description || null,
          priority: newTicket.priority || null,
          ticketStatus: 'todo',
          creatorStatus: 'approved',
          dueDate: newTicket.dueDate ? new Date(newTicket.dueDate) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: selectedProject,
          creatorId: newTicket.createdById,
          transcriptId: null,
          citations: null,
          isManualCreated: true,
          assignees: newTicket.assigneeIds ? newTicket.assigneeIds.map(userId => {
            const user = projectUsers.find(u => u.id === userId);
            return {
              id: `temp-assignee-${userId}`,
              ticketId: `temp-${Date.now()}`,
              userId,
              user: user || { id: userId, name: 'Loading...', email: '' }
            };
          }) : [],
          creator: users.find(u => u.id === newTicket.createdById) || null,
          comments: [],
          updates: []
        };

        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          [optimisticTicket as any, ...previousTickets]
        );
      }

      return { previousTickets };
    },
    onError: (err, newTicket, context) => {
      // Rollback on error
      if (context?.previousTickets && selectedProject) {
        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          context.previousTickets
        );
      }
    },
    onSuccess: () => {
      setShowCreateTicket(false);
    },
    onSettled: () => {
      // Always refetch after mutation
      utils.ticket.getProjectTickets.invalidate();
      utils.audit.getByProject.invalidate();
      utils.ticketUpdate.getByProject.invalidate();
      // Also invalidate specific ticket updates for any tickets that might be open in modals
      utils.ticketUpdate.getByTicket.invalidate();
      // Also invalidate comments for any tickets that might be open in modals
      utils.ticket.getComments.invalidate();
    },
  });

  const updateTicket = trpc.ticket.update.useMutation({
    onMutate: async (updatedTicket) => {
      // Cancel outgoing refetches
      await utils.ticket.getProjectTickets.cancel();

      // Snapshot previous value
      const previousTickets = utils.ticket.getProjectTickets.getData({ projectId: selectedProject! });

      // Optimistically update
      if (previousTickets && selectedProject) {
        const updatedTickets = previousTickets.map(ticket =>
          ticket.id === updatedTicket.id
            ? { ...ticket, ...updatedTicket, updatedAt: new Date() }
            : ticket
        );

        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          updatedTickets
        );
      }

      return { previousTickets };
    },
    onError: (err, updatedTicket, context) => {
      // Rollback on error
      if (context?.previousTickets && selectedProject) {
        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          context.previousTickets
        );
      }
    },
    onSuccess: () => {
      setEditingTicket(null);
    },
    onSettled: () => {
      // Always refetch after mutation
      utils.ticket.getProjectTickets.invalidate();
      utils.audit.getByProject.invalidate();
      utils.ticketUpdate.getByProject.invalidate();
      // Also invalidate specific ticket updates for any tickets that might be open in modals
      utils.ticketUpdate.getByTicket.invalidate();
      // Also invalidate comments for any tickets that might be open in modals
      utils.ticket.getComments.invalidate();
    },
  });

  const createTranscript = trpc.transcript.create.useMutation({
    onSuccess: () => {
      utils.transcript.getProjectTranscripts.invalidate();
      utils.ticket.getPendingTickets.invalidate();
      utils.ticket.getTranscriptTickets.invalidate(); // Refresh transcript tickets for expandable view
      utils.audit.getByProject.invalidate(); // AI transcript processing creates audit logs
      utils.ticketUpdate.getByProject.invalidate(); // AI-generated tickets create ticket updates
      utils.ticketUpdate.getByTicket.invalidate(); // Also invalidate specific ticket updates
    },
  });

  const deleteTranscript = trpc.transcript.delete.useMutation({
    onSuccess: () => {
      utils.transcript.getProjectTranscripts.invalidate();
    },
  });

  const reprocessTranscript = trpc.transcript.reprocess.useMutation({
    onSuccess: () => {
      utils.transcript.getProjectTranscripts.invalidate();
    },
  });

  const approveTicket = trpc.ticket.approve.useMutation({
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.ticket.getPendingTickets.cancel();
      await utils.ticket.getProjectTickets.cancel();
      await utils.ticket.getTranscriptTickets.cancel();

      // Snapshot previous values
      const previousPending = utils.ticket.getPendingTickets.getData({ projectId: selectedProject! });
      const previousTickets = utils.ticket.getProjectTickets.getData({ projectId: selectedProject! });
      const previousTranscriptTickets = utils.ticket.getTranscriptTickets.getData({ projectId: selectedProject! });

      // Optimistically update - remove from pending, add to approved
      if (previousPending && selectedProject) {
        const approvedTicket = previousPending.find(t => t.id === id);
        if (approvedTicket) {
          // Remove from pending
          const updatedPending = previousPending.filter(t => t.id !== id);
          utils.ticket.getPendingTickets.setData(
            { projectId: selectedProject },
            updatedPending
          );

          // Add to approved tickets
          if (previousTickets) {
            const updatedTickets = [{ ...approvedTicket, creatorStatus: 'approved' }, ...previousTickets];
            utils.ticket.getProjectTickets.setData(
              { projectId: selectedProject },
              updatedTickets
            );
          }

          // Update transcript tickets
          if (previousTranscriptTickets) {
            const updatedTranscriptTickets = previousTranscriptTickets.map(t => 
              t.id === id ? { ...t, creatorStatus: 'approved' } : t
            );
            utils.ticket.getTranscriptTickets.setData(
              { projectId: selectedProject },
              updatedTranscriptTickets
            );
          }
        }
      }

      return { previousPending, previousTickets, previousTranscriptTickets };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPending && selectedProject) {
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          context.previousPending
        );
      }
      if (context?.previousTickets && selectedProject) {
        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          context.previousTickets
        );
      }
      if (context?.previousTranscriptTickets && selectedProject) {
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          context.previousTranscriptTickets
        );
      }
    },
    onSettled: () => {
      utils.ticket.getPendingTickets.invalidate();
      utils.ticket.getProjectTickets.invalidate();
      utils.ticket.getTranscriptTickets.invalidate();
      utils.audit.getByProject.invalidate(); // Approve creates audit logs
    },
  });

  const rejectTicket = trpc.ticket.reject.useMutation({
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await utils.ticket.getPendingTickets.cancel();
      await utils.ticket.getTranscriptTickets.cancel();

      // Snapshot previous values
      const previousPending = utils.ticket.getPendingTickets.getData({ projectId: selectedProject! });
      const previousTranscriptTickets = utils.ticket.getTranscriptTickets.getData({ projectId: selectedProject! });

      // Optimistically update - remove from pending
      if (previousPending && selectedProject) {
        const updatedPending = previousPending.filter(t => t.id !== id);
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          updatedPending
        );
      }

      // Update transcript tickets status
      if (previousTranscriptTickets && selectedProject) {
        const updatedTranscriptTickets = previousTranscriptTickets.map(t => 
          t.id === id ? { ...t, creatorStatus: 'rejected' } : t
        );
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          updatedTranscriptTickets
        );
      }

      return { previousPending, previousTranscriptTickets };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPending && selectedProject) {
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          context.previousPending
        );
      }
      if (context?.previousTranscriptTickets && selectedProject) {
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          context.previousTranscriptTickets
        );
      }
    },
    onSettled: () => {
      utils.ticket.getPendingTickets.invalidate();
      utils.ticket.getTranscriptTickets.invalidate();
      utils.audit.getByProject.invalidate(); // Reject creates audit logs
    },
  });

  const bulkApproveTickets = trpc.ticket.bulkApprove.useMutation({
    onMutate: async ({ ids }) => {
      // Cancel outgoing refetches
      await utils.ticket.getPendingTickets.cancel();
      await utils.ticket.getProjectTickets.cancel();
      await utils.ticket.getTranscriptTickets.cancel();

      // Snapshot previous values
      const previousPending = utils.ticket.getPendingTickets.getData({ projectId: selectedProject! });
      const previousTickets = utils.ticket.getProjectTickets.getData({ projectId: selectedProject! });
      const previousTranscriptTickets = utils.ticket.getTranscriptTickets.getData({ projectId: selectedProject! });

      // Optimistically update
      if (previousPending && selectedProject) {
        const approvedTickets = previousPending.filter(t => ids.includes(t.id));
        const remainingPending = previousPending.filter(t => !ids.includes(t.id));

        // Update pending tickets
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          remainingPending
        );

        // Add to approved tickets
        if (previousTickets && approvedTickets.length > 0) {
          const updatedTickets = [
            ...approvedTickets.map(t => ({ ...t, creatorStatus: 'approved' })),
            ...previousTickets
          ];
          utils.ticket.getProjectTickets.setData(
            { projectId: selectedProject },
            updatedTickets
          );
        }

        // Update transcript tickets status
        if (previousTranscriptTickets) {
          const updatedTranscriptTickets = previousTranscriptTickets.map(t => 
            ids.includes(t.id) ? { ...t, creatorStatus: 'approved' } : t
          );
          utils.ticket.getTranscriptTickets.setData(
            { projectId: selectedProject },
            updatedTranscriptTickets
          );
        }
      }

      return { previousPending, previousTickets, previousTranscriptTickets };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPending && selectedProject) {
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          context.previousPending
        );
      }
      if (context?.previousTickets && selectedProject) {
        utils.ticket.getProjectTickets.setData(
          { projectId: selectedProject },
          context.previousTickets
        );
      }
      if (context?.previousTranscriptTickets && selectedProject) {
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          context.previousTranscriptTickets
        );
      }
    },
    onSettled: () => {
      utils.ticket.getPendingTickets.invalidate();
      utils.ticket.getProjectTickets.invalidate();
      utils.ticket.getTranscriptTickets.invalidate();
      utils.audit.getByProject.invalidate(); // Bulk approve creates audit logs
    },
  });

  const bulkRejectTickets = trpc.ticket.bulkReject.useMutation({
    onMutate: async ({ ids }) => {
      // Cancel outgoing refetches
      await utils.ticket.getPendingTickets.cancel();
      await utils.ticket.getTranscriptTickets.cancel();

      // Snapshot previous values
      const previousPending = utils.ticket.getPendingTickets.getData({ projectId: selectedProject! });
      const previousTranscriptTickets = utils.ticket.getTranscriptTickets.getData({ projectId: selectedProject! });

      // Optimistically update - remove rejected tickets
      if (previousPending && selectedProject) {
        const remainingPending = previousPending.filter(t => !ids.includes(t.id));
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          remainingPending
        );
      }

      // Update transcript tickets status
      if (previousTranscriptTickets && selectedProject) {
        const updatedTranscriptTickets = previousTranscriptTickets.map(t => 
          ids.includes(t.id) ? { ...t, creatorStatus: 'rejected' } : t
        );
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          updatedTranscriptTickets
        );
      }

      return { previousPending, previousTranscriptTickets };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPending && selectedProject) {
        utils.ticket.getPendingTickets.setData(
          { projectId: selectedProject },
          context.previousPending
        );
      }
      if (context?.previousTranscriptTickets && selectedProject) {
        utils.ticket.getTranscriptTickets.setData(
          { projectId: selectedProject },
          context.previousTranscriptTickets
        );
      }
    },
    onSettled: () => {
      utils.ticket.getPendingTickets.invalidate();
      utils.ticket.getTranscriptTickets.invalidate();
      utils.audit.getByProject.invalidate(); // Bulk reject creates audit logs
    },
  });

  const handleAddUser = (data: { projectId: string; userId: string; role: 'admin' | 'pm' | 'engineer' }) => {
    if (!currentUserId) return;
    addUserToProject.mutate({
      ...data,
      addedById: currentUserId,
    });
  };

  const handleAddMember = (projectId: string) => {
    if (!isAdmin) return; // Only admins can add members
    setSelectedProject(projectId);
    setShowAddUser(true);
  };

  const handleJoinProject = (projectId: string) => {
    if (!isAdmin) return; // Only admins can join projects
    setSelectedProject(projectId);
    setShowAddUser(true);
  };

  const handleCreateTicket = (data: any) => {
    if (!selectedProject || !currentUserId) return;
    createTicket.mutate({
      ...data,
      projectId: selectedProject,
      createdById: currentUserId,
    });
  };

  const handleUpdateFullTicket = (data: any) => {
    if (!editingTicket || !currentUserId) return;
    updateTicket.mutate({
      ...data,
      id: editingTicket.id,
      userId: currentUserId,
    });
  };

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket);
  };

  const handleViewTicket = (ticket: any) => {
    setViewingTicket(ticket);
  };

  const handleUpdateTicketStatus = (ticketId: string, status: string) => {
    if (!currentUserId) return;
    updateTicket.mutate({
      id: ticketId,
      ticketStatus: status as 'todo' | 'in_progress' | 'done',
      userId: currentUserId,
    });
  };

  const handleCreateTicketFromKanban = () => {
    setShowCreateTicket(true);
  };

  const handleCreateQuickTicket = (name: string, assigneeId?: string) => {
    if (!selectedProject || !currentUserId) return;
    
    const ticketData: any = {
      name,
      projectId: selectedProject,
      createdById: currentUserId,
      ticketStatus: 'todo',
    };

    // Add assignee if provided
    if (assigneeId) {
      ticketData.assigneeIds = [assigneeId];
    }

    createTicket.mutate(ticketData);
  };

  const handleUpdateTicket = (ticketId: string, updates: any) => {
    if (!currentUserId) return;
    updateTicket.mutate({
      id: ticketId,
      ...updates,
      userId: currentUserId,
    });
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleUploadTranscript = (name: string, content: string) => {
    if (!selectedProject || !currentUserId) return;
    
    createTranscript.mutate({
      name,
      content,
      projectId: selectedProject,
      uploaderId: currentUserId,
    });
  };

  const handleViewTranscript = (transcript: any) => {
    // TODO: Open transcript detail modal or page
    console.log('View transcript:', transcript);
  };

  const handleReprocessTranscript = (transcriptId: string) => {
    reprocessTranscript.mutate({ id: transcriptId });
  };

  const handleDeleteTranscript = (transcriptId: string) => {
    if (confirm('Are you sure you want to delete this transcript?')) {
      deleteTranscript.mutate({ id: transcriptId });
    }
  };

  const handleApproveTicket = (ticketId: string) => {
    if (!currentUserId) return;
    approveTicket.mutate({ id: ticketId, userId: currentUserId });
  };

  const handleRejectTicket = (ticketId: string) => {
    if (!currentUserId) return;
    rejectTicket.mutate({ id: ticketId, userId: currentUserId });
  };

  const handleBulkApproveTickets = (ticketIds: string[]) => {
    if (!currentUserId) return;
    bulkApproveTickets.mutate({ ids: ticketIds, userId: currentUserId });
  };

  const handleBulkRejectTickets = (ticketIds: string[]) => {
    if (!currentUserId) return;
    bulkRejectTickets.mutate({ ids: ticketIds, userId: currentUserId });
  };

  // Poll for transcript status updates when there are processing transcripts
  useEffect(() => {
    const processingTranscripts = transcripts.filter(t => t.processingStatus === 'processing');
    
    if (processingTranscripts.length > 0) {
      const interval = setInterval(() => {
        // Refresh transcript and pending ticket data
        utils.transcript.getProjectTranscripts.invalidate();
        utils.ticket.getPendingTickets.invalidate();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [transcripts, utils]);

  return (
    <div className="flex h-full">
      {/* Projects Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Projects</h2>
            {currentUserId && (
              <div className="text-xs text-gray-500">
                User: {users?.find(u => u.id === currentUserId)?.name || users?.find(u => u.id === currentUserId)?.email || 'Unknown'}
              </div>
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-hidden">
          <ProjectsSidebar
            myProjects={myProjects}
            availableProjects={availableProjects}
            myProjectsLoading={myProjectsLoading}
            availableProjectsLoading={availableProjectsLoading}
            onAddMember={handleAddMember}
            onJoinProject={handleJoinProject}
            onProjectSelect={handleProjectSelect}
            selectedProjectId={selectedProject}
            canManageProjects={isAdmin}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        {selectedProject ? (
          <div className="h-full flex flex-col">
            {/* Project Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedProjectData?.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProjectData?.description || 'No description'}
                  </p>
                </div>
                {activeTab === 'tickets' ? (
                  <button
                    onClick={() => setShowCreateTicket(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Ticket
                  </button>
                ) : null}
              </div>

              {/* Tabs */}
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'tickets'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tickets ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('transcripts')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'transcripts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Transcripts ({transcripts.length})
                  {pendingTickets.length > 0 && (
                    <span className="ml-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                      {pendingTickets.length} pending
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('github')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'github'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  GitHub
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity ({auditLogs.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden p-6">
              {activeTab === 'tickets' ? (
                <TicketTable
                  tickets={tickets as any}
                  onEditTicket={handleEditTicket}
                  onViewTicket={handleViewTicket}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onUpdateTicket={handleUpdateTicket}
                  onCreateTicket={handleCreateTicketFromKanban}
                  onCreateQuickTicket={handleCreateQuickTicket}
                  projectUsers={projectUsers}
                  isLoading={ticketsLoading}
                />
              ) : activeTab === 'transcripts' ? (
                <TranscriptsTab
                  transcripts={transcripts as any}
                  transcriptTickets={transcriptTickets as any}
                  onUploadTranscript={handleUploadTranscript}
                  onViewTranscript={handleViewTranscript}
                  onReprocessTranscript={handleReprocessTranscript}
                  onDeleteTranscript={handleDeleteTranscript}
                  onApproveTicket={handleApproveTicket}
                  onRejectTicket={handleRejectTicket}
                  onBulkApproveTickets={handleBulkApproveTickets}
                  onBulkRejectTickets={handleBulkRejectTickets}
                  isUploadLoading={createTranscript.isPending}
                  isTranscriptsLoading={transcriptsLoading}
                />
              ) : activeTab === 'github' ? (
                <GitHubTab
                  projectId={selectedProject!}
                  tickets={tickets as any}
                />
              ) : (
                // Activity Tab
                <div className="bg-white rounded-lg border border-gray-200 h-full">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Project Activity</h2>
                    <p className="text-sm text-gray-500 mt-1">Recent actions and changes in this project</p>
                  </div>
                  
                  <div className="p-6 h-full overflow-y-auto">
                    {auditLogsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : auditLogs.length > 0 ? (
                      <div className="space-y-4">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-sm">
                                {(log.user.name || log.user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900">{log.header}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {log.user.name || log.user.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">No activity yet</h3>
                        <p className="text-sm text-gray-500">Activity will appear here as you work on this project</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
              <p className="text-gray-500">Choose a project from the sidebar to view and manage tickets</p>
            </div>
          </div>
        )}
      </div>

      <AddUserToProjectModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSubmit={handleAddUser}
        isLoading={addUserToProject.isPending}
        users={users}
        projectId={selectedProject}
      />

      <CreateTicketModal
        isOpen={showCreateTicket || !!editingTicket}
        onClose={() => {
          setShowCreateTicket(false);
          setEditingTicket(null);
        }}
        onSubmit={editingTicket ? handleUpdateFullTicket : handleCreateTicket}
        isLoading={createTicket.isPending || updateTicket.isPending}
        projectUsers={projectUsers}
        ticket={editingTicket}
        currentUserId={currentUserId || undefined}
      />

      <TicketViewModal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        ticket={viewingTicket}
        onEdit={handleEditTicket}
        currentUserId={currentUserId || undefined}
        projectUsers={projectUsers}
      />
    </div>
  );
}
