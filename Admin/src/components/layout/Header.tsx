import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown,
  UserCheck,
  Shield,
  Sparkles,
  Megaphone,
  Building2,
  CheckCircle2,
  X,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumbs, BreadcrumbItem } from '../common/Breadcrumbs';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  breadcrumbs?: BreadcrumbItem[];
  onRouteChange: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  breadcrumbs = [],
  onRouteChange,
}) => {
  const {
    currentUser,
    currentRole,
    roles,
    switchDemoRole,
    theme,
    toggleTheme,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [omniQuery, setOmniQuery] = useState('');

  const notifications = [
    {
      id: 'N1',
      title: 'Creator KYC Verified',
      desc: 'Rahul Verma (#CR-10483) documents verified by Rohan Deshmukh',
      time: '2 mins ago',
      type: 'creator',
    },
    {
      id: 'N2',
      title: 'Brand Approved',
      desc: 'Nike India account onboarded for Summer Campaign 2026',
      time: '15 mins ago',
      type: 'brand',
    },
    {
      id: 'N3',
      title: 'Campaign Deliverable Ready',
      desc: '12 new Reels submitted for BoAt BassHeads Gen-Z Drop',
      time: '45 mins ago',
      type: 'campaign',
    },
    {
      id: 'N4',
      title: 'Export Generated',
      desc: '4,250 Creator records exported to CSV by Export Team',
      time: '2 hrs ago',
      type: 'export',
    },
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium min-w-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span
            onClick={() => onRouteChange('/admin/dashboard')}
            className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            Admin
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[240px]">
            {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right: Search, Role Switcher, Controls & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Quick Search Trigger */}
        <div className="relative hidden md:block">
          <input
            type="text"
            onClick={() => setShowSearchModal(true)}
            readOnly
            placeholder="Search platform..."
            className="bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-1.5 text-xs w-56 lg:w-64 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 cursor-pointer placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 border-l pl-4 sm:pl-6 border-slate-200 dark:border-slate-800">
          {/* Role Switcher Pill */}
          <select
            value={currentRole.id}
            onChange={(e) => switchDemoRole(e.target.value)}
            className="text-xs bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold rounded px-2 py-1 outline-none cursor-pointer"
            title="Switch active role to test RBAC permissions"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {r.name}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((p) => !p)}
              className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Notifications
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold rounded-full">
                      4 new
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {n.title}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      onRouteChange('/admin/audit');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All Audit Trail Events →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown((p) => !p)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-40 space-y-1">
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                    <Shield className="w-3 h-3" />
                    <span>{currentRole.name}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRouteChange(`/admin/users/${currentUser.id}`);
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Staff Profile</span>
                </button>

                <button
                  onClick={() => {
                    onRouteChange('/admin/settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Platform Settings</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      switchDemoRole('ROLE-SUPER-ADMIN');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset to Super Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Omni Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
          <div
            onClick={() => setShowSearchModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <input
                type="text"
                autoFocus
                value={omniQuery}
                onChange={(e) => setOmniQuery(e.target.value)}
                placeholder="Search across Creators, Brands, Campaigns, Users..."
                className="w-full text-sm bg-transparent border-none focus:outline-hidden text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Shortcuts
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onRouteChange('/admin/creators');
                    setShowSearchModal(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Explore Creators
                    </div>
                    <div className="text-[10px] text-slate-400">12,480 creators in directory</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRouteChange('/admin/brands');
                    setShowSearchModal(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Enterprise Brands
                    </div>
                    <div className="text-[10px] text-slate-400">1,245 brand partners</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRouteChange('/admin/campaigns');
                    setShowSearchModal(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Megaphone className="w-4 h-4 text-pink-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Active Campaigns
                    </div>
                    <div className="text-[10px] text-slate-400">326 ongoing campaigns</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onRouteChange('/admin/roles');
                    setShowSearchModal(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Roles & Permissions
                    </div>
                    <div className="text-[10px] text-slate-400">Fine-grained RBAC Matrix</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
