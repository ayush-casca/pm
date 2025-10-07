'use client';

import { 
  UserGroupIcon, 
  PlusIcon,
  UserCircleIcon,
  CalendarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

interface UsersSectionProps {
  users: User[] | undefined;
  isLoading: boolean;
  onAddUser: () => void;
}

export function UsersSection({ users, isLoading, onAddUser }: UsersSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">{users?.length || 0} members</p>
            </div>
          </div>
          <button
            onClick={onAddUser}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading team members...</span>
            </div>
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first team member</p>
            <button
              onClick={onAddUser}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add First Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user.id} className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.name || 'No name'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
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
