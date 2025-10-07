'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  PlusIcon,
  PencilIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon
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

interface ProjectsManagementProps {
  projects: Project[] | undefined;
  users: User[] | undefined;
  isLoading: boolean;
  onCreateProject: () => void;
}

export function ProjectsManagement({ projects, users, isLoading, onCreateProject }: ProjectsManagementProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FolderIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
              <p className="text-sm text-gray-500">{projects?.length || 0} projects</p>
            </div>
          </div>
          <button
            onClick={onCreateProject}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="text-gray-500">Loading projects...</span>
            </div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-12 px-6">
            <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            <button
              onClick={onCreateProject}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Project
            </button>
          </div>
        ) : (
          projects?.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            return (
              <div key={project.id} className="hover:bg-gray-50 transition-colors">
                {/* Project Row */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
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
                      
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-500 truncate">{project.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{project.projectUsers.length} members</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-4 ml-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Team Members</h4>
                      {project.projectUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">No team members assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {project.projectUsers.map((pu) => (
                            <div key={pu.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-xs">
                                    {(pu.user.name || pu.user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {pu.user.name || 'No name'}
                                  </p>
                                  <p className="text-xs text-gray-500">{pu.user.email}</p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {pu.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        + Add team member
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
