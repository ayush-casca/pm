'use client';

import { useState } from 'react';
import { LinkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc-client';

interface GitHubRepoSectionProps {
  projectId: string;
  currentProject?: { githubRepoName?: string | null };
  currentUserId: string;
}

export default function GitHubRepoSection({ 
  projectId, 
  currentProject, 
  currentUserId 
}: GitHubRepoSectionProps) {
  const [repoName, setRepoName] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(false);

  const updateProjectRepo = trpc.github.updateProjectRepo.useMutation({
    onSuccess: () => {
      setShowRepoInput(false);
      setRepoName('');
      // Invalidate queries to refresh the UI
      trpc.useContext().user.getProjects.invalidate();
    },
    onError: (error) => {
      console.error('Failed to update repository:', error);
      alert('Failed to update repository. Please try again.');
    }
  });

  return (
    <>
      {(!currentProject?.githubRepoName || showRepoInput) ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Link GitHub Repository</h3>
              <p className="text-sm text-yellow-600 mt-1">
                Enter the repository name (owner/repo) to enable webhook automation.<br />
                <span className="text-xs">Example: ayush-casca/pm (not the full URL)</span>
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
                  placeholder="owner/repo-name (e.g., ayush-casca/pm)"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                  title="Enter repository name in format: owner/repo-name (NOT the full URL)"
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
      ) : !showRepoInput ? (
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
                console.log('🔧 Edit button clicked!', {
                  currentProject: currentProject?.githubRepoName,
                  showRepoInput,
                });
                setRepoName(currentProject?.githubRepoName || '');
                setShowRepoInput(true);
              }}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
