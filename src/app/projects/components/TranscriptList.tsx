'use client';

import { useState } from 'react';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Transcript {
  id: string;
  name: string;
  content: string;
  aiAnalysis: string | null;
  processingStatus: string;
  createdAt: Date;
  updatedAt: Date;
  uploader: User;
  tickets?: any[]; // Generated tickets
}

interface TranscriptListProps {
  transcripts: Transcript[];
  onView: (transcript: Transcript) => void;
  onReprocess: (transcriptId: string) => void;
  onDelete: (transcriptId: string) => void;
  isLoading: boolean;
}

export function TranscriptList({ 
  transcripts, 
  onView, 
  onReprocess, 
  onDelete,
  isLoading 
}: TranscriptListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <CogIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Analysis Complete';
      case 'processing':
        return 'Analyzing...';
      case 'failed':
        return 'Analysis Failed';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transcripts yet</h3>
        <p className="text-gray-500">Upload your first meeting transcript to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transcripts.map((transcript) => (
        <div
          key={transcript.id}
          className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {transcript.name}
                  </h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transcript.processingStatus)}`}>
                    {getStatusIcon(transcript.processingStatus)}
                    <span className="ml-1">{getStatusText(transcript.processingStatus)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>Uploaded by {transcript.uploader.name || transcript.uploader.email}</span>
                  <span>•</span>
                  <span>{formatDate(transcript.createdAt)}</span>
                  <span>•</span>
                  <span>{transcript.content.length.toLocaleString()} characters</span>
                  {transcript.tickets && transcript.tickets.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">
                        {transcript.tickets.length} tickets generated
                      </span>
                    </>
                  )}
                </div>

                {/* Preview */}
                <div className="text-sm text-gray-600">
                  <p className="line-clamp-2">
                    {transcript.content.substring(0, 200)}
                    {transcript.content.length > 200 && '...'}
                  </p>
                </div>

                {/* AI Analysis Preview */}
                {transcript.aiAnalysis && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis</h4>
                    <p className="text-sm text-blue-700 line-clamp-2">
                      {transcript.aiAnalysis.substring(0, 150)}
                      {transcript.aiAnalysis.length > 150 && '...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onView(transcript)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View details"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                
                {transcript.processingStatus === 'failed' && (
                  <button
                    onClick={() => onReprocess(transcript.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Retry analysis"
                  >
                    <CogIcon className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onDelete(transcript.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete transcript"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === transcript.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Full Content</h4>
                    <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                      {transcript.content}
                    </div>
                  </div>

                  {transcript.aiAnalysis && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis</h4>
                      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 whitespace-pre-wrap">
                        {transcript.aiAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Toggle Expand */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setExpandedId(expandedId === transcript.id ? null : transcript.id)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {expandedId === transcript.id ? 'Show less' : 'Show more'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
