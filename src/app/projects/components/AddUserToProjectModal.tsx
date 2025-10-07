'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface AddUserToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { projectId: string; userId: string; role: 'admin' | 'pm' | 'engineer' }) => void;
  isLoading: boolean;
  users: User[] | undefined;
  projectId: string | null;
}

export function AddUserToProjectModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  users, 
  projectId 
}: AddUserToProjectModalProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'pm' | 'engineer'>('engineer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId && selectedUser) {
      onSubmit({
        projectId,
        userId: selectedUser,
        role: selectedRole,
      });
      setSelectedUser('');
      setSelectedRole('engineer');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add User to Project</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
                required
                autoFocus
              >
                <option value="">Select a user</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'pm' | 'engineer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
              >
                <option value="engineer">Engineer</option>
                <option value="pm">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
