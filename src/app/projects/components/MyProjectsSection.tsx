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

interface MyProjectsSectionProps {
  projects: Project[] | undefined;
  isLoading: boolean;
  onAddMember: (projectId: string) => void;
}

export function MyProjectsSection({ projects, isLoading, onAddMember }: MyProjectsSectionProps) {
  return (
    <div className="bg-red-500 rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
        <p className="text-sm text-gray-600">Projects you're assigned to</p>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assigned projects</div>
        ) : (
          <div className="space-y-4">
            {projects?.map((project) => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <Button
                    onClick={() => onAddMember(project.id)}
                    size="sm"
                    variant="outline"
                  >
                    Add Member
                  </Button>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                )}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Team Members
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.projectUsers.map((pu) => (
                      <div
                        key={pu.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {pu.user.name || pu.user.email}
                        <span className="ml-1 text-blue-600">({pu.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
