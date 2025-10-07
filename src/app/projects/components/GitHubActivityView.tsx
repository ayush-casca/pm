'use client';

import { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  CodeBracketIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface GitHubActivityViewProps {
  projectId: string;
  tickets: any[];
}

export default function GitHubActivityView({ projectId, tickets }: GitHubActivityViewProps) {
  const [viewMode, setViewMode] = useState<'branches' | 'prs'>('branches');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [expandedPRs, setExpandedPRs] = useState<Set<string>>(new Set());

  // Fetch GitHub data
  const branches = trpc.github.getProjectBranches.useQuery({ projectId });
  const prs = trpc.github.getProjectPRs.useQuery({ projectId });
  const commits = trpc.github.getProjectCommits.useQuery({ projectId });

  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
    }
    setExpandedBranches(newExpanded);
  };

  const togglePRExpansion = (prId: string) => {
    const newExpanded = new Set(expandedPRs);
    if (newExpanded.has(prId)) {
      newExpanded.delete(prId);
    } else {
      newExpanded.add(prId);
    }
    setExpandedPRs(newExpanded);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketName = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    return ticket ? ticket.name : 'Unknown Ticket';
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('branches')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'branches'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CodeBracketIcon className="w-4 h-4 inline mr-2" />
          Branches ({branches.data?.length || 0})
        </button>
        <button
          onClick={() => setViewMode('prs')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'prs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DocumentTextIcon className="w-4 h-4 inline mr-2" />
          Pull Requests ({prs.data?.length || 0})
        </button>
      </div>

      {/* Content */}
      {viewMode === 'branches' ? (
        <div className="space-y-4">
          {branches.isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading branches...</div>
          ) : branches.data && branches.data.length > 0 ? (
            branches.data.map((branch) => {
              const branchCommits = commits.data?.filter(c => c.branchId === branch.id) || [];
              const isExpanded = expandedBranches.has(branch.id);
              
              return (
                <div key={branch.id} className="border border-gray-200 rounded-lg bg-white">
                  {/* Branch Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleBranchExpansion(branch.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                        <CodeBracketIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{branch.name}</h3>
                          {branch.description && (
                            <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{branchCommits.length} commits</span>
                        <span>by {branch.author}</span>
                      </div>
                    </div>
                  </div>

                  {/* Branch Commits */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {branchCommits.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {branchCommits.map((commit) => (
                            <div key={commit.id} className="p-4 bg-white">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{commit.message}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center">
                                      <UserIcon className="w-4 h-4 mr-1" />
                                      {commit.author}
                                    </span>
                                    <span className="flex items-center">
                                      <CalendarIcon className="w-4 h-4 mr-1" />
                                      {formatDate(commit.createdAt)}
                                    </span>
                                    {commit.ticketId && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {getTicketName(commit.ticketId)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="text-green-600">+{commit.additions}</span>
                                  <span className="text-red-600">-{commit.deletions}</span>
                                  {commit.diff && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // This will be handled by parent component
                                        const event = new CustomEvent('viewDiff', {
                                          detail: { type: 'commit', data: commit }
                                        });
                                        window.dispatchEvent(event);
                                      }}
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                                    >
                                      View Diff
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">No commits found</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No branches found. Push some code to see branches here!
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {prs.isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading pull requests...</div>
          ) : prs.data && prs.data.length > 0 ? (
            prs.data.map((pr) => {
              const prCommits = commits.data?.filter(c => c.pullRequestId === pr.id) || [];
              const isExpanded = expandedPRs.has(pr.id);
              
              return (
                <div key={pr.id} className="border border-gray-200 rounded-lg bg-white">
                  {/* PR Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => togglePRExpansion(pr.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                        <DocumentTextIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">#{pr.githubId}: {pr.title}</h3>
                          {pr.body && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pr.body}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pr.state === 'open' 
                            ? 'bg-green-100 text-green-800' 
                            : pr.merged 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pr.merged ? 'Merged' : pr.state}
                        </span>
                        <span className="text-gray-500">by {pr.author}</span>
                      </div>
                    </div>
                  </div>

                  {/* PR Commits */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {prCommits.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {prCommits.map((commit) => (
                            <div key={commit.id} className="p-4 bg-white">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{commit.message}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center">
                                      <UserIcon className="w-4 h-4 mr-1" />
                                      {commit.author}
                                    </span>
                                    <span className="flex items-center">
                                      <CalendarIcon className="w-4 h-4 mr-1" />
                                      {formatDate(commit.createdAt)}
                                    </span>
                                    {commit.ticketId && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {getTicketName(commit.ticketId)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="text-green-600">+{commit.additions}</span>
                                  <span className="text-red-600">-{commit.deletions}</span>
                                  {commit.diff && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // This will be handled by parent component
                                        const event = new CustomEvent('viewDiff', {
                                          detail: { type: 'commit', data: commit }
                                        });
                                        window.dispatchEvent(event);
                                      }}
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium"
                                    >
                                      View Diff
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">No commits found</div>
                      )}

                      {/* PR Diff Button */}
                      {pr.diff && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // This will be handled by parent component
                              const event = new CustomEvent('viewDiff', {
                                detail: { type: 'pr', data: pr }
                              });
                              window.dispatchEvent(event);
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                          >
                            View Full PR Diff
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No pull requests found. Create a PR to see it here!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
