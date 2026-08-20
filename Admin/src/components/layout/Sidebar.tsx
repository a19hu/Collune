import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Sparkles,
  Building2,
  Megaphone,
  Bookmark,
  DownloadCloud,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Permission } from '../../types';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
// @ts-ignore - SVG module type declaration not found, but import works via bundler asset handling
import logo from "../../assests/Logo.svg";

interface NavItem {
  name: string;
  id: string;
  icon: React.ElementType;
  permission: Permission | string;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeRoute?: string;
  onRouteChange: (route: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute = '/admin/dashboard',
  onRouteChange,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { currentUser, currentRole, roles, switchDemoRole, hasPermission } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          id: '/admin/dashboard',
          icon: LayoutDashboard,
          permission: 'dashboard.view',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          name: 'Users',
          id: '/admin/users',
          icon: Users,
          permission: 'users.view',
        },
        {
          name: 'Roles & Permissions',
          id: '/admin/roles',
          icon: ShieldCheck,
          permission: 'roles.view',
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        {
          name: 'Creators',
          id: '/admin/creators',
          icon: Sparkles,
          permission: 'creators.view',
          badge: '428',
        },
        {
          name: 'Brands',
          id: '/admin/brands',
          icon: Building2,
          permission: 'brands.view',
        },
        {
          name: 'Campaigns',
          id: '/admin/campaigns',
          icon: Megaphone,
          permission: 'campaigns.view',
          badge: '326',
        },
        {
          name: 'Shortlists',
          id: '/admin/shortlists',
          icon: Bookmark,
          permission: 'shortlists.view',
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          name: 'Data Exports',
          id: '/admin/exports',
          icon: DownloadCloud,
          permission: 'exports.view',
        },
        {
          name: 'Audit Logs',
          id: '/admin/audit',
          icon: FileSpreadsheet,
          permission: 'audit_logs.view',
        },
      ],
    },
    // {
    //   title: 'System',
    //   items: [
    //     {
    //       name: 'Settings',
    //       id: '/admin/settings',
    //       icon: Settings,
    //       permission: 'settings.view',
    //     },
    //   ],
    // },
  ];

  // Filter out sections where user has 0 visible items
  const visibleSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((sec) => sec.items.length > 0);

  const handleNavClick = (id: string) => {
    onRouteChange(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-white shrink-0 border-r border-slate-800">
      {/* Brand Header */}
       <div className="flex items-center justify-between px-6 pb-6 pt-6 lg:px-16 border-b border-slate-800">
          <Link to="/" onClick={() => handleNavClick('/admin/dashboard')}>
            <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
          </Link>
        </div>
      

      {/* Navigation Sections */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {visibleSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2.5 px-2 select-none">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  Boolean(activeRoute && (
                    activeRoute === item.id ||
                    (item.id !== '/admin/dashboard' && activeRoute.startsWith(item.id))
                  ));

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-left',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {item.badge}
                      </span>
                    )}

                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Role Switcher Footer */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu((p) => !p)}
            className="w-full flex items-center gap-3 px-2.5 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors group cursor-pointer text-left"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-xs font-bold truncate text-white">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentRole.name}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
          </button>

          {/* Quick Demo Role Dropdown */}
          {showRoleMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-2 z-40 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Switch Demo Role</span>
                <span className="text-[9px] px-1 bg-indigo-500/20 text-indigo-300 rounded font-semibold">RBAC</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                {roles.map((role) => {
                  const isSelected = role.id === currentRole.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        switchDemoRole(role.id);
                        setShowRoleMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <span className="truncate">{role.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white ml-2 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
