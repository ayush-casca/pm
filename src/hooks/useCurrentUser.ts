'use client';

import { useState, useEffect } from 'react';

const CURRENT_USER_KEY = 'projectai-current-user';

export function useCurrentUser() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUserId) {
      setCurrentUserId(savedUserId);
    } else {
      // Default to generic admin user (first user)
      setCurrentUserId('1');
    }
  }, []);

  const impersonateUser = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem(CURRENT_USER_KEY, userId);
  };

  const clearImpersonation = () => {
    setCurrentUserId(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return {
    currentUserId,
    impersonateUser,
    clearImpersonation,
  };
}
