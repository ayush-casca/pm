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

interface ProjectsSectionProps {
  projects: Project[] | undefined;
  isLoading: boolean;
  onCreateProject: () => void;
}

export function ProjectsSection({ projects, isLoading, onCreateProject }: ProjectsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <Button onClick={onCreateProject} size="sm">
            Create Project
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading projects...</div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No projects yet</div>
        ) : (
          <div className="space-y-3">
            {projects?.map((project) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <span className="text-xs text-gray-500">
                    {project.projectUsers.length} member{project.projectUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {project.projectUsers.map((pu) => (
                    <span
                      key={pu.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {pu.user.name || pu.user.email} ({pu.role})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
