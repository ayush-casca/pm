'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  FolderIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { trpc } from '@/lib/trpc-client';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Organization', href: '/organization', icon: BuildingOfficeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUserId } = useCurrentUser();
  const { data: users } = trpc.user.getAll.useQuery();
  
  const currentUser = users?.find(u => u.id === currentUserId);
  const isAdmin = !currentUserId || currentUser?.role === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 h-[73px]">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">ProjectAI</span>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {currentUser ? (currentUser.name || currentUser.email).charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser ? (currentUser.name || 'No name') : 'Loading...'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser ? currentUser.email : 'user@example.com'}
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {currentUserId ? (
                `${isAdmin ? 'Admin' : 'Standard User'} • Impersonating: ${currentUserId}`
              ) : (
                'Anonymous Admin'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex flex-col h-full">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 h-[73px]">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <BellIcon className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-white overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

