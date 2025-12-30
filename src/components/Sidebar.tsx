import { useState, useEffect } from 'react';
import { Home, LayoutDashboard, Layers, Wrench, HardHat, Settings, LogOut, Menu, X, ClipboardList, CheckSquare, Bell, BookOpen, Users, Calculator, Library, ChevronDown, ChevronRight, Kanban } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import NotificationBell from './NotificationBell';

type TabType = 'home' | 'dashboard' | 'hk' | 'fm' | 'retrofit' | 'retrofit-pm' | 'inquiries' | 'approvals' | 'notifications' | 'asset-library' | 'labor-library' | 'settings' | 'profile';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User;
  onLogout: () => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
}

interface MenuItem {
  id: TabType;
  icon: any;
  label: string;
  description?: string;
  color: string;
  moduleName?: string;
}

interface MenuSection {
  id: string;
  label: string;
  description?: string;
  icon: any;
  color: string;
  items: MenuItem[];
}

export default function Sidebar({ activeTab, onTabChange, user, onLogout, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['estimators', 'libraries']));
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number } | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const { organization } = useOrganization();
  const { canViewModule } = usePermissions();

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null && saved === 'true') {
      onToggleCollapse();
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
    loadNotificationCounts();
  }, [user, organization]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotificationCounts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

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

  const loadNotificationCounts = async () => {
    try {
      const { count: notificationCount } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      setUnreadNotificationCount(notificationCount || 0);

      if (organization) {
        const { getMyPendingApprovals } = await import('../utils/approvalDatabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const myApprovals = await getMyPendingApprovals(user.id, organization.id);
          setPendingApprovalCount(myApprovals.length);
        } else {
          setPendingApprovalCount(0);
        }
      } else {
        setPendingApprovalCount(0);
      }
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      return userProfile.first_name;
    } else if (userProfile?.last_name) {
      return userProfile.last_name;
    }
    return user.email || 'User';
  };

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase();
    } else if (userProfile?.first_name) {
      return userProfile.first_name.charAt(0).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const toggleCollapse = () => {
    onToggleCollapse();
    localStorage.setItem('sidebarCollapsed', String(!isCollapsed));
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab);
    setIsMobileOpen(false);
    // Immediately hide popover when clicking a menu item
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setHoveredSection(null);
    setPopoverPosition(null);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const allTopMenuItems: MenuItem[] = [
    { id: 'home' as TabType, icon: Home, label: 'Home', description: 'Quick actions and getting started', color: 'text-blue-400' },
    { id: 'dashboard' as TabType, icon: LayoutDashboard, label: 'Dashboard', description: 'Analytics, metrics, and project overview', color: 'text-teal-400', moduleName: 'dashboard' },
    { id: 'inquiries' as TabType, icon: ClipboardList, label: 'Inquiries', description: 'Manage client project inquiries', color: 'text-yellow-400', moduleName: 'inquiries' },
    { id: 'approvals' as TabType, icon: CheckSquare, label: 'Approvals', description: 'Review and approve project submissions', color: 'text-emerald-400', moduleName: 'approvals' },
    { id: 'notifications' as TabType, icon: Bell, label: 'Notifications', description: 'View recent activity and alerts', color: 'text-pink-400', moduleName: 'notifications' },
  ];

  const allMenuSections: MenuSection[] = [
    {
      id: 'estimators',
      label: 'Estimators',
      description: 'Project estimation tools',
      icon: Calculator,
      color: 'text-blue-400',
      items: [
        { id: 'hk' as TabType, icon: Layers, label: 'HK Estimator', description: 'Housekeeping service estimation and pricing', color: 'text-green-400', moduleName: 'hk_estimator' },
        { id: 'fm' as TabType, icon: Wrench, label: 'FM MEP Estimator', description: 'Facilities management and MEP estimation', color: 'text-orange-400', moduleName: 'fm_estimator' },
        { id: 'retrofit' as TabType, icon: HardHat, label: 'Retrofit Estimator', description: 'Building retrofit and renovation estimation', color: 'text-purple-400', moduleName: 'retrofit_estimator' },
      ]
    },
    {
      id: 'libraries',
      label: 'Libraries',
      description: 'Manage reusable resources',
      icon: Library,
      color: 'text-indigo-400',
      items: [
        { id: 'labor-library' as TabType, icon: Users, label: 'Labor Library', description: 'Manage labor rates and technician profiles', color: 'text-cyan-400', moduleName: 'labor_library' },
        { id: 'asset-library' as TabType, icon: BookOpen, label: 'Asset Library', description: 'Manage asset catalog and specifications', color: 'text-indigo-400', moduleName: 'asset_library' },
      ]
    }
  ];

  const retrofitPMItem: MenuItem = { id: 'retrofit-pm' as TabType, icon: Kanban, label: 'Retrofit PM', description: 'End-to-end project management for retrofit projects', color: 'text-blue-400', moduleName: 'retrofit_pm' };

  const bottomMenuItem: MenuItem = { id: 'settings' as TabType, icon: Settings, label: 'Settings', description: 'Organization, roles, and configuration', color: 'text-gray-400', moduleName: 'settings' };

  const topMenuItems = allTopMenuItems.filter(item => !item.moduleName || canViewModule(item.moduleName));

  const menuSections = allMenuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.moduleName || canViewModule(item.moduleName))
    }))
    .filter(section => section.items.length > 0);

  const showRetrofitPM = !retrofitPMItem.moduleName || canViewModule(retrofitPMItem.moduleName);
  const showSettings = !bottomMenuItem.moduleName || canViewModule(bottomMenuItem.moduleName);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-slate-800 text-white shadow-2xl z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                {organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name}
                    className="w-10 h-10 object-contain bg-white rounded-lg p-1"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SE</span>
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-sm">{organization?.name || 'Service Estimator'}</h1>
                  <p className="text-xs text-slate-400">Pro Edition</p>
                </div>
              </div>
            )}
            {isCollapsed && organization?.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-10 h-10 object-contain bg-white rounded-lg p-1 mx-auto"
              />
            )}
            {isCollapsed && !organization?.logo_url && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">SE</span>
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-2">
              {/* Top menu items */}
              {topMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = item.id === 'notifications' ? unreadNotificationCount :
                             item.id === 'approvals' ? pendingApprovalCount : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : item.color}`} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                        )}
                      </div>
                    )}
                    {badge > 0 && !isCollapsed && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold self-start mt-0.5">
                        {badge}
                      </span>
                    )}
                    {badge > 0 && isCollapsed && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                        {badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl min-w-[200px]">
                        <div className="font-semibold mb-1">{item.label} {badge > 0 && `(${badge})`}</div>
                        {item.description && (
                          <div className="text-slate-400 text-xs">{item.description}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Sections with nested items */}
              {menuSections.map((section, index) => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                const hasActiveItem = section.items.some(item => item.id === activeTab);

                return (
                  <div key={section.id}>
                    {index === 1 && showRetrofitPM && (
                      <div className="py-1">
                        {(() => {
                          const Icon = retrofitPMItem.icon;
                          const isActive = activeTab === retrofitPMItem.id;

                          return (
                            <button
                              key={retrofitPMItem.id}
                              onClick={() => handleTabChange(retrofitPMItem.id)}
                              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                              title={isCollapsed ? retrofitPMItem.label : ''}
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : retrofitPMItem.color}`} />
                              {!isCollapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="font-medium text-sm">{retrofitPMItem.label}</div>
                                  {retrofitPMItem.description && (
                                    <div className="text-xs text-slate-400 mt-0.5">{retrofitPMItem.description}</div>
                                  )}
                                </div>
                              )}
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                              )}
                              {isCollapsed && (
                                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl min-w-[200px]">
                                  <div className="font-semibold mb-1">{retrofitPMItem.label}</div>
                                  {retrofitPMItem.description && (
                                    <div className="text-slate-400 text-xs">{retrofitPMItem.description}</div>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                    <div className="space-y-1">
                    <button
                      onClick={() => !isCollapsed && toggleSection(section.id)}
                      onMouseEnter={(e) => {
                        if (isCollapsed) {
                          // Clear any pending hide timeout
                          if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            setHideTimeout(null);
                          }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoverPosition({ top: rect.top });
                          setHoveredSection(section.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (isCollapsed) {
                          // Delay hiding to give user time to move to popover
                          const timeout = setTimeout(() => {
                            setHoveredSection(null);
                            setPopoverPosition(null);
                          }, 200);
                          setHideTimeout(timeout);
                        }
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                        hasActiveItem && !isExpanded
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={isCollapsed ? section.label : ''}
                    >
                      <SectionIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${section.color}`} />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm">{section.label}</div>
                            {section.description && (
                              <div className="text-xs text-slate-400 mt-0.5">{section.description}</div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 self-start mt-1" />
                          ) : (
                            <ChevronRight className="w-4 h-4 self-start mt-1" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Nested items - Expanded sidebar */}
                    {!isCollapsed && isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-slate-700 pl-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleTabChange(item.id)}
                              className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : item.color}`} />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="font-medium text-xs">{item.label}</div>
                                {item.description && (
                                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{item.description}</div>
                                )}
                              </div>
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}

              {/* Settings at bottom of nav */}
              {showSettings && (
                <div className="pt-2 border-t border-slate-700 mt-2">
                  {(() => {
                    const Icon = bottomMenuItem.icon;
                    const isActive = activeTab === bottomMenuItem.id;

                    return (
                      <button
                        key={bottomMenuItem.id}
                        onClick={() => handleTabChange(bottomMenuItem.id)}
                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={isCollapsed ? bottomMenuItem.label : ''}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : bottomMenuItem.color}`} />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm">{bottomMenuItem.label}</div>
                            {bottomMenuItem.description && (
                              <div className="text-xs text-slate-400 mt-0.5">{bottomMenuItem.description}</div>
                            )}
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full" />
                        )}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl min-w-[200px]">
                            <div className="font-semibold mb-1">{bottomMenuItem.label}</div>
                            {bottomMenuItem.description && (
                              <div className="text-slate-400 text-xs">{bottomMenuItem.description}</div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          </nav>

          <div className="border-t border-slate-700 p-4">
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-3 mb-3 p-2 rounded-lg transition-colors hover:bg-slate-700 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {getUserInitials()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{getUserDisplayName()}</p>
                  <p className="text-xs text-slate-400">View Profile</p>
                </div>
              )}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Logout' : ''}
            >
              {isLoggingOut ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>

        {/* Popover menu for collapsed sidebar - renders outside nav to avoid clipping */}
        {isCollapsed && hoveredSection && popoverPosition && (
          <div
            className="fixed z-[100]"
            style={{
              left: '62px',
              top: `${popoverPosition.top}px`,
              paddingLeft: '4px'
            }}
            onMouseEnter={() => {
              // Clear any pending hide timeout when entering popover
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                setHideTimeout(null);
              }
              setHoveredSection(hoveredSection);
            }}
            onMouseLeave={() => {
              // Delay hiding to give user time to move back to icon
              const timeout = setTimeout(() => {
                setHoveredSection(null);
                setPopoverPosition(null);
              }, 200);
              setHideTimeout(timeout);
            }}
          >
            {menuSections
              .filter(section => section.id === hoveredSection)
              .map(section => (
                <div key={section.id} className="bg-slate-900 rounded-lg shadow-2xl border border-slate-700 p-2 min-w-[240px]">
                  <div className="px-2 py-2 border-b border-slate-700 mb-2">
                    <div className="text-sm font-semibold text-white">{section.label}</div>
                    {section.description && (
                      <div className="text-xs text-slate-400 mt-1">{section.description}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? 'text-white' : item.color}`} />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-slate-400 mt-0.5 leading-tight">{item.description}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </aside>
    </>
  );
}
