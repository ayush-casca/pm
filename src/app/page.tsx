'use client';

import { trpc } from '@/lib/trpc-client';
import { 
  UserGroupIcon, 
  FolderIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { data: users } = trpc.user.getAll.useQuery();
  const { data: projects } = trpc.user.getProjects.useQuery();

  const stats = [
    {
      name: 'Total Users',
      value: users?.length || 0,
      change: '+12%',
      changeType: 'positive',
      icon: UserGroupIcon,
    },
    {
      name: 'Active Projects',
      value: projects?.length || 0,
      change: '+8%',
      changeType: 'positive',
      icon: FolderIcon,
    },
    {
      name: 'Tickets Created',
      value: '0',
      change: '+0%',
      changeType: 'neutral',
      icon: DocumentTextIcon,
    },
    {
      name: 'Team Efficiency',
      value: '94%',
      change: '+2%',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: 'Demo User',
      action: 'created project',
      target: 'Mobile App Redesign',
      time: '2 hours ago',
    },
    {
      id: 2,
      user: 'System',
      action: 'processed transcript',
      target: 'Weekly Standup Meeting',
      time: '4 hours ago',
    },
    {
      id: 3,
      user: 'Demo User',
      action: 'added user',
      target: 'john@example.com',
      time: '1 day ago',
    },
  ];

      return (
        <div className="h-full bg-neutral-50 overflow-y-auto">
      {/* Hero Section */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-8">
          <div className="max-w-6xl">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-medium text-neutral-900 tracking-tight mb-2">
                  Good morning
                </h1>
                <p className="text-neutral-600 text-base">Here's what's happening with your projects today</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-xs text-neutral-400">{users?.length || 0} team members • {projects?.length || 0} active projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 border border-neutral-200 rounded-lg bg-white">
          {stats.map((stat, index) => (
            <div key={stat.name} className={`p-6 ${index !== stats.length - 1 ? 'border-r border-neutral-200' : ''} ${index < 2 ? 'border-b border-neutral-200 lg:border-b-0' : ''} ${index === 1 ? 'md:border-r-0 lg:border-r' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-neutral-400" />
                <div className="flex items-center text-xs">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpIcon className="w-3 h-3 text-green-600 mr-1" />
                  ) : stat.changeType === 'negative' ? (
                    <ArrowDownIcon className="w-3 h-3 text-red-600 mr-1" />
                  ) : null}
                  <span className={`font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-neutral-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClockIcon className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 leading-relaxed">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-neutral-600 mx-1">{activity.action}</span>
                        <span className="font-medium text-neutral-900">{activity.target}</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full flex items-center px-4 py-3 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Upload Transcript
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors text-sm font-medium">
                <FolderIcon className="w-4 h-4 mr-2" />
                New Project
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors text-sm font-medium">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Invite Team Member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="px-8 pb-12">
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">Getting Started</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-neutral-600">1</span>
                  </div>
                  <h3 className="font-medium text-neutral-900">Set up team</h3>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed ml-11">
                  Add team members and assign roles to establish clear collaboration patterns
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-neutral-600">2</span>
                  </div>
                  <h3 className="font-medium text-neutral-900">Create projects</h3>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed ml-11">
                  Organize work into focused projects with clear objectives and deliverables
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-neutral-600">3</span>
                  </div>
                  <h3 className="font-medium text-neutral-900">Upload transcripts</h3>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed ml-11">
                  Let AI analyze meeting recordings and automatically generate actionable tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
