'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import GitHubRepoSection from './GitHubRepoSection';
import GitHubActivityView from './GitHubActivityView';
import DiffViewer from './DiffViewer';

interface GitHubTabProps {
  projectId: string;
  tickets: any[];
}

export default function GitHubTab({ projectId, tickets }: GitHubTabProps) {
  const [viewingDiff, setViewingDiff] = useState<{ type: 'commit' | 'pr', data: any } | null>(null);
  
  const { user: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id || '';

  // Get current project data
  const projects = trpc.user.getProjects.useQuery();
  const currentProject = projects.data?.find(p => p.id === projectId);

  // Handle diff viewing via custom events
  useEffect(() => {
    const handleViewDiff = (event: any) => {
      setViewingDiff(event.detail);
    };

    window.addEventListener('viewDiff', handleViewDiff);
    return () => window.removeEventListener('viewDiff', handleViewDiff);
  }, []);

  // Handle Escape key to close diff modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingDiff) {
        setViewingDiff(null);
      }
    };

    if (viewingDiff) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [viewingDiff]);

  return (
    <div className="space-y-6">
      {/* Repository Link Section */}
      <GitHubRepoSection 
        projectId={projectId}
        currentProject={currentProject}
        currentUserId={currentUserId}
      />

      {/* GitHub Activity View */}
      <GitHubActivityView 
        projectId={projectId}
        tickets={tickets}
      />

      {/* Diff Viewer Modal */}
      {viewingDiff && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingDiff(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="text-lg font-medium text-gray-900">
                {viewingDiff.type === 'commit' ? 'Commit Diff' : 'PR Diff'}: {viewingDiff.data.message || viewingDiff.data.title}
              </h3>
              <button
                onClick={() => setViewingDiff(null)}
                className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-80px)] bg-white">
              {viewingDiff.data.diff ? (
                <DiffViewer diff={viewingDiff.data.diff} />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No diff available for this {viewingDiff.type}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}