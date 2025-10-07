'use client';

import { useState } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Transcript {
  id: string;
  name: string;
}

interface PendingTicket {
  id: string;
  name: string;
  description: string | null;
  priority: string | null;
  createdAt: Date;
  assignees: {
    user: User;
  }[];
  creator?: User | null;
  transcript?: Transcript | null;
}

interface TicketReviewProps {
  pendingTickets: PendingTicket[];
  onApprove: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
  onBulkApprove: (ticketIds: string[]) => void;
  onBulkReject: (ticketIds: string[]) => void;
  isLoading: boolean;
}

export function TicketReview({ 
  pendingTickets, 
  onApprove, 
  onReject, 
  onBulkApprove, 
  onBulkReject,
  isLoading 
}: TicketReviewProps) {
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedTickets.size === pendingTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(pendingTickets.map(t => t.id)));
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleBulkApprove = () => {
    if (selectedTickets.size === 0) return;
    onBulkApprove(Array.from(selectedTickets));
    setSelectedTickets(new Set());
  };

  const handleBulkReject = () => {
    if (selectedTickets.size === 0) return;
    onBulkReject(Array.from(selectedTickets));
    setSelectedTickets(new Set());
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            High
          </div>
        );
      case 'medium':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Medium
          </div>
        );
      case 'low':
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Low
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pendingTickets.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-500">No pending tickets to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTickets.size === pendingTickets.length && pendingTickets.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Select all ({pendingTickets.length} tickets)
              </span>
            </label>
            
            {selectedTickets.size > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {selectedTickets.size} selected
              </span>
            )}
          </div>

          {selectedTickets.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkApprove}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Approve ({selectedTickets.size})
              </button>
              <button
                onClick={handleBulkReject}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Reject ({selectedTickets.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Tickets List */}
      <div className="space-y-3">
        {pendingTickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`bg-white rounded-lg border transition-colors ${
              selectedTickets.has(ticket.id) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedTickets.has(ticket.id)}
                  onChange={() => handleSelectTicket(ticket.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {ticket.name}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        {ticket.transcript && (
                          <>
                            <span>From: {ticket.transcript.name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>Generated {formatDate(ticket.createdAt)}</span>
                        {ticket.priority && (
                          <>
                            <span>•</span>
                            {getPriorityBadge(ticket.priority)}
                          </>
                        )}
                      </div>

                      {ticket.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}

                      {/* Suggested Assignees */}
                      {ticket.assignees.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Suggested for:</span>
                          <div className="flex items-center space-x-2">
                            {ticket.assignees.map((assignee) => (
                              <div
                                key={assignee.user.id}
                                className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
                              >
                                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-xs">
                                    {(assignee.user.name || assignee.user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-700">
                                  {assignee.user.name || assignee.user.email}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Individual Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onApprove(ticket.id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve ticket"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onReject(ticket.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject ticket"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
