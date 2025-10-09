'use client';

import { useState } from 'react';
import { ChevronDownIcon, LinkIcon, CodeBracketIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface Ticket {
  id: string;
  githubUrl: string | null;
  projectId?: string;
}

interface Branch {
  id: string;
  name: string;
  url: string;
  author: string;
  description?: string | null;
}

interface GitHubLinkingSectionProps {
  ticket: Ticket;
  onGitHubUrlUpdate: (url: string) => void;
  currentUserId?: string;
}

export default function GitHubLinkingSection({ 
  ticket, 
  onGitHubUrlUpdate, 
  currentUserId 
}: GitHubLinkingSectionProps) {
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingMode, setLinkingMode] = useState<'manual' | 'branch'>('manual');

  // Get project ID from ticket (you might need to adjust this based on your ticket structure)
  const projectId = ticket.projectId || '';

  // Fetch branches for the project
  const { data: branches = [], isLoading } = trpc.github.getProjectBranches.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Find the linked branch by matching the GitHub URL
  const linkedBranch = branches.find(branch => branch.url === ticket.githubUrl);

  // Mutation to link branch to ticket
  const linkBranchToTicket = trpc.github.linkBranchToTicket.useMutation({
    onSuccess: () => {
      setShowBranchSelector(false);
      setSearchQuery('');
    },
  });

  // Filter branches based on search
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (branch.description && branch.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    branch.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBranchSelect = (branch: Branch) => {
    if (!currentUserId) return;
    
    // Set the GitHub URL to the branch URL
    onGitHubUrlUpdate(branch.url);
    
    // Optionally link the branch to the ticket in the database
    linkBranchToTicket.mutate({
      branchId: branch.id,
      ticketId: ticket.id,
      userId: currentUserId,
    });
    
    setShowBranchSelector(false);
    setSearchQuery('');
  };

  const clearGitHubUrl = () => {
    onGitHubUrlUpdate('');
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">GitHub Integration</h3>
      
      {/* Toggle between manual URL and branch selector */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 border">
          <button
            type="button"
            onClick={() => setLinkingMode('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              linkingMode === 'manual'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Manual URL
          </button>
          <button
            type="button"
            onClick={() => setLinkingMode('branch')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              linkingMode === 'branch'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌿 Select Branch
          </button>
        </div>
      </div>

      {linkingMode === 'manual' ? (
        /* Manual URL Input */
        <div>
          <div className="relative">
            <input
              type="url"
              value={ticket.githubUrl || ''}
              onChange={(e) => onGitHubUrlUpdate(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
            />
            {ticket.githubUrl && (
              <button
                type="button"
                onClick={clearGitHubUrl}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {ticket.githubUrl && (
            <a
              href={ticket.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <LinkIcon className="w-3 h-3 mr-1" />
              View on GitHub
            </a>
          )}
        </div>
      ) : (
        /* Branch Selector */
        <div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBranchSelector(!showBranchSelector)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm text-left flex items-center justify-between"
            >
              <span className="flex items-center min-w-0 flex-1">
                <CodeBracketIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                {linkedBranch ? (
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{linkedBranch.name}</div>
                    <div className="text-xs text-gray-500 truncate">by {linkedBranch.author}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a branch...</span>
                )}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                showBranchSelector ? 'rotate-180' : ''
              }`} />
            </button>

            {showBranchSelector && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Loading branches...
                    </div>
                  ) : filteredBranches.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      {searchQuery ? 'No branches match your search' : 'No branches found'}
                    </div>
                  ) : (
                    filteredBranches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleBranchSelect(branch)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <CodeBracketIcon className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {branch.name}
                              </span>
                            </div>
                            {branch.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {branch.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              by {branch.author}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {ticket.githubUrl && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <CodeBracketIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {linkedBranch ? (
                      <>
                        <div className="font-medium text-green-900 truncate">{linkedBranch.name}</div>
                        <div className="text-xs text-green-700">by {linkedBranch.author}</div>
                      </>
                    ) : (
                      <div className="font-medium text-green-900 truncate">Custom GitHub URL</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <a
                    href={ticket.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    <LinkIcon className="w-3 h-3 mr-1" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={clearGitHubUrl}
                    className="text-xs text-green-600 hover:text-green-800 underline"
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
