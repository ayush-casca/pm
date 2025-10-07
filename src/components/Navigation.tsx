import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              AI Project Manager
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/organization"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Organization
            </Link>
            <Link
              href="/projects"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Projects
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
