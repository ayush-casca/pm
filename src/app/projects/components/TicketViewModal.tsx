'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  priority: string | null;
  ticketStatus: string | null;
  dueDate: Date | null;
  createdAt: Date;
  assignees: {
    user: User;
  }[];
  creator?: User | null;
}

interface TicketViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onEdit: (ticket: Ticket) => void;
  currentUserId?: string;
  projectUsers?: User[];
}

// AssigneeSelector Component
interface AssigneeSelectorProps {
  currentAssignees: User[];
  availableUsers: User[];
  onAssigneesChange: (assigneeIds: string[]) => void;
}

function AssigneeSelector({ currentAssignees, availableUsers, onAssigneesChange }: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = availableUsers.filter(user =>
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !currentAssignees.some(assignee => assignee.id === user.id)
  );

  const handleAddAssignee = (user: User) => {
    const newAssigneeIds = [...currentAssignees.map(a => a.id), user.id];
    onAssigneesChange(newAssigneeIds);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRemoveAssignee = (userId: string) => {
    const newAssigneeIds = currentAssignees.filter(a => a.id !== userId).map(a => a.id);
    onAssigneesChange(newAssigneeIds);
  };

  return (
    <div className="space-y-2">
      {/* Current Assignees */}
      {currentAssignees.map((assignee) => (
        <div key={assignee.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xs">
                {(assignee.name || assignee.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-900">{assignee.name || assignee.email}</span>
          </div>
          <button
            onClick={() => handleRemoveAssignee(assignee.id)}
            className="text-gray-400 hover:text-red-600 p-1"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Assignee Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="text-sm text-gray-500">Add assignees...</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* User List */}
            <div className="max-h-32 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddAssignee(user)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{user.name || user.email}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchQuery ? 'No users found' : 'No more users available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function TicketViewModal({
  isOpen,
  onClose,
  ticket,
  onEdit,
  currentUserId,
  projectUsers = []
}: TicketViewModalProps) {
  // Comment form state
  const [newComment, setNewComment] = useState('');
  
  // Local ticket state for optimistic updates
  const [localTicket, setLocalTicket] = useState<Ticket | null>(null);
  
  // Use local ticket if available, otherwise use prop
  const displayTicket = localTicket || ticket;
  
  // Sync local state with prop when ticket changes
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  // Fetch ticket updates if ticket exists
  const { data: ticketUpdates = [], isLoading: updatesLoading } = trpc.ticketUpdate.getByTicket.useQuery(
    { ticketId: displayTicket?.id || '' },
    { enabled: !!displayTicket?.id }
  );

  // Fetch comments if ticket exists
  const { data: comments = [], isLoading: commentsLoading } = trpc.ticket.getComments.useQuery(
    { ticketId: displayTicket?.id || '' },
    { enabled: !!displayTicket?.id }
  );

  // Add comment mutation
  const utils = trpc.useUtils();
  const addComment = trpc.ticket.addComment.useMutation({
    onSuccess: () => {
      utils.ticket.getComments.invalidate({ ticketId: displayTicket?.id || '' });
      utils.audit.getByProject.invalidate();
      setNewComment('');
    },
  });

  // Auto-save mutations with optimistic updates
  const updateTicket = trpc.ticket.update.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.ticket.getProjectTickets.cancel();
      
      // Snapshot previous value for rollback
      return { previousLocalTicket: localTicket };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLocalTicket) {
        setLocalTicket(context.previousLocalTicket);
      }
    },
    onSettled: () => {
      // Always refetch after success or error
      utils.ticket.getProjectTickets.invalidate();
      utils.audit.getByProject.invalidate();
      utils.ticketUpdate.getByProject.invalidate();
      utils.ticketUpdate.getByTicket.invalidate();
    },
  });

  // Debounce ref for auto-save
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const handleFieldUpdate = useCallback((field: string, value: any) => {
    if (!currentUserId || !displayTicket) return;

    // Update local state immediately for optimistic update
    if (localTicket) {
      const updatedTicket = { ...localTicket, [field]: value };
      setLocalTicket(updatedTicket);
    }

    // Clear existing timeout for this field
    if (debounceTimeouts.current[field]) {
      clearTimeout(debounceTimeouts.current[field]);
    }

    // Set new timeout for this field
    debounceTimeouts.current[field] = setTimeout(() => {
      updateTicket.mutate({
        id: displayTicket.id,
        [field]: value,
        userId: currentUserId,
      });
    }, 500); // 500ms debounce
  }, [currentUserId, displayTicket, localTicket, updateTicket]);

  const handleAssigneeUpdate = useCallback((assigneeIds: string[]) => {
    if (!currentUserId || !displayTicket) return;

    // Update local state immediately for optimistic update
    if (localTicket) {
      const updatedAssignees = assigneeIds.map(id => ({
        user: projectUsers.find(u => u.id === id) || { id, name: null, email: '' }
      }));
      const updatedTicket = { ...localTicket, assignees: updatedAssignees };
      setLocalTicket(updatedTicket);
    }

    // No debouncing for assignees - immediate update
    updateTicket.mutate({
      id: displayTicket.id,
      assigneeIds,
      userId: currentUserId,
    });
  }, [currentUserId, displayTicket, localTicket, projectUsers, updateTicket]);

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !displayTicket?.id || !currentUserId) return;

    addComment.mutate({
      ticketId: displayTicket.id,
      userId: currentUserId,
      content: newComment.trim(),
    });
  };

  if (!isOpen || !displayTicket) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPriority = (priority: string | null) => {
    if (!priority) return 'None';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatStatus = (status: string | null) => {
    const statusMap: Record<string, string> = {
      'todo': 'To Do',
      'in_progress': 'In Progress',
      'done': 'Done'
    };
    return status ? statusMap[status] || status : 'To Do';
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={displayTicket.name}
              onChange={(e) => handleFieldUpdate('name', e.target.value)}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded px-2 py-1 -mx-2 -my-1 flex-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Description</h2>
              <textarea
                value={displayTicket.description || ''}
                onChange={(e) => handleFieldUpdate('description', e.target.value)}
                placeholder="Add a description..."
                className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white resize-none"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Activity Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Activity</h2>
              
              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Comments ({comments.length})
                </h3>
                
                <div className="space-y-4">
                  {/* Add Comment */}
                  {currentUserId && (
                    <div className="flex space-x-3 pb-4 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-xs">
                          {currentUserId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleCommentSubmit();
                            }
                          }}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={handleCommentSubmit}
                            disabled={!newComment.trim() || addComment.isPending}
                            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {addComment.isPending ? 'Adding...' : 'Comment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {(comment.user.name || comment.user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {comment.user.name || comment.user.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>

              {/* Update History */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  Update History ({ticketUpdates.length})
                </h3>
                
                {updatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : ticketUpdates.length > 0 ? (
                  <div className="space-y-3">
                    {ticketUpdates.map((update) => (
                      <div key={update.id} className="flex items-start space-x-3 text-sm">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900">
                            <span className="font-medium">{update.user.name || update.user.email}</span>
                            {' '}{update.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(update.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No updates yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
                <select
                  value={displayTicket.ticketStatus || 'todo'}
                  onChange={(e) => {
                    // Immediate update for dropdowns
                    if (!currentUserId || !displayTicket) return;
                    
                    // Update local state immediately
                    if (localTicket) {
                      const updatedTicket = { ...localTicket, ticketStatus: e.target.value };
                      setLocalTicket(updatedTicket);
                    }
                    
                    updateTicket.mutate({
                      id: displayTicket.id,
                      ticketStatus: e.target.value as 'todo' | 'in_progress' | 'done',
                      userId: currentUserId,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Priority</h3>
                <select
                  value={displayTicket.priority || ''}
                  onChange={(e) => {
                    // Immediate update for dropdowns
                    if (!currentUserId || !displayTicket) return;
                    
                    // Update local state immediately
                    if (localTicket) {
                      const updatedTicket = { ...localTicket, priority: e.target.value || null };
                      setLocalTicket(updatedTicket);
                    }
                    
                    updateTicket.mutate({
                      id: displayTicket.id,
                      priority: (e.target.value as 'high' | 'medium' | 'low') || null,
                      userId: currentUserId,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {/* Assignees */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assignees</h3>
                <AssigneeSelector
                  currentAssignees={displayTicket.assignees.map(a => a.user)}
                  availableUsers={projectUsers}
                  onAssigneesChange={(assigneeIds) => handleAssigneeUpdate(assigneeIds)}
                />
              </div>

              {/* Creator */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Creator</h3>
                {displayTicket.creator ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(displayTicket.creator.name || displayTicket.creator.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">{displayTicket.creator.name || displayTicket.creator.email}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unknown</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Due Date</h3>
                <input
                  type="date"
                  value={displayTicket.dueDate ? new Date(displayTicket.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    // Immediate update for date picker
                    if (!currentUserId || !displayTicket) return;
                    
                    // Update local state immediately
                    if (localTicket) {
                      const updatedTicket = { ...localTicket, dueDate: e.target.value ? new Date(e.target.value) : null };
                      setLocalTicket(updatedTicket);
                    }
                    
                    updateTicket.mutate({
                      id: displayTicket.id,
                      dueDate: e.target.value ? e.target.value : undefined,
                      userId: currentUserId,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* GitHub URL */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">GitHub URL</h3>
                <input
                  type="url"
                  value={displayTicket.githubUrl || ''}
                  onChange={(e) => handleFieldUpdate('githubUrl', e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
                {displayTicket.githubUrl && (
                  <a
                    href={displayTicket.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View on GitHub
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Created */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Created</h3>
                <p className="text-sm text-gray-900">
                  {new Date(displayTicket.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
