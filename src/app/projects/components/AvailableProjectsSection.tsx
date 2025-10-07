'use client';

import { Button } from '@/components/ui/Button';

interface ProjectUser {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  projectUsers: ProjectUser[];
}

interface AvailableProjectsSectionProps {
  projects: Project[] | undefined;
  isLoading: boolean;
  onJoinProject: (projectId: string) => void;
}

export function AvailableProjectsSection({ projects, isLoading, onJoinProject }: AvailableProjectsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Available Projects</h2>
        <p className="text-sm text-gray-600">Projects you can join</p>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No available projects</div>
        ) : (
          <div className="space-y-4">
            {projects?.map((project) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {project.projectUsers.length} member{project.projectUsers.length !== 1 ? 's' : ''}
                  </div>
                  <Button
                    onClick={() => onJoinProject(project.id)}
                    size="sm"
                    variant="outline"
                  >
                    Join Project
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
