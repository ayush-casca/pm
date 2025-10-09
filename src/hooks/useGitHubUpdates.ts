'use client';

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc-client';

interface GitHubUpdate {
  type: 'commit' | 'pr' | 'analysis_complete';
  projectId: string;
  data: any;
  timestamp: number;
}

export function useGitHubUpdates(projectId: string) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource('/api/github-notify');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('🔗 Connected to GitHub updates stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different types of updates
        if (data.type === 'github_update' && data.projectId === projectId) {
          console.log('🔄 Received GitHub update:', data);
          
          // Invalidate and refetch GitHub queries for this project
          if (data.type === 'commit') {
            utils.github.getProjectCommits.invalidate({ projectId });
            utils.github.getProjectBranches.invalidate({ projectId });
          } else if (data.type === 'pr') {
            utils.github.getProjectPRs.invalidate({ projectId });
          } else if (data.type === 'analysis_complete') {
            // Refresh the specific data that was analyzed
            utils.github.getProjectCommits.invalidate({ projectId });
            utils.github.getProjectPRs.invalidate({ projectId });
          }
        } else if (data.type === 'ping') {
          // Keep-alive ping, ignore
        } else if (data.type === 'connected') {
          console.log('✅ GitHub updates stream ready');
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ GitHub updates stream error:', error);
      // The browser will automatically attempt to reconnect
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [projectId, utils]);

  // Return a function to manually refresh if needed
  const refreshAll = () => {
    utils.github.getProjectCommits.invalidate({ projectId });
    utils.github.getProjectPRs.invalidate({ projectId });
    utils.github.getProjectBranches.invalidate({ projectId });
  };

  return { refreshAll };
}
