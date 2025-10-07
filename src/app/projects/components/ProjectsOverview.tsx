'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  PlusIcon,
  ClockIcon
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

interface ProjectsOverviewProps {
  myProjects: Project[] | undefined;
  availableProjects: Project[] | undefined;
  myProjectsLoading: boolean;
  availableProjectsLoading: boolean;
  onAddMember: (projectId: string) => void;
  onJoinProject: (projectId: string) => void;
}

export function ProjectsOverview({ 
  myProjects, 
  availableProjects, 
  myProjectsLoading, 
  availableProjectsLoading,
  onAddMember,
  onJoinProject 
}: ProjectsOverviewProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showAvailable, setShowAvailable] = useState(false);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* My Projects - Always Expanded */}
      <div className="border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FolderIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
              <p className="text-sm text-gray-500">{myProjects?.length || 0} active projects</p>
            </div>
          </div>
        </div>
        
        <div className="pb-4">
          {myProjectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-500">Loading your projects...</span>
              </div>
            </div>
          ) : myProjects?.length === 0 ? (
            <div className="text-center py-8 px-6">
              <FolderIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You're not assigned to any projects yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {myProjects?.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                return (
                  <div key={project.id} className="mx-4">
                    {/* Project Row */}
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="w-4 h-4" />
                              <span>{project.projectUsers.length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onAddMember(project.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="ml-8 mt-2 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                          )}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900">Team Members</h4>
                            {project.projectUsers.map((pu) => (
                              <div key={pu.id} className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-xs">
                                    {(pu.user.name || pu.user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-900">{pu.user.name || pu.user.email}</span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  {pu.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Available Projects - Collapsible */}
      <div>
        <button
          onClick={() => setShowAvailable(!showAvailable)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {showAvailable ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Available Projects</h2>
              <p className="text-sm text-gray-500">{availableProjects?.length || 0} projects you can join</p>
            </div>
          </div>
        </button>
        
        {showAvailable && (
          <div className="pb-4 border-t border-gray-50">
            {availableProjectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  <span className="text-gray-500">Loading available projects...</span>
                </div>
              </div>
            ) : availableProjects?.length === 0 ? (
              <div className="text-center py-8 px-6">
                <p className="text-gray-500">No available projects to join</p>
              </div>
            ) : (
              <div className="space-y-1 mt-2">
                {availableProjects?.map((project) => (
                  <div key={project.id} className="mx-4">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="w-4 h-4" />
                              <span>{project.projectUsers.length} members</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onJoinProject(project.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                      >
                        Join
                      </button>
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
