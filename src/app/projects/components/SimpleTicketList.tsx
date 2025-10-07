'use client';

import { 
  CheckIcon, 
  PencilIcon, 
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

interface SimpleTicketListProps {
  tickets: Ticket[];
  onUpdateTicket: (ticketId: string, updates: any) => void;
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  isLoading: boolean;
}

export function SimpleTicketList({ 
  tickets, 
  onUpdateTicket, 
  onEditTicket, 
  onViewTicket,
  onDeleteTicket,
  isLoading 
}: SimpleTicketListProps) {

  // Group tickets by status
  const todoTickets = tickets.filter(t => t.ticketStatus === 'todo' || !t.ticketStatus);
  const inProgressTickets = tickets.filter(t => t.ticketStatus === 'in_progress');
  const doneTickets = tickets.filter(t => t.ticketStatus === 'done');

  const handleToggleComplete = (ticket: Ticket) => {
    const newStatus = ticket.ticketStatus === 'done' ? 'todo' : 'done';
    onUpdateTicket(ticket.id, { ticketStatus: newStatus });
  };


  const isQuickTicket = (ticket: Ticket) => {
    // Consider it a "quick ticket" if it has minimal details
    return !ticket.description && !ticket.priority && !ticket.dueDate;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const TicketRow = ({ ticket, showCompleted = false }: { ticket: Ticket, showCompleted?: boolean }) => {
    const isCompleted = ticket.ticketStatus === 'done';
    const isQuick = isQuickTicket(ticket);

    return (
      <div 
        className={`group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
          isCompleted && !showCompleted ? 'opacity-60' : ''
        }`}
        onClick={() => onViewTicket(ticket)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete(ticket);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isCompleted && <CheckIcon className="w-3 h-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span 
              className={`text-sm font-medium ${
                isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {ticket.name}
            </span>
            
            {/* Quick indicators for detailed tickets */}
            {!isQuick && (
              <div className="flex items-center space-x-1">
                {ticket.priority === 'high' && (
                  <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
                )}
                {ticket.dueDate && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {formatDate(ticket.dueDate)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Assignees */}
          {ticket.assignees.length > 0 && (
            <div className="flex items-center mt-1 space-x-1">
              <UserIcon className="w-3 h-3 text-gray-400" />
              <div className="flex -space-x-1">
                {ticket.assignees.slice(0, 2).map((assignee) => (
                  <div
                    key={assignee.user.id}
                    className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border border-white"
                    title={assignee.user.name || assignee.user.email}
                  >
                    <span className="text-white font-medium text-xs">
                      {(assignee.user.name || assignee.user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {ticket.assignees.length > 2 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{ticket.assignees.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTicket(ticket);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit ticket"
          >
            <PencilIcon className="w-4 h-4" />
          </button>

          {onDeleteTicket && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTicket(ticket.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
              title="Delete"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* To Do Section */}
      {todoTickets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            To Do
            <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
              {todoTickets.length}
            </span>
          </h3>
          <div className="space-y-1">
            {todoTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      {inProgressTickets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            In Progress
            <span className="ml-2 bg-yellow-200 text-yellow-700 px-2 py-1 rounded-full text-xs">
              {inProgressTickets.length}
            </span>
          </h3>
          <div className="space-y-1">
            {inProgressTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Done Section */}
      {doneTickets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            Done
            <span className="ml-2 bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs">
              {doneTickets.length}
            </span>
          </h3>
          <div className="space-y-1">
            {doneTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} showCompleted />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No tasks yet. Add one above to get started!</p>
        </div>
      )}
    </div>
  );
}
