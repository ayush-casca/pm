'use client';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface UserSelectorProps {
  users: User[] | undefined;
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

export function UserSelector({ users, selectedUserId, onUserChange }: UserSelectorProps) {
  return (
    <select
      value={selectedUserId}
      onChange={(e) => onUserChange(e.target.value)}
      className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      {users?.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name || user.email}
        </option>
      ))}
    </select>
  );
}
