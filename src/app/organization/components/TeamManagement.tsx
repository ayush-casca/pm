'use client';

import { 
  UserGroupIcon, 
  PlusIcon,
  ShieldCheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

interface TeamManagementProps {
  users: User[] | undefined;
  isLoading: boolean;
  onAddUser: () => void;
}

export function TeamManagement({ users, isLoading, onAddUser }: TeamManagementProps) {
  // For now, assume everyone is an admin if no specific admin logic exists
  const hasAdmins = false; // This would come from your user roles logic
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">
                {users?.length || 0} members • {hasAdmins ? 'Admin roles assigned' : 'Everyone is admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onAddUser}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-500">Loading team members...</span>
            </div>
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-6">Add your first team member to get started</p>
            <button
              onClick={onAddUser}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add First Member
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {users?.map((user) => (
              <div key={user.id} className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-4">
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ShieldCheckIcon className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-white transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
            
            {/* Quick Add */}
            <button
              onClick={onAddUser}
              className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-lg transition-colors group"
            >
              <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-green-600 mr-2" />
              <span className="text-gray-500 group-hover:text-green-600 font-medium">
                Add another team member
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
