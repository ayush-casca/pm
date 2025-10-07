'use client';

import { useState } from 'react';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ArrowPathIcon
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
  creatorStatus: string | null;
  dueDate: Date | null;
  createdAt: Date;
  assignees: {
    user: User;
  }[];
  creator?: User | null;
  citations?: string | null;
}

interface Transcript {
  id: string;
  name: string;
  content: string;
  processingStatus: string;
  aiAnalysis?: string | null;
  createdAt: Date;
  uploader: User;
}

interface ExpandableTranscriptListProps {
  transcripts: Transcript[];
  pendingTickets: Ticket[];
  onView: (transcript: Transcript) => void;
  onReprocess: (transcriptId: string) => void;
  onDelete: (transcriptId: string) => void;
  onApproveTicket: (ticketId: string) => void;
  onRejectTicket: (ticketId: string) => void;
  onBulkApproveTickets: (ticketIds: string[]) => void;
  onBulkRejectTickets: (ticketIds: string[]) => void;
  isLoading: boolean;
}

export function ExpandableTranscriptList({
  transcripts,
  pendingTickets,
  onView,
  onReprocess,
  onDelete,
  onApproveTicket,
  onRejectTicket,
  onBulkApproveTickets,
  onBulkRejectTickets,
  isLoading
}: ExpandableTranscriptListProps) {
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  const toggleExpanded = (transcriptId: string) => {
    const newExpanded = new Set(expandedTranscripts);
    if (newExpanded.has(transcriptId)) {
      newExpanded.delete(transcriptId);
    } else {
      newExpanded.add(transcriptId);
    }
    setExpandedTranscripts(newExpanded);
  };

  const toggleTicketSelection = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const getTicketsForTranscript = (transcriptId: string) => {
    // pendingTickets now contains ALL transcript tickets (pending, approved, rejected)
    return pendingTickets.filter(ticket => ticket.transcriptId === transcriptId);
  };

  const parseCitations = (citationsJson: string | null) => {
    if (!citationsJson) return [];
    try {
      return JSON.parse(citationsJson);
    } catch {
      return [];
    }
  };

  const formatTimestamp = (timestamp: string) => {
    // If timestamp is in format "12:33", return as is
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (timeRegex.test(timestamp)) {
      return timestamp;
    }
    // Otherwise try to parse as date
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const CompactTicket = ({ ticket, showActions = false }: { ticket: Ticket, showActions?: boolean }) => {
    const citations = parseCitations(ticket.citations);
    const mainCitation = citations[0];

    return (
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {ticket.name}
            </span>
            {ticket.priority && (
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                ticket.priority === 'high' 
                  ? 'bg-red-100 text-red-800'
                  : ticket.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {ticket.priority}
              </span>
            )}
            {mainCitation?.timestamp && (
              <span className="text-xs text-gray-500">
                @{formatTimestamp(mainCitation.timestamp)}
              </span>
            )}
          </div>
          {mainCitation?.text && (
            <div className="text-xs text-gray-600 italic mt-1 truncate">
              "{mainCitation.text.substring(0, 80)}..."
            </div>
          )}
        </div>
        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onApproveTicket(ticket.id)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Approve"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRejectTicket(ticket.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Reject"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const FullTicketCard = ({ ticket }: { ticket: Ticket }) => {
    const citations = parseCitations(ticket.citations);
    const isSelected = selectedTickets.has(ticket.id);

    return (
      <div className={`p-4 bg-white border rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTicketSelection(ticket.id)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">{ticket.name}</h4>
              {ticket.description && (
                <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
              )}
              
              {/* Citations */}
              {citations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h5 className="text-xs font-medium text-gray-700">Citations:</h5>
                  {citations.map((citation: any, index: number) => (
                    <div key={index} className="bg-blue-50 border-l-4 border-blue-200 p-2 rounded-r">
                      <div className="flex items-center justify-between text-xs text-blue-800 mb-1">
                        <span className="font-medium">Source Quote</span>
                        {citation.timestamp && (
                          <span>@{formatTimestamp(citation.timestamp)}</span>
                        )}
                      </div>
                      <blockquote className="text-sm text-blue-900 italic">
                        "{citation.text}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              )}

              {/* Assignees & Priority */}
              <div className="flex items-center space-x-4 mt-3">
                {ticket.assignees.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {ticket.assignees[0].user.name || ticket.assignees[0].user.email}
                    </span>
                  </div>
                )}
                {ticket.priority && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    ticket.priority === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : ticket.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {ticket.priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onApproveTicket(ticket.id)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => onRejectTicket(ticket.id)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading transcripts...</p>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No transcripts yet</h3>
        <p className="mt-1 text-sm text-gray-500">Upload your first transcript to get started.</p>
      </div>
    );
  }

  // Group transcripts by processing status
  const processingTranscripts = transcripts.filter(t => t.processingStatus === 'processing');
  const completedTranscripts = transcripts.filter(t => t.processingStatus === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Transcripts ({transcripts.length})
        </h2>
        
        {/* Bulk Actions */}
        {selectedTickets.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedTickets.size} selected
            </span>
            <button
              onClick={() => onBulkApproveTickets(Array.from(selectedTickets))}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve All
            </button>
            <button
              onClick={() => onBulkRejectTickets(Array.from(selectedTickets))}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject All
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Processing Transcripts - Auto-expanded */}
        {processingTranscripts.map((transcript) => (
          <div key={transcript.id} className="bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{transcript.name}</h3>
                  <p className="text-sm text-blue-600">Analyzing with AI...</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(transcript.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Completed Transcripts - Expandable */}
        {completedTranscripts.map((transcript) => {
          const isExpanded = expandedTranscripts.has(transcript.id);
          const transcriptTickets = getTicketsForTranscript(transcript.id);
          const pendingCount = transcriptTickets.filter(t => t.creatorStatus === 'pending').length;
          const approvedCount = transcriptTickets.filter(t => t.creatorStatus === 'approved').length;
          const rejectedCount = transcriptTickets.filter(t => t.creatorStatus === 'rejected').length;

          return (
            <div key={transcript.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleExpanded(transcript.id)}
                    className="flex items-center space-x-3 flex-1 text-left hover:bg-gray-50 transition-colors rounded p-2 -m-2"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{transcript.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          by {transcript.uploader.name || transcript.uploader.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(transcript.createdAt).toLocaleDateString()}
                        </span>
                        {(pendingCount > 0 || approvedCount > 0 || rejectedCount > 0) && (
                          <div className="flex items-center space-x-2">
                            {pendingCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {pendingCount} pending
                              </span>
                            )}
                            {approvedCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {approvedCount} approved
                              </span>
                            )}
                            {rejectedCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {rejectedCount} rejected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(transcript);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="View transcript"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReprocess(transcript.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Reprocess"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(transcript.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && transcriptTickets.length > 0 && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {/* Pending Tickets - Full Cards */}
                  {transcriptTickets.filter(t => t.creatorStatus === 'pending').length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-800 mb-3 flex items-center">
                        <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                        Pending Review ({transcriptTickets.filter(t => t.creatorStatus === 'pending').length})
                      </h4>
                      <div className="space-y-3">
                        {transcriptTickets
                          .filter(t => t.creatorStatus === 'pending')
                          .map(ticket => (
                            <FullTicketCard key={ticket.id} ticket={ticket} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Approved Tickets - Compact */}
                  {transcriptTickets.filter(t => t.creatorStatus === 'approved').length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Approved ({transcriptTickets.filter(t => t.creatorStatus === 'approved').length})
                      </h4>
                      <div className="space-y-1">
                        {transcriptTickets
                          .filter(t => t.creatorStatus === 'approved')
                          .map(ticket => (
                            <CompactTicket key={ticket.id} ticket={ticket} />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Tickets - Compact */}
                  {transcriptTickets.filter(t => t.creatorStatus === 'rejected').length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Rejected ({transcriptTickets.filter(t => t.creatorStatus === 'rejected').length})
                      </h4>
                      <div className="space-y-1">
                        {transcriptTickets
                          .filter(t => t.creatorStatus === 'rejected')
                          .map(ticket => (
                            <CompactTicket key={ticket.id} ticket={ticket} />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
