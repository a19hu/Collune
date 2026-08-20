import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BreadcrumbItem } from '../common/Breadcrumbs';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  currentRoute?: string;
  onRouteChange: (route: string) => void;
  breadcrumbs?: BreadcrumbItem[];
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeRoute,
  currentRoute,
  onRouteChange,
  breadcrumbs = [],
}) => {
  const route = activeRoute || currentRoute || '/admin/dashboard';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeRoute={route}
        onRouteChange={onRouteChange}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMobileMenuToggle={() => setIsMobileMenuOpen((p) => !p)}
          breadcrumbs={breadcrumbs}
          onRouteChange={onRouteChange}
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
