'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; name?: string; role?: string }) => void;
  isLoading: boolean;
  user: User | null;
}

export function EditUserModal({ isOpen, onClose, onSubmit, isLoading, user }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Standard User');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role || 'Standard User');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSubmit({ 
        id: user.id, 
        name: name || undefined, 
        role: role || undefined 
      });
    }
  };

  const handleClose = () => {
    setName('');
    setRole('Standard User');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
            <button
              onClick={handleClose}
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
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
              >
                <option value="Standard User">Standard User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
