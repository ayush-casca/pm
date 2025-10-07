'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  PlusIcon
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

interface ProjectsSidebarProps {
  myProjects: Project[] | undefined;
  availableProjects: Project[] | undefined;
  myProjectsLoading: boolean;
  availableProjectsLoading: boolean;
  onAddMember: (projectId: string) => void;
  onJoinProject: (projectId: string) => void;
  onProjectSelect: (projectId: string) => void;
  selectedProjectId: string | null;
  canManageProjects: boolean;
}

export function ProjectsSidebar({ 
  myProjects, 
  availableProjects, 
  myProjectsLoading, 
  availableProjectsLoading,
  onAddMember,
  onJoinProject,
  onProjectSelect,
  selectedProjectId,
  canManageProjects
}: ProjectsSidebarProps) {
  const [showAvailable, setShowAvailable] = useState(false);

  return (
    <div className="h-full overflow-y-auto">
      {/* My Projects */}
      <div>
        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100 flex-shrink-0">
          My Projects
        </div>
        {myProjectsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        ) : myProjects?.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FolderIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No projects assigned</p>
          </div>
        ) : (
          <div>
            {myProjects?.map((project) => (
              <div key={project.id} className="group border-b border-gray-50 last:border-0">
                <div 
                  className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    selectedProjectId === project.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => onProjectSelect(project.id)}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-medium text-xs">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.projectUsers.length} members</p>
                  </div>
                      {canManageProjects && (
                        <button
                          onClick={() => onAddMember(project.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        >
                          <PlusIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Projects */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setShowAvailable(!showAvailable)}
          className="w-full px-4 py-2 flex items-center hover:bg-gray-50 transition-colors text-left"
        >
          <div className="mr-2">
            {showAvailable ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Other Org Projects ({availableProjects?.length || 0})
          </span>
        </button>
        
        {showAvailable && (
          <div>
            {availableProjectsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              </div>
            ) : availableProjects?.length === 0 ? (
              <div className="text-center py-4 px-4">
                <p className="text-sm text-gray-500">No other org projects</p>
              </div>
            ) : (
              <div>
                {availableProjects?.map((project) => (
                  <div key={project.id} className="group border-b border-gray-50 last:border-0">
                    <div 
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        selectedProjectId === project.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                      onClick={() => onProjectSelect(project.id)}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-xs">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.projectUsers.length} members</p>
                      </div>
                          {canManageProjects && (
                            <button
                              onClick={() => onJoinProject(project.id)}
                              className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-all"
                            >
                              Join
                            </button>
                          )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
