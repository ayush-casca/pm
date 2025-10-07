'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
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
  dueDate: Date | null;
  assignees: {
    user: User;
  }[];
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    assigneeIds?: string[];
  }) => void;
  isLoading: boolean;
  projectUsers: User[];
  ticket?: Ticket | null; // For editing
  currentUserId?: string; // For comments
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  projectUsers,
  ticket,
  currentUserId
}: CreateTicketModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const isEditing = !!ticket;

  // Fetch ticket updates if editing
  const { data: ticketUpdates = [], isLoading: updatesLoading } = trpc.ticketUpdate.getByTicket.useQuery(
    { ticketId: ticket?.id || '' },
    { enabled: !!ticket?.id }
  );

  // Fetch comments if editing
  const { data: comments = [], isLoading: commentsLoading } = trpc.ticket.getComments.useQuery(
    { ticketId: ticket?.id || '' },
    { enabled: !!ticket?.id }
  );

  // Add comment mutation
  const utils = trpc.useUtils();
  const addComment = trpc.ticket.addComment.useMutation({
    onSuccess: () => {
      // Invalidate comments to refresh the list
      utils.ticket.getComments.invalidate({ ticketId: ticket?.id || '' });
      utils.audit.getByProject.invalidate();
      setNewComment(''); // Clear the comment form
    },
  });

  // Comment form state
  const [newComment, setNewComment] = useState('');

  // Reset form when modal opens/closes or ticket changes
  useEffect(() => {
    if (isOpen) {
      if (ticket) {
        // Editing mode - populate with existing data
        setName(ticket.name);
        setDescription(ticket.description || '');
        setPriority((ticket.priority as 'high' | 'medium' | 'low') || 'medium');
        setStatus((ticket.ticketStatus as 'todo' | 'in_progress' | 'done') || 'todo');
        setDueDate(ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '');
        setSelectedAssignees(ticket.assignees.map(a => a.user.id));
      } else {
        // Creating mode - reset form
        setName('');
        setDescription('');
        setPriority('medium');
        setStatus('todo');
        setDueDate('');
        setSelectedAssignees([]);
      }
    }
    // Always reset comment form when modal opens/closes
    setNewComment('');
  }, [isOpen, ticket]);

  // Handle escape key to close modal and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name,
      description: description || undefined,
      priority,
      ticketStatus: status,
      dueDate: dueDate || undefined,
      assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
    };

    onSubmit(data);
  };

  const handleCommentSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || !ticket?.id || !currentUserId) return;

    addComment.mutate({
      ticketId: ticket.id,
      userId: currentUserId,
      content: newComment.trim(),
    });
  };

  const handleAssigneeToggle = (userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Enter ticket name..."
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Describe the ticket..."
            />
          </div>

          {/* Priority, Status, and Due Date Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status - only show when editing */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assignees ({selectedAssignees.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {projectUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(user.id)}
                    onChange={() => handleAssigneeToggle(user.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Ticket Updates - Only show when editing */}
          {isEditing && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Status History</h3>
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {updatesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : ticketUpdates.length > 0 ? (
                  <div className="space-y-3">
                    {ticketUpdates.map((update) => (
                      <div key={update.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {update.user.name || update.user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(update.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {update.description}
                          </p>
                          {update.prevStatus !== update.afterStatus && (
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {update.prevStatus === 'none' ? 'Created' : 
                                 update.prevStatus === 'todo' ? 'To Do' :
                                 update.prevStatus === 'in_progress' ? 'In Progress' : 
                                 update.prevStatus === 'done' ? 'Done' : update.prevStatus}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {update.afterStatus === 'todo' ? 'To Do' :
                                 update.afterStatus === 'in_progress' ? 'In Progress' : 
                                 update.afterStatus === 'done' ? 'Done' : update.afterStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No status changes yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comments - Only show when editing */}
          {isEditing && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Comments</h3>
              </div>
              
              {/* Comments List */}
              <div className="max-h-48 overflow-y-auto mb-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-4">
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
                          <div className="flex items-center space-x-2">
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
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No comments yet
                  </p>
                )}
              </div>

              {/* Add Comment Form */}
              {currentUserId && (
                <div className="flex space-x-3">
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
                          handleCommentSubmit(e);
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
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Ticket' : 'Create Ticket')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
