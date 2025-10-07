'use client';

import { 
  FolderIcon, 
  PlusIcon,
  UserGroupIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

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

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectsTabProps {
  projects: Project[] | undefined;
  users: User[] | undefined;
  isLoading: boolean;
  onCreateProject: () => void;
  onEditProject?: (project: Project) => void;
  onAddUserToProject?: (projectId: string) => void;
  canManage: boolean;
}

export function ProjectsTab({ projects, users, isLoading, onCreateProject, onEditProject, onAddUserToProject, canManage }: ProjectsTabProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">{projects?.length || 0} projects</p>
        </div>
        {canManage && (
          <button
            onClick={onCreateProject}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading projects...</span>
            </div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center h-full flex flex-col justify-center">
            <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
          {canManage && (
            <button
              onClick={onCreateProject}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Project
            </button>
          )}
          </div>
        ) : (
          <div className="grid gap-4">
            {projects?.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{project.projectUsers.length} members</span>
                      </div>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onAddUserToProject?.(project.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Add user to project"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEditProject?.(project)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {project.projectUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {project.projectUsers.map((pu) => (
                      <div key={pu.id} className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {(pu.user.name || pu.user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{pu.user.name || pu.user.email}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {pu.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
