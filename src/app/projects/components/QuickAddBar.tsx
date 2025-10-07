'use client';

import { useState, useRef, useEffect } from 'react';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface QuickAddBarProps {
  onAddQuickTicket: (text: string, assigneeId?: string) => void;
  projectUsers: User[];
  isLoading: boolean;
  placeholder?: string;
}

export function QuickAddBar({ onAddQuickTicket, projectUsers, isLoading, placeholder = "Add a quick task..." }: QuickAddBarProps) {
  const [text, setText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse @mentions from text
  const parseMentions = (inputText: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(inputText)) !== null) {
      mentions.push(match[1].toLowerCase());
    }
    
    return mentions;
  };

  // Find user by mention
  const findUserByMention = (mention: string) => {
    return projectUsers.find(user => 
      user.name?.toLowerCase().includes(mention.toLowerCase()) ||
      user.email.toLowerCase().includes(mention.toLowerCase())
    );
  };

  // Get filtered suggestions based on current @mention
  const getSuggestions = () => {
    if (!showSuggestions) return [];
    
    // If no query (just typed @), show all users
    if (!mentionQuery) {
      return projectUsers.slice(0, 5);
    }
    
    // Otherwise filter by query
    return projectUsers.filter(user =>
      user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);
  };

  const suggestions = getSuggestions();

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    // Check if we're typing an @mention
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      // Found @, check what's after it
      const afterAt = value.substring(atIndex + 1);
      
      if (afterAt.includes(' ')) {
        // Space found after @, stop suggesting
        setShowSuggestions(false);
      } else {
        // Show suggestions immediately when @ is typed
        setMentionQuery(afterAt);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedSuggestion]);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (user: User) => {
    const atIndex = text.lastIndexOf('@');
    const beforeMention = text.substring(0, atIndex);
    const afterMention = text.substring(atIndex + mentionQuery.length + 1);
    const newText = `${beforeMention}@${user.name || user.email}${afterMention}`;
    
    setText(newText);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle submit
  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;

    // Parse mentions and find assignee
    const mentions = parseMentions(text);
    let assigneeId: string | undefined;
    
    if (mentions.length > 0) {
      const assignee = findUserByMention(mentions[0]);
      assigneeId = assignee?.id;
    }

    onAddQuickTicket(text.trim(), assigneeId);
    setText('');
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <PlusIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 text-gray-900 placeholder-gray-500 border-0 focus:ring-0 focus:outline-none bg-transparent"
        />
        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        )}
      </div>

      {/* @mention suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectSuggestion(user)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3 ${
                index === selectedSuggestion ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
              }`}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-xs">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{user.name || 'No name'}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hint text */}
      <div className="mt-2 text-xs text-gray-500">
        Type to add a quick task. Use @mentions to assign. Press Enter to save.
      </div>
    </div>
  );
}
