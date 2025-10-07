'use client';

import { PencilIcon, CalendarIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

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

interface TicketCardProps {
  ticket: Ticket;
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onEditTicket, onViewTicket }: TicketCardProps) {
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

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => onViewTicket(ticket)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 mr-2">
          {ticket.name}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditTicket(ticket);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {ticket.description}
        </p>
      )}

      {/* Priority */}
      {ticket.priority && (
        <div className="mb-3">
          {getPriorityBadge(ticket.priority)}
        </div>
      )}

      {/* Due Date */}
      {ticket.dueDate && (
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <CalendarIcon className="w-3 h-3 mr-1" />
          {formatDate(ticket.dueDate)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-2">
          {ticket.assignees.length === 0 ? (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">?</span>
            </div>
          ) : (
            <>
              {ticket.assignees.slice(0, 3).map((assignee) => (
                <div
                  key={assignee.user.id}
                  className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white"
                  title={assignee.user.name || assignee.user.email}
                >
                  <span className="text-white font-medium text-xs">
                    {(assignee.user.name || assignee.user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {ticket.assignees.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-gray-600 font-medium text-xs">
                    +{ticket.assignees.length - 3}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Created date */}
        <span className="text-xs text-gray-400">
          {formatDate(ticket.createdAt)}
        </span>
      </div>
    </div>
  );
}
