'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { 
  CodeBracketIcon, 
  LinkIcon, 
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface GitHubTabProps {
  projectId: string;
  tickets: any[];
}

export function GitHubTab({ projectId, tickets }: GitHubTabProps) {
  const [activeView, setActiveView] = useState<'prs' | 'commits'>('prs');
  const [repoName, setRepoName] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(false);

  const { currentUserId } = useCurrentUser();
  const utils = trpc.useUtils();

  // Get current project to check if repo is linked
  const { data: project } = trpc.user.getProjects.useQuery();
  const currentProject = project?.find(p => p.id === projectId);

  // Update project repo mutation
  const updateProjectRepo = trpc.github.updateProjectRepo.useMutation({
    onSuccess: () => {
      setShowRepoInput(false);
      setRepoName('');
      utils.user.getProjects.invalidate();
    },
  });

  // Get GitHub data from API
  const { data: branches = [], isLoading: branchesLoading } = trpc.github.getProjectBranches.useQuery({ 
    projectId 
  });
  const { data: prs = [], isLoading: prsLoading } = trpc.github.getProjectPRs.useQuery({ 
    projectId 
  });
  const { data: commits = [], isLoading: commitsLoading } = trpc.github.getProjectCommits.useQuery({ 
    projectId 
  });

  // Also show tickets with manual GitHub URLs
  const ticketsWithGitHub = tickets.filter(ticket => ticket.githubUrl);
  const isLoading = branchesLoading || prsLoading || commitsLoading;

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getStatusColor = (state: string, merged: boolean) => {
    if (merged) return 'bg-purple-100 text-purple-800';
    if (state === 'open') return 'bg-green-100 text-green-800';
    if (state === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (state: string, merged: boolean) => {
    if (merged) return 'Merged';
    if (state === 'draft') return 'Draft';
    if (state === 'open') return 'Open';
    return 'Closed';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CodeBracketIcon className="w-6 h-6 mr-2" />
            GitHub Activity
          </h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{branches.length} branches</span>
            <span>{prs.length} PRs</span>
            <span>{commits.length} commits</span>
            {ticketsWithGitHub.length > 0 && (
              <span>{ticketsWithGitHub.length} manual links</span>
            )}
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('prs')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'prs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pull Requests ({prs.length})
          </button>
          <button
            onClick={() => setActiveView('commits')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'commits'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent Commits ({commits.slice(0, 20).length})
          </button>
        </div>
      </div>

      {/* Repository Link Section */}
      {!currentProject?.githubRepoName ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Link GitHub Repository</h3>
              <p className="text-sm text-yellow-600 mt-1">
                Connect this project to a GitHub repository to enable webhook automation
              </p>
            </div>
            {!showRepoInput ? (
              <button
                onClick={() => setShowRepoInput(true)}
                className="px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700"
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Link Repository
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="owner/repo-name (e.g., ayushRana48/tRepo)"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                />
                <button
                  onClick={() => {
                    if (repoName.trim() && currentUserId) {
                      updateProjectRepo.mutate({
                        id: projectId,
                        githubRepoName: repoName.trim(),
                        userId: currentUserId,
                      });
                    }
                  }}
                  disabled={!repoName.trim() || updateProjectRepo.isLoading}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowRepoInput(false);
                    setRepoName('');
                  }}
                  className="px-3 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">Repository Linked</h3>
              <p className="text-sm text-green-600 mt-1">
                Connected to <code className="bg-green-100 px-2 py-1 rounded text-xs">{currentProject.githubRepoName}</code>
              </p>
            </div>
            <button
              onClick={() => {
                setRepoName(currentProject.githubRepoName || '');
                setShowRepoInput(true);
              }}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeView === 'prs' ? (
          // Pull Requests View
          <div className="h-full">
            {prs.length === 0 ? (
              <div className="text-center py-12">
                <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Pull Requests</h3>
                <p className="mt-1 text-sm text-gray-500">PRs will appear here automatically via GitHub webhooks.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto h-full">
                {prs.map((pr) => (
                  <div key={pr.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {pr.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.state, pr.merged)}`}>
                            {getStatusText(pr.state, pr.merged)}
                          </span>
                        </div>
                        
                        {pr.body && (
                          <p className="text-sm text-gray-600 mb-3">
                            {pr.body.substring(0, 150)}{pr.body.length > 150 ? '...' : ''}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>#{pr.githubId}</span>
                          <span>by {pr.author}</span>
                          <span>{formatTimeAgo(pr.updatedAt)}</span>
                          <span>{pr.branch.name} → {pr.baseBranch}</span>
                          {pr.additions > 0 && (
                            <span className="text-green-600">+{pr.additions}</span>
                          )}
                          {pr.deletions > 0 && (
                            <span className="text-red-600">-{pr.deletions}</span>
                          )}
                          {pr.ticket && (
                            <span className="text-blue-600">→ {pr.ticket.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                          View PR
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Commits View
          <div className="h-full">
            {commits.length === 0 ? (
              <div className="text-center py-12">
                <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Commits</h3>
                <p className="mt-1 text-sm text-gray-500">Commits will appear here automatically via GitHub webhooks.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto h-full">
                {commits.slice(0, 20).map((commit) => (
                  <div key={commit.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {commit.githubId.substring(0, 7)}
                          </span>
                          <span className="text-xs text-gray-500">
                            by {commit.author} • {formatTimeAgo(commit.createdAt)}
                          </span>
                          {commit.branch && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {commit.branch.name}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">
                          {commit.message.split('\n')[0]}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {commit.additions > 0 && (
                            <span className="text-green-600">+{commit.additions}</span>
                          )}
                          {commit.deletions > 0 && (
                            <span className="text-red-600">-{commit.deletions}</span>
                          )}
                          {commit.changedFiles > 0 && (
                            <span>{commit.changedFiles} files</span>
                          )}
                          {commit.ticket && (
                            <span className="text-blue-600">→ {commit.ticket.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                          View Commit
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual GitHub URLs Section */}
        {ticketsWithGitHub.length > 0 && (
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual GitHub Links</h3>
            <div className="space-y-3">
              {ticketsWithGitHub.map((ticket) => (
                <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{ticket.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Manual link added to ticket</p>
                    </div>
                    <a
                      href={ticket.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View on GitHub
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 inline ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}