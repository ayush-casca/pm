'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TicketCard } from './TicketCard';
import { PlusIcon } from '@heroicons/react/24/outline';

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

interface KanbanBoardProps {
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: string) => void;
  onCreateTicket: () => void;
  isLoading: boolean;
}

interface SortableTicketCardProps {
  ticket: Ticket;
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
}

function SortableTicketCard({ ticket, onEditTicket, onViewTicket }: SortableTicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <TicketCard ticket={ticket} onEditTicket={onEditTicket} onViewTicket={onViewTicket} />
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  status: string;
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
  onViewTicket: (ticket: Ticket) => void;
  onCreateTicket: () => void;
  count: number;
}

function KanbanColumn({ title, status, tickets, onEditTicket, onViewTicket, onCreateTicket, count }: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({ 
    id: `${status}-column`,
    data: { type: 'column', status }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col h-full bg-gray-50 rounded-lg transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {count}
          </span>
        </div>
        {status === 'todo' && (
          <button
            onClick={onCreateTicket}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Add new ticket"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Column Content - Scrollable */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <SortableTicketCard
              key={ticket.id}
              ticket={ticket}
              onEditTicket={onEditTicket}
              onViewTicket={onViewTicket}
            />
          ))}
        </SortableContext>
        
        {tickets.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ 
  tickets, 
  onEditTicket, 
  onViewTicket,
  onUpdateTicketStatus, 
  onCreateTicket,
  isLoading 
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tickets by status
  const todoTickets = tickets.filter(t => t.ticketStatus === 'todo' || !t.ticketStatus);
  const inProgressTickets = tickets.filter(t => t.ticketStatus === 'in_progress');
  const doneTickets = tickets.filter(t => t.ticketStatus === 'done');

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data?.current;

    // Determine the new status based on where it was dropped
    let newStatus: string;
    
    if (overData?.type === 'column') {
      newStatus = overData.status;
    } else if (overId.endsWith('-column')) {
      newStatus = overId.replace('-column', '');
    } else {
      // Dropped on a ticket, find which column it belongs to
      const overTicket = tickets.find(t => t.id === overId);
      if (overTicket) {
        newStatus = overTicket.ticketStatus || 'todo';
      } else {
        return;
      }
    }

    // Find the ticket being moved
    const ticket = tickets.find(t => t.id === activeId);
    if (ticket && ticket.ticketStatus !== newStatus) {
      onUpdateTicketStatus(activeId, newStatus);
    }
  };

  const activeTicket = activeId ? tickets.find(t => t.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tickets...</div>
      </div>
    );
  }

  const allItems = [
    'todo-column', 'in_progress-column', 'done-column',
    ...tickets.map(t => t.id)
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
        <div className="h-full grid grid-cols-3 gap-6">
          {/* To Do Column */}
          <KanbanColumn
            title="To Do"
            status="todo"
            tickets={todoTickets}
            onEditTicket={onEditTicket}
            onViewTicket={onViewTicket}
            onCreateTicket={onCreateTicket}
            count={todoTickets.length}
          />

          {/* In Progress Column */}
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            tickets={inProgressTickets}
            onEditTicket={onEditTicket}
            onViewTicket={onViewTicket}
            onCreateTicket={onCreateTicket}
            count={inProgressTickets.length}
          />

          {/* Done Column */}
          <KanbanColumn
            title="Done"
            status="done"
            tickets={doneTickets}
            onEditTicket={onEditTicket}
            onViewTicket={onViewTicket}
            onCreateTicket={onCreateTicket}
            count={doneTickets.length}
          />
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-3 scale-105">
            <TicketCard ticket={activeTicket} onEditTicket={() => {}} onViewTicket={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
