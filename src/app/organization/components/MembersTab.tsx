'use client';

import { 
  UserGroupIcon, 
  PlusIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  createdAt: string;
}

interface MembersTabProps {
  users: User[] | undefined;
  isLoading: boolean;
  onAddUser: () => void;
  currentUserId?: string;
  onImpersonate?: (userId: string) => void;
  onEditUser?: (user: User) => void;
  canManage: boolean;
}

export function MembersTab({ users, isLoading, onAddUser, currentUserId, onImpersonate, onEditUser, canManage }: MembersTabProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500">
            {users?.length || 0} members • Click impersonate to switch users
          </p>
        </div>
        {canManage && (
          <button
            onClick={onAddUser}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-500">Loading team members...</span>
            </div>
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center h-full flex flex-col justify-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-6">Add your first team member to get started</p>
          {canManage && (
            <button
              onClick={onAddUser}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors mx-auto"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add First Member
            </button>
          )}
          </div>
        ) : (
          <div className="grid gap-3">
          {users?.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {user.name || 'No name'}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <ShieldCheckIcon className="w-3 h-3 mr-1" />
                        {user.role || 'Standard User'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {currentUserId === user.id ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Current User
                    </span>
                  ) : (
                    <button 
                      onClick={() => onImpersonate?.(user.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Impersonate
                    </button>
                  )}
                  {canManage && (
                    <button 
                      onClick={() => onEditUser?.(user)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Quick Add */}
          {canManage && (
            <button
              onClick={onAddUser}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-lg transition-colors group"
            >
              <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-green-600 mr-2" />
              <span className="text-gray-500 group-hover:text-green-600 font-medium">
                Add another team member
              </span>
            </button>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
