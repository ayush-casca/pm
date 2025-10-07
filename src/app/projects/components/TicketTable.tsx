'use client';

import { useState, useMemo } from 'react';
import { 
  PencilIcon, 
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { KanbanBoard } from './KanbanBoard';
import { QuickAddBar } from './QuickAddBar';
import { SimpleTicketList } from './SimpleTicketList';

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
  creator?: User | null;
  assignees: {
    user: User;
  }[];
}

interface TicketTableProps {
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: string) => void;
  onUpdateTicket: (ticketId: string, updates: any) => void;
  onCreateTicket: () => void;
  onCreateQuickTicket: (name: string, assigneeId?: string) => void;
  projectUsers: User[];
  isLoading: boolean;
}

export function TicketTable({ tickets, onEditTicket, onViewTicket, onUpdateTicketStatus, onUpdateTicket, onCreateTicket, onCreateQuickTicket, projectUsers, isLoading }: TicketTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority' | 'ticketStatus'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'quick'>('quick');

  // Get unique assignees for filter dropdown
  const uniqueAssignees = useMemo(() => {
    const assigneeMap = new Map();
    tickets.forEach(ticket => {
      ticket.assignees.forEach(assignee => {
        if (!assigneeMap.has(assignee.user.id)) {
          assigneeMap.set(assignee.user.id, assignee.user);
        }
      });
    });
    return Array.from(assigneeMap.values());
  }, [tickets]);

  // Handle column sorting
  const handleSort = (column: 'createdAt' | 'dueDate' | 'priority' | 'ticketStatus') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get sort icon for column headers
  const getSortIcon = (column: 'createdAt' | 'dueDate' | 'priority' | 'ticketStatus') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  // Handle quick ticket creation
  const handleQuickAdd = (text: string, assigneeId?: string) => {
    onCreateQuickTicket(text, assigneeId);
  };

  const filteredAndSortedTickets = useMemo(() => {
    let filtered = tickets.filter(ticket => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.assignees.some(a => 
          (a.user.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          a.user.email.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (ticket.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ticket.creator?.email.toLowerCase().includes(searchQuery.toLowerCase()));

      // Priority filter
      const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;

      // Status filter
      const statusMatch = statusFilter === 'all' || ticket.ticketStatus === statusFilter;

      // Assignee filter
      const assigneeMatch = assigneeFilter === 'all' || 
        ticket.assignees.some(a => a.user.id === assigneeFilter);

      return searchMatch && priorityMatch && statusMatch && assigneeMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'dueDate':
          // Put null due dates at the end
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return sortOrder === 'asc' ? 1 : -1;
          if (!b.dueDate) return sortOrder === 'asc' ? -1 : 1;
          aVal = new Date(a.dueDate).getTime();
          bVal = new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'ticketStatus':
          const statusOrder = { todo: 1, in_progress: 2, done: 3 };
          aVal = statusOrder[a.ticketStatus as keyof typeof statusOrder] || 0;
          bVal = statusOrder[b.ticketStatus as keyof typeof statusOrder] || 0;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [tickets, searchQuery, priorityFilter, statusFilter, assigneeFilter, sortBy, sortOrder]);

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            None
          </span>
        );
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'todo':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">To Do</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>;
      case 'done':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Done</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('quick')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'quick'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListBulletIcon className="w-4 h-4" />
            <span>Quick</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TableCellsIcon className="w-4 h-4" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>Kanban</span>
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search tickets, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Content */}
      {viewMode === 'quick' ? (
        <div className="space-y-4">
          <QuickAddBar
            onAddQuickTicket={handleQuickAdd}
            projectUsers={projectUsers}
            isLoading={isLoading}
          />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <SimpleTicketList
              tickets={filteredAndSortedTickets}
              onUpdateTicket={onUpdateTicket}
              onEditTicket={onEditTicket}
              onViewTicket={onViewTicket}
              isLoading={false}
            />
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="h-[calc(100vh-280px)]">
          <KanbanBoard
            tickets={filteredAndSortedTickets}
            onEditTicket={onEditTicket}
            onViewTicket={onViewTicket}
            onUpdateTicketStatus={onUpdateTicketStatus}
            onCreateTicket={onCreateTicket}
            isLoading={false}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredAndSortedTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tickets found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ticketStatus')}
                  >
                    Status {getSortIcon('ticketStatus')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('priority')}
                  >
                    Priority {getSortIcon('priority')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date {getSortIcon('dueDate')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created {getSortIcon('createdAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewTicket(ticket)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                        {ticket.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {ticket.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.ticketStatus)}
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignees.length === 0 ? (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      ) : (
                        <div className="relative group">
                          <div className="flex -space-x-2">
                            {ticket.assignees.slice(0, 4).map((assignee) => (
                              <div
                                key={assignee.user.id}
                                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white"
                              >
                                <span className="text-white font-medium text-xs">
                                  {(assignee.user.name || assignee.user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {ticket.assignees.length > 4 && (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-gray-600 font-medium text-xs">
                                  +{ticket.assignees.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 left-0 top-10 w-72 p-4 bg-gray-800 text-white text-sm rounded-lg shadow-2xl pointer-events-none">
                            <div className="space-y-3">
                              {ticket.assignees.map((assignee) => (
                                <div key={assignee.user.id} className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-medium text-xs">
                                      {(assignee.user.name || assignee.user.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-white">{assignee.user.name || 'No name'}</div>
                                    <div className="text-gray-300 text-xs">{assignee.user.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Arrow */}
                            <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.creator ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white font-medium text-xs">
                              {(ticket.creator.name || ticket.creator.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.creator.name || 'No name'}
                            </div>
                            <div className="text-xs text-gray-500">{ticket.creator.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.dueDate ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No due date</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTicket(ticket);
                        }}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit ticket"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
