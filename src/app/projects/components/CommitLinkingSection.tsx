'use client';

import { useState } from 'react';
import { ChevronDownIcon, LinkIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface Ticket {
  id: string;
  githubCommitUrl: string | null;
  projectId?: string;
}

interface Commit {
  id: string;
  message: string;
  githubId: string; // SHA
  url: string;
  author: string;
  createdAt: Date;
  additions?: number;
  deletions?: number;
  ticketId?: string | null;
}

interface CommitLinkingSectionProps {
  ticket: Ticket;
  onCommitUrlUpdate: (url: string) => void;
  currentUserId?: string;
}

export default function CommitLinkingSection({ 
  ticket, 
  onCommitUrlUpdate, 
  currentUserId 
}: CommitLinkingSectionProps) {
  const [showCommitSelector, setShowCommitSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingMode, setLinkingMode] = useState<'linked' | 'manual'>('linked');

  const projectId = ticket.projectId || '';
  const utils = trpc.useUtils();

  // Fetch commits for the project
  const { data: commits = [], isLoading } = trpc.github.getProjectCommits.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Find the linked commit by checking if it's linked to this ticket
  const linkedCommit = commits.find(commit => commit.ticketId === ticket.id);
  
  console.log('eeee 🔍 CommitLinkingSection render:', {
    projectId,
    ticketId: ticket.id,
    ticketName: ticket.name,
    totalCommits: commits.length,
    linkedCommit: linkedCommit ? {
      id: linkedCommit.id,
      message: linkedCommit.message.split('\n')[0],
      ticketId: linkedCommit.ticketId
    } : null,
    currentUserId,
    hasCurrentUserId: !!currentUserId
  });

  // Single mutation for both linking and unlinking commits
  const linkCommitToTicket = trpc.github.linkCommitToTicket.useMutation({
    onMutate: async (variables) => {
      const action = variables.ticketId ? 'linking' : 'unlinking';
      console.log(`eeee 🔄 Starting commit ${action}:`, {
        commitId: variables.commitId,
        ticketId: variables.ticketId,
        userId: variables.userId,
        projectId
      });

      // Cancel any outgoing refetches
      await utils.github.getProjectCommits.cancel({ projectId });

      // Snapshot the previous value
      const previousCommits = utils.github.getProjectCommits.getData({ projectId });

      // Optimistically update to the new value
      if (previousCommits) {
        const optimisticCommits = previousCommits.map(commit => {
          if (commit.id === variables.commitId) {
            return {
              ...commit,
              ticketId: variables.ticketId || null
            };
          }
          return commit;
        });
        
        utils.github.getProjectCommits.setData({ projectId }, optimisticCommits);
      }

      // Return a context object with the snapshotted value
      return { previousCommits };
    },
    onSuccess: (data, variables) => {
      setShowCommitSelector(false);
      
      const action = variables.ticketId ? 'linked' : 'unlinked';
      console.log(`eeee ✅ Commit ${action} successfully:`, {
        commitId: variables.commitId,
        ticketId: variables.ticketId,
        returnedData: data
      });
    },
    onError: (error, variables, context) => {
      const action = variables.ticketId ? 'linking' : 'unlinking';
      console.error(`eeee ❌ Failed to ${action} commit:`, {
        error,
        commitId: variables.commitId,
        ticketId: variables.ticketId,
        userId: variables.userId
      });

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCommits) {
        utils.github.getProjectCommits.setData({ projectId }, context.previousCommits);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      utils.github.getProjectCommits.invalidate({ projectId });
    },
  });

  // Filter commits based on search
  const filteredCommits = commits.filter(commit =>
    commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commit.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commit.githubId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommitSelect = (commit: Commit) => {
    console.log('eeee 🎯 handleCommitSelect called:', {
      selectedCommit: {
        id: commit.id,
        message: commit.message.split('\n')[0],
        ticketId: commit.ticketId
      },
      currentLinkedCommit: linkedCommit ? {
        id: linkedCommit.id,
        message: linkedCommit.message.split('\n')[0],
        ticketId: linkedCommit.ticketId
      } : null,
      targetTicketId: ticket.id,
      currentUserId,
      hasCurrentUserId: !!currentUserId
    });

    if (!currentUserId) {
      console.log('eeee ❌ No current user ID, aborting');
      return;
    }

    // If selecting the same commit, do nothing
    if (linkedCommit && linkedCommit.id === commit.id) {
      console.log('eeee ⏭️ Same commit selected, doing nothing');
      setShowCommitSelector(false);
      setSearchQuery('');
      return;
    }

    // If there's already a linked commit, we'll do a smart switch with optimistic updates
    if (linkedCommit) {
      console.log('eeee 🔄 Smart switch: unlink current and link new simultaneously');
      
      // First, optimistically update both commits in the UI
      const currentCommits = utils.github.getProjectCommits.getData({ projectId });
      if (currentCommits) {
        const optimisticCommits = currentCommits.map(c => {
          if (c.id === linkedCommit.id) {
            return { ...c, ticketId: null }; // Unlink current
          } else if (c.id === commit.id) {
            return { ...c, ticketId: ticket.id }; // Link new
          }
          return c;
        });
        utils.github.getProjectCommits.setData({ projectId }, optimisticCommits);
      }

      // Then do the actual unlink → link sequence
      console.log('eeee 📤 Step 1: Unlinking current commit:', {
        commitId: linkedCommit.id,
        commitMessage: linkedCommit.message.split('\n')[0]
      });
      
      linkCommitToTicket.mutate({
        commitId: linkedCommit.id,
        ticketId: undefined, // This will unlink
        userId: currentUserId,
      }, {
        onSuccess: (unlinkData) => {
          console.log('eeee ✅ Step 1 complete, unlink successful:', unlinkData);
          console.log('eeee 📤 Step 2: Linking new commit:', {
            commitId: commit.id,
            commitMessage: commit.message.split('\n')[0],
            ticketId: ticket.id
          });
          
          linkCommitToTicket.mutate({
            commitId: commit.id,
            ticketId: ticket.id,
            userId: currentUserId,
          });
        },
        onError: (unlinkError) => {
          console.error('eeee ❌ Step 1 failed, unlink error:', unlinkError);
          // Rollback the optimistic update
          utils.github.getProjectCommits.invalidate({ projectId });
        }
      });
    } else {
      console.log('eeee 📤 Single-step process: linking new commit (no existing link):', {
        commitId: commit.id,
        commitMessage: commit.message.split('\n')[0],
        ticketId: ticket.id
      });
      
      linkCommitToTicket.mutate({
        commitId: commit.id,
        ticketId: ticket.id,
        userId: currentUserId,
      });
    }

    setShowCommitSelector(false);
    setSearchQuery('');
  };

  const clearCommitUrl = () => {
    onCommitUrlUpdate('');
  };

  const formatCommitMessage = (message: string) => {
    return message.split('\n')[0]; // Get first line only
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Mode Selector */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 border">
          <button
            type="button"
            onClick={() => setLinkingMode('linked')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              linkingMode === 'linked'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔗 Linked
          </button>
          <button
            type="button"
            onClick={() => setLinkingMode('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              linkingMode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Manual
          </button>
        </div>
      </div>

      {linkingMode === 'manual' ? (
        /* Manual URL Input */
        <div>
          <div className="relative">
            <input
              type="url"
              value={ticket.githubCommitUrl || ''}
              onChange={(e) => onCommitUrlUpdate(e.target.value)}
              placeholder="https://github.com/owner/repo/commit/abc123..."
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
            />
            {ticket.githubCommitUrl && (
              <button
                type="button"
                onClick={clearCommitUrl}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {ticket.githubCommitUrl && (
            <a
              href={ticket.githubCommitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <LinkIcon className="w-3 h-3 mr-1" />
              View Commit
            </a>
          )}
        </div>
      ) : (
        /* Commit Selector */
        <div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCommitSelector(!showCommitSelector)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm text-left flex items-center justify-between"
            >
              <span className="flex items-center min-w-0 flex-1">
                <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                {linkedCommit ? (
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {formatCommitMessage(linkedCommit.message)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {linkedCommit.githubId.substring(0, 7)} by {linkedCommit.author}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a commit...</span>
                )}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                showCommitSelector ? 'rotate-180' : ''
              }`} />
            </button>

            {showCommitSelector && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search commits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Loading commits...
                    </div>
                  ) : filteredCommits.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      {searchQuery ? 'No commits match your search' : 'No commits found'}
                    </div>
                  ) : (
                    filteredCommits.map((commit) => (
                      <button
                        key={commit.id}
                        type="button"
                        onClick={() => handleCommitSelect(commit)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <DocumentTextIcon className="w-3 h-3 text-purple-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {formatCommitMessage(commit.message)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="font-mono">{commit.githubId.substring(0, 7)}</span>
                              <span>by {commit.author}</span>
                              <span>{formatDate(commit.createdAt)}</span>
                            </div>
                            {(commit.additions !== undefined || commit.deletions !== undefined) && (
                              <div className="flex items-center space-x-2 mt-1 text-xs">
                                <span className="text-green-600">+{commit.additions || 0}</span>
                                <span className="text-red-600">-{commit.deletions || 0}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {(linkedCommit || ticket.githubCommitUrl) && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <DocumentTextIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {linkedCommit ? (
                      <>
                        <div className="font-medium text-purple-900 truncate">
                          {formatCommitMessage(linkedCommit.message)}
                        </div>
                        <div className="text-xs text-purple-700">
                          {linkedCommit.githubId.substring(0, 7)} by {linkedCommit.author}
                        </div>
                      </>
                    ) : ticket.githubCommitUrl ? (
                      <div className="font-medium text-purple-900 truncate">Custom Commit URL</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <a
                    href={linkedCommit ? linkedCommit.url : ticket.githubCommitUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <LinkIcon className="w-3 h-3 mr-1" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (linkedCommit && currentUserId) {
                        console.log('eeee 🔘 Manual unlink button clicked:', { 
                          commitMessage: linkedCommit.message.split('\n')[0], 
                          commitId: linkedCommit.id,
                          userId: currentUserId,
                          ticketId: ticket.id
                        });
                        linkCommitToTicket.mutate({
                          commitId: linkedCommit.id,
                          ticketId: undefined, // This will unlink
                          userId: currentUserId,
                        });
                      } else {
                        console.log('eeee 🗑️ Clearing manual commit URL (no linked commit)');
                        clearCommitUrl();
                      }
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
