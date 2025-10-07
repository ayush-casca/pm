'use client';

import { trpc } from '@/lib/trpc-client';
import { useState } from 'react';
import { ProjectsTab } from './components/ProjectsTab';
import { MembersTab } from './components/MembersTab';
import { AddUserModal } from './components/AddUserModal';
import { AddProjectModal } from './components/AddProjectModal';
import { EditProjectModal } from './components/EditProjectModal';
import { AddUserToProjectModal } from './components/AddUserToProjectModal';
import { EditUserModal } from './components/EditUserModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddUserToProject, setShowAddUserToProject] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { currentUserId, impersonateUser } = useCurrentUser();
  const utils = trpc.useUtils();

  // Queries
  const { data: users, isLoading: usersLoading } = trpc.user.getAll.useQuery();
  const { data: projects, isLoading: projectsLoading } = trpc.user.getProjects.useQuery();
  
  // Get current user to check permissions
  const currentUser = users?.find(u => u.id === currentUserId);
  // If currentUserId is null, treat as anonymous admin. Otherwise check user role.
  const isAdmin = !currentUserId || currentUser?.role === 'Admin';

  // Mutations
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      setShowAddUser(false);
      utils.user.getAll.invalidate();
    },
  });

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      setShowEditUser(false);
      setSelectedUser(null);
      utils.user.getAll.invalidate();
    },
  });

  const createProject = trpc.user.createProject.useMutation({
    onSuccess: (project) => {
      setShowAddProject(false);
      utils.user.getProjects.invalidate();
      utils.audit.getByProject.invalidate({ projectId: project.id }); // Invalidate audit log for the new project
    },
  });

  const updateProject = trpc.user.updateProject.useMutation({
    onSuccess: (_, variables) => {
      setShowEditProject(false);
      setSelectedProject(null);
      utils.user.getProjects.invalidate();
      utils.audit.getByProject.invalidate({ projectId: variables.id }); // Invalidate audit log for the updated project
    },
  });

  const addUserToProject = trpc.user.addUserToProject.useMutation({
    onSuccess: (_, variables) => {
      setShowAddUserToProject(false);
      setSelectedProjectId(null);
      utils.user.getProjects.invalidate();
      utils.audit.getByProject.invalidate({ projectId: variables.projectId }); // Invalidate audit log for the project
    },
  });

  const handleCreateUser = (data: { email: string; name?: string; role?: string }) => {
    createUser.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUser(true);
  };

  const handleUpdateUser = (data: { id: string; name?: string; role?: string }) => {
    updateUser.mutate(data);
  };

  const handleCreateProject = (data: { name: string; description?: string }) => {
    if (!currentUserId) return;
    createProject.mutate({
      ...data,
      createdById: currentUserId,
    });
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditProject(true);
  };

  const handleUpdateProject = (data: { id: string; name: string; description?: string }) => {
    if (!currentUserId) return;
    updateProject.mutate({
      ...data,
      updatedById: currentUserId,
    });
  };

  const handleAddUserToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowAddUserToProject(true);
  };

  const handleAddUserToProjectSubmit = (data: { projectId: string; userId: string; role: 'admin' | 'pm' | 'engineer' }) => {
    if (!currentUserId) return;
    addUserToProject.mutate({
      ...data,
      addedById: currentUserId,
    });
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-gray-600">Manage your organization's projects and team members</p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
            {activeTab === 'projects' ? (
              <ProjectsTab
                projects={projects}
                users={users}
                isLoading={projectsLoading}
                onCreateProject={() => setShowAddProject(true)}
                onEditProject={handleEditProject}
                onAddUserToProject={handleAddUserToProject}
                canManage={isAdmin}
              />
            ) : (
              <MembersTab
                users={users}
                isLoading={usersLoading}
                onAddUser={() => setShowAddUser(true)}
                currentUserId={currentUserId}
                onImpersonate={impersonateUser}
                onEditUser={handleEditUser}
                canManage={isAdmin}
              />
            )}
      </div>

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onSubmit={handleCreateUser}
        isLoading={createUser.isPending}
      />

      <AddProjectModal
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleCreateProject}
        isLoading={createProject.isPending}
      />

      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => {
          setShowEditProject(false);
          setSelectedProject(null);
        }}
        onSubmit={handleUpdateProject}
        isLoading={updateProject.isPending}
        project={selectedProject}
      />

      <AddUserToProjectModal
        isOpen={showAddUserToProject}
        onClose={() => {
          setShowAddUserToProject(false);
          setSelectedProjectId(null);
        }}
        onSubmit={handleAddUserToProjectSubmit}
        isLoading={addUserToProject.isPending}
        users={users}
        projectId={selectedProjectId}
      />

      <EditUserModal
        isOpen={showEditUser}
        onClose={() => {
          setShowEditUser(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        isLoading={updateUser.isPending}
        user={selectedUser}
      />
    </div>
  );
}
