'use client';

import { TranscriptUpload } from './TranscriptUpload';
import { ExpandableTranscriptList } from './ExpandableTranscriptList';

interface TranscriptsTabProps {
  transcripts: any[];
  transcriptTickets: any[];
  onUploadTranscript: (name: string, content: string) => void;
  onViewTranscript: (transcript: any) => void;
  onReprocessTranscript: (transcriptId: string) => void;
  onDeleteTranscript: (transcriptId: string) => void;
  onApproveTicket: (ticketId: string) => void;
  onRejectTicket: (ticketId: string) => void;
  onBulkApproveTickets: (ticketIds: string[]) => void;
  onBulkRejectTickets: (ticketIds: string[]) => void;
  isUploadLoading: boolean;
  isTranscriptsLoading: boolean;
}

export function TranscriptsTab({
  transcripts,
  transcriptTickets,
  onUploadTranscript,
  onViewTranscript,
  onReprocessTranscript,
  onDeleteTranscript,
  onApproveTicket,
  onRejectTicket,
  onBulkApproveTickets,
  onBulkRejectTickets,
  isUploadLoading,
  isTranscriptsLoading,
}: TranscriptsTabProps) {
  return (
    <div className="space-y-6">
      {/* Upload Zone - Always at top */}
      <TranscriptUpload
        onUpload={onUploadTranscript}
        isLoading={isUploadLoading}
      />
      
      {/* Expandable Transcripts with embedded tickets */}
      <ExpandableTranscriptList
        transcripts={transcripts}
        pendingTickets={transcriptTickets}
        onView={onViewTranscript}
        onReprocess={onReprocessTranscript}
        onDelete={onDeleteTranscript}
        onApproveTicket={onApproveTicket}
        onRejectTicket={onRejectTicket}
        onBulkApproveTickets={onBulkApproveTickets}
        onBulkRejectTickets={onBulkRejectTickets}
        isLoading={isTranscriptsLoading}
      />
    </div>
  );
}
