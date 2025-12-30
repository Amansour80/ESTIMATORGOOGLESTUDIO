import { useState, useEffect } from 'react';
import { Layers, Wrench, HardHat, TrendingUp, Clock, BookOpen, ArrowRight, ClipboardList, Calendar, DollarSign, Users, FileText, Folder, MessageSquare, PlayCircle, HelpCircle, Zap, BarChart3 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useUsageLimits } from '../hooks/useUsageLimits';
import Breadcrumbs from '../components/Breadcrumbs';
import { StatusBadge } from '../components/StatusBadge';
import type { ProjectStatus } from '../types/projectStatus';
import SmartNavigationSuggestions from '../components/SmartNavigationSuggestions';
import GettingStartedModal from '../components/GettingStartedModal';

interface HomeProps {
  user: User;
  onNavigate: (tab: 'hk' | 'fm' | 'retrofit' | 'inquiries' | 'retrofit-pm' | 'dashboard', projectId?: string) => void;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
}

interface RecentProject {
  id: string;
  name: string;
  client: string;
  type: 'hk' | 'fm' | 'retrofit';
  status: ProjectStatus;
  updated_at: string;
}

export default function Home({ user, onNavigate }: HomeProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const { usage, isOnFreePlan, getProjectsRemaining, getInquiriesRemaining } = useUsageLimits();

  useEffect(() => {
    loadUserProfile();
    loadRecentProjects();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    return user.email?.split('@')[0] || 'User';
  };

  const loadRecentProjects = async () => {
    try {
      setLoadingProjects(true);
      const projects: RecentProject[] = [];

      const [hkData, fmData, retrofitData] = await Promise.all([
        supabase
          .from('hk_projects')
          .select('id, project_name, project_data, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2),
        supabase
          .from('fm_projects')
          .select('id, project_name, client_name, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2),
        supabase
          .from('retrofit_projects')
          .select('id, project_name, client_name, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(2)
      ]);

      if (hkData.data) {
        hkData.data.forEach(p => {
          projects.push({
            id: p.id,
            name: p.project_name,
            client: (p.project_data as any)?.projectInfo?.clientName || 'N/A',
            type: 'hk',
            status: p.status || 'DRAFT',
            updated_at: p.updated_at
          });
        });
      }

      if (fmData.data) {
        fmData.data.forEach(p => {
          projects.push({
            id: p.id,
            name: p.project_name,
            client: p.client_name || 'N/A',
            type: 'fm',
            status: p.status || 'DRAFT',
            updated_at: p.updated_at
          });
        });
      }

      if (retrofitData.data) {
        retrofitData.data.forEach(p => {
          projects.push({
            id: p.id,
            name: p.project_name,
            client: p.client_name || 'N/A',
            type: 'retrofit',
            status: p.status || 'DRAFT',
            updated_at: p.updated_at
          });
        });
      }

      projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setRecentProjects(projects.slice(0, 6));
    } catch (error) {
      console.error('Error loading recent projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getProjectTypeIcon = (type: 'hk' | 'fm' | 'retrofit') => {
    switch (type) {
      case 'hk': return Layers;
      case 'fm': return Wrench;
      case 'retrofit': return HardHat;
    }
  };

  const getProjectTypeLabel = (type: 'hk' | 'fm' | 'retrofit') => {
    switch (type) {
      case 'hk': return 'Housekeeping';
      case 'fm': return 'FM MEP';
      case 'retrofit': return 'Retrofit';
    }
  };

  const getProjectTypeColor = (type: 'hk' | 'fm' | 'retrofit') => {
    switch (type) {
      case 'hk': return 'bg-green-100 text-green-700';
      case 'fm': return 'bg-orange-100 text-orange-700';
      case 'retrofit': return 'bg-blue-100 text-blue-700';
    }
  };
  const estimators = [
    {
      id: 'hk' as const,
      title: 'Housekeeping Estimator',
      description: 'Calculate manpower requirements and pricing for housekeeping services',
      icon: Layers,
      color: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      features: ['Area-based calculations', 'Machine cost analysis', 'Productivity metrics', 'Export to Excel/PDF'],
    },
    {
      id: 'fm' as const,
      title: 'FM MEP Estimator',
      description: 'Comprehensive facilities management and MEP service estimation',
      icon: Wrench,
      color: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      features: ['Asset library management', 'PPM task scheduling', 'Technician planning', 'Industry standards'],
    },
    {
      id: 'retrofit' as const,
      title: 'Retrofit Estimator',
      description: 'Estimate costs and resources for building retrofit and renovation projects',
      icon: HardHat,
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      features: ['Project phases', 'Manpower planning', 'BOQ management', 'Materials & assets tracking'],
    },
  ];

  const projectManagement = [
    {
      id: 'retrofit-pm' as const,
      title: 'Retrofit PM',
      description: 'End-to-end project management for retrofit and construction projects',
      icon: Calendar,
      color: 'from-slate-600 to-slate-800',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      features: [
        'Activity scheduling with dependencies',
        'Budget tracking (6 cost categories)',
        'Gantt charts & timelines',
        'Document & issue management',
        'Cost review workflows',
        'Real-time collaboration'
      ],
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { id: 'hk', label: 'New HK Project', icon: Layers, color: 'from-green-500 to-emerald-600', description: 'Start housekeeping estimate' },
    { id: 'fm', label: 'New FM Project', icon: Wrench, color: 'from-orange-500 to-red-600', description: 'Start FM MEP estimate' },
    { id: 'retrofit', label: 'New Retrofit', icon: HardHat, color: 'from-blue-500 to-cyan-600', description: 'Start retrofit estimate' },
    { id: 'inquiries', label: 'View Inquiries', icon: ClipboardList, color: 'from-amber-500 to-orange-600', description: 'Manage client inquiries' },
  ];

  const learningResources = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of creating your first project estimation',
      icon: PlayCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: 'Read Guide'
    },
    {
      title: 'Best Practices',
      description: 'Tips and tricks for accurate project estimations',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      action: 'Learn More'
    },
    {
      title: 'Help Center',
      description: 'Find answers to common questions and issues',
      icon: HelpCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: 'Get Help'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home' }]} />

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {getUserDisplayName()}
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to Service Estimator Pro. Complete project lifecycle management from inquiry to execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id as any)}
                className={`bg-gradient-to-r ${action.color} text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-bold mb-1">{action.label}</h3>
                <p className="text-sm text-white/80">{action.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mb-8">
          <SmartNavigationSuggestions user={user} onNavigate={onNavigate as any} />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Projects
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loadingProjects ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading recent projects...</p>
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first project using the quick actions above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => {
                const Icon = getProjectTypeIcon(project.type);
                return (
                  <button
                    key={project.id}
                    onClick={() => onNavigate(project.type, project.id)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-5 border border-gray-200 text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 ${getProjectTypeColor(project.type)} rounded-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>

                    <h3 className="font-bold text-gray-900 mb-1 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 truncate">Client: {project.client}</p>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${getProjectTypeColor(project.type)}`}>
                        {getProjectTypeLabel(project.type)}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={project.status} />
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(project.updated_at)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
            <button
              onClick={() => onNavigate('dashboard' as any)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics Dashboard
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningResources.map((resource, index) => {
              const Icon = resource.icon;
              const isGettingStarted = index === 0;
              return (
                <div
                  key={index}
                  onClick={isGettingStarted ? () => setShowGettingStarted(true) : undefined}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 border border-gray-200 group cursor-pointer"
                >
                  <div className={`${resource.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${resource.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                  <button className={`text-sm font-semibold ${resource.color} hover:underline flex items-center gap-1`}>
                    {resource.action}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>


        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Management</h2>
          <div className="grid grid-cols-1 gap-6">
            {projectManagement.map((pm) => {
              const Icon = pm.icon;
              return (
                <div
                  key={pm.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group"
                >
                  <div className={`h-2 bg-gradient-to-r ${pm.color}`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 ${pm.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-8 h-8 ${pm.iconColor}`} />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pm.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{pm.description}</p>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Key Features
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pm.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate(pm.id)}
                      className={`w-full py-3 px-4 bg-gradient-to-r ${pm.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn`}
                    >
                      <span>Open Project Management</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Estimators</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {estimators.map((estimator) => {
            const Icon = estimator.icon;
            return (
              <div
                key={estimator.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group"
              >
                <div className={`h-2 bg-gradient-to-r ${estimator.color}`} />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${estimator.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-8 h-8 ${estimator.iconColor}`} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{estimator.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{estimator.description}</p>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Key Features
                    </p>
                    <ul className="space-y-2">
                      {estimator.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => onNavigate(estimator.id)}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${estimator.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn`}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Documentation</h3>
                <p className="text-sm text-blue-100 mb-3">
                  Comprehensive guides and API references
                </p>
                <button className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                  Browse Docs
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Community</h3>
                <p className="text-sm text-emerald-100 mb-3">
                  Connect with other users and get support
                </p>
                <button className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                  Join Community
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GettingStartedModal
        isOpen={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
      />
    </div>
  );
}
