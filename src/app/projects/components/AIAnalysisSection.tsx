'use client';

import { useState } from 'react';
import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface AIAnalysisSectionProps {
  item: {
    id: string;
    aiAnalysis: string | null;
    aiAnalysisStatus: string | null;
    diff: string | null;
  };
  onAnalyze: (id: string) => void;
  isAnalyzing: boolean;
  type: 'commit' | 'pr';
  currentUserId?: string;
  projectId?: string;
}

interface Analysis {
  summary: string;
  impact: string[];
  complexity: 'low' | 'medium' | 'high';
  businessValue?: string;
  suggestedTickets?: string[];
  codePatterns?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  overallGoal?: string;
  testingNeeded?: boolean;
  deploymentRisk?: 'low' | 'medium' | 'high';
  estimatedReviewTime?: string;
  // NEW: Ticket matching
  potentialMatches?: Array<{
    ticketId: string;
    ticketTitle: string;
    confidence: number;
    reasoning: string;
  }>;
  suggestedNewTicket?: {
    title: string;
    description: string;
    confidence: number;
    reasoning: string;
  };
}

export default function AIAnalysisSection({ 
  item, 
  onAnalyze, 
  isAnalyzing, 
  type,
  currentUserId,
  projectId
}: AIAnalysisSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const utils = trpc.useUtils();

  // Mutations for AI suggestions
  const linkCommitToSuggestedTicket = trpc.github.linkCommitToSuggestedTicket.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      if (projectId) {
        utils.github.getProjectCommits.invalidate({ projectId });
        utils.ticket.getProjectTickets.invalidate({ projectId });
      }
    },
    onError: (error) => {
      console.error('Failed to link commit to suggested ticket:', error);
    },
  });

  const dismissCommitSuggestion = trpc.github.dismissCommitSuggestion.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      if (projectId) {
        utils.github.getProjectCommits.invalidate({ projectId });
        utils.ticket.getProjectTickets.invalidate({ projectId });
      }
    },
    onError: (error) => {
      console.error('Failed to dismiss commit suggestion:', error);
    },
  });

  // Handler functions for AI suggestions
  const handleLinkSuggestion = (ticketId: string, ticketTitle: string) => {
    if (!currentUserId) {
      console.error('No current user ID available');
      return;
    }

    console.log('🔗 Linking commit to suggested ticket:', {
      commitId: item.id,
      ticketId,
      ticketTitle,
      userId: currentUserId
    });

    linkCommitToSuggestedTicket.mutate({
      commitId: item.id,
      ticketId,
      userId: currentUserId,
    });
  };

  const handleDismissSuggestion = (ticketId: string, ticketTitle: string) => {
    if (!currentUserId) {
      console.error('No current user ID available');
      return;
    }

    console.log('❌ Dismissing AI suggestion:', {
      commitId: item.id,
      ticketId,
      ticketTitle,
      userId: currentUserId
    });

    dismissCommitSuggestion.mutate({
      ticketId,
      commitId: item.id,
      userId: currentUserId,
    });
  };

  const parseAIAnalysis = (aiAnalysis: string | null): Analysis | null => {
    if (!aiAnalysis) return null;
    try {
      return JSON.parse(aiAnalysis) as Analysis;
    } catch {
      return null;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const analysis = parseAIAnalysis(item.aiAnalysis);
  const isAutoAnalyzing = item.aiAnalysisStatus === 'analyzing';
  const hasFailed = item.aiAnalysisStatus === 'failed';

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {isAutoAnalyzing ? (
        // Show "Analyzing..." state for webhook auto-analysis
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div className="flex items-center space-x-2 text-sm text-yellow-700">
            <SparklesIcon className="w-4 h-4 animate-spin" />
            <span className="font-medium">🔄 AI is analyzing this {type}...</span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            Our AI is processing the changes and will provide insights shortly. This usually takes 10-30 seconds.
          </p>
        </div>
      ) : hasFailed ? (
        // Show failed state with retry option
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-red-700">
              <InformationCircleIcon className="w-4 h-4" />
              <span className="font-medium">❌ AI analysis failed</span>
            </div>
            <button
              onClick={() => onAnalyze(item.id)}
              disabled={isAnalyzing}
              className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
            >
              {isAnalyzing ? 'Retrying...' : 'Retry Analysis'}
            </button>
          </div>
          <p className="text-xs text-red-600 mt-1">
            The automatic analysis encountered an error. You can try again manually.
          </p>
        </div>
      ) : analysis ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">AI Analysis</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(analysis.complexity)}`}>
                {analysis.complexity} complexity
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(analysis.riskLevel)}`}>
                {analysis.riskLevel} risk
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {expanded ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {/* Summary - Always visible */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r">
            <p className="text-sm text-blue-900 font-medium">
              💡 {analysis.summary}
            </p>
          </div>
          
          {/* PR Goal */}
          {type === 'pr' && analysis.overallGoal && (
            <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-3 rounded-r">
              <p className="text-sm text-green-900">
                <strong>🎯 Goal:</strong> {analysis.overallGoal}
              </p>
            </div>
          )}
          
          {/* Expanded Details */}
          {expanded && (
            <div className="space-y-3 bg-gray-50 p-3 rounded">
              {/* Impact */}
              {analysis.impact && analysis.impact.length > 0 && (
                <div className="bg-white p-2 rounded border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">📂 Files/Components Affected:</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.impact.map((item: string, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Value */}
              {analysis.businessValue && (
                <div className="bg-white p-2 rounded border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">💼 Business Value:</h4>
                  <p className="text-sm text-gray-700">{analysis.businessValue}</p>
                </div>
              )}

              {/* Code Patterns */}
              {analysis.codePatterns && analysis.codePatterns.length > 0 && (
                <div className="bg-white p-2 rounded border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">🔧 Code Patterns:</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.codePatterns.map((pattern: string, idx: number) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PR-specific details */}
              {type === 'pr' && (analysis.testingNeeded !== undefined || analysis.estimatedReviewTime) && (
                <div className="bg-white p-2 rounded border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">📋 Review Details:</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    {analysis.testingNeeded !== undefined && (
                      <div>
                        <strong>Testing Required:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          analysis.testingNeeded 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {analysis.testingNeeded ? '⚠️ Yes' : '✅ No'}
                        </span>
                      </div>
                    )}
                    {analysis.estimatedReviewTime && (
                      <div>
                        <strong>Estimated Review Time:</strong> 
                        <span className="ml-2 text-gray-600">{analysis.estimatedReviewTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested Follow-ups */}
              {analysis.suggestedTickets && analysis.suggestedTickets.length > 0 && (
                <div className="bg-white p-2 rounded border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">📝 Suggested Follow-up Tickets:</h4>
                  <ul className="space-y-1">
                    {analysis.suggestedTickets.map((ticket: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="text-gray-700">{ticket}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NEW: Potential Matches Section */}
              {analysis.potentialMatches && analysis.potentialMatches.length > 0 && (
                <div className="bg-white p-3 rounded border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">🎯 Potential Ticket Matches:</h4>
                  <div className="space-y-2">
                    {analysis.potentialMatches.map((match, idx) => (
                      <div key={idx} className="bg-orange-50 border border-orange-200 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-orange-900">
                              {match.ticketTitle}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              match.confidence >= 0.8 
                                ? 'bg-green-100 text-green-800' 
                                : match.confidence >= 0.6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {Math.round(match.confidence * 100)}% match
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => handleLinkSuggestion(match.ticketId, match.ticketTitle)}
                              disabled={linkCommitToSuggestedTicket.isPending || !currentUserId}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {linkCommitToSuggestedTicket.isPending ? '🔄' : '✅'} Link
                            </button>
                            <button 
                              onClick={() => handleDismissSuggestion(match.ticketId, match.ticketTitle)}
                              disabled={dismissCommitSuggestion.isPending || !currentUserId}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {dismissCommitSuggestion.isPending ? '🔄' : '❌'} Dismiss
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-orange-700">{match.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      ) : item.diff ? (
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <button
            onClick={() => onAnalyze(item.id)}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 text-sm text-purple-700 hover:text-purple-900 disabled:opacity-50 font-medium"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>
              {isAnalyzing ? '🔄 Analyzing with AI...' : '✨ Generate AI Analysis'}
            </span>
          </button>
          <p className="text-xs text-purple-600 mt-1">
            Click to get AI insights about this {type}'s impact and complexity
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <InformationCircleIcon className="w-4 h-4" />
            <span>No diff available for AI analysis</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This commit doesn't have diff data stored. Diffs are needed for AI analysis.
          </p>
        </div>
      )}
    </div>
  );
}
