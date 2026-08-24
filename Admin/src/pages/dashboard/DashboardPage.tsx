import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { statsService } from '../../services/statsService';
import { DashboardStats } from '../../types';
import { formatCompactNumber } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface DashboardPageProps {
  onRouteChange: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onRouteChange }) => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [growthRange, setGrowthRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { stats: s, growth, campaignOverview, categoryDistribution } = await statsService.getDashboardData(
          growthRange
        );
        setStats(s);
        setGrowthData(growth);
        setCampaignData(campaignOverview);
        setCategoryData(categoryDistribution);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [growthRange]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Platform Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and management controls for Collune Influencer Ecosystem.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Creators */}
        <div
          onClick={() => hasPermission('creators.view') && onRouteChange('/admin/creators')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Creators</span>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">+12.4%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats ? stats.totalCreators.toLocaleString() : '12,480'}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[70%]" />
            </div>
          </div>
        </div>

        {/* Total Brands */}
        <div
          onClick={() => hasPermission('brands.view') && onRouteChange('/admin/brands')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Brands</span>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">+8.1%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats ? stats.totalBrands.toLocaleString() : '1,245'}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[45%]" />
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div
          onClick={() => hasPermission('campaigns.view') && onRouteChange('/admin/campaigns')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Campaigns</span>
            <span className="text-amber-500 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">-2.3%</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats ? stats.activeCampaigns : '326'}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[30%]" />
            </div>
          </div>
        </div>

        {/* Internal Staff */}
        <div
          onClick={() => hasPermission('users.view') && onRouteChange('/admin/users')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Internal Staff</span>
            <span className="text-slate-400 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {stats ? `${stats.internalStaffUsers} Active` : '38 Active'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats ? stats.internalStaffUsers : '38'}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-500 w-[100%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Platform Growth & Creator Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Platform Growth (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Platform Growth</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Monthly onboarded Creators vs. Brands</p>
            </div>
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
              {(['7d', '30d', '90d', '1y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setGrowthRange(r)}
                  className={`text-[10px] font-bold px-3 py-1 rounded transition-colors cursor-pointer ${
                    growthRange === r
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatCompactNumber(v)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="creators"
                  name="Creators"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="brands"
                  name="Brands"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Campaign Status & Category Distribution (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Status Overview (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Campaign Status Overview</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Monthly campaigns by lifecycle stage</p>
            </div>
            {hasPermission('campaigns.view') && (
              <button
                onClick={() => onRouteChange('/admin/campaigns')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                View All
              </button>
            )}
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="active" name="Active" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="draft" name="Draft" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="paused" name="Paused" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-2">Creator Category Split</h3>
          <p className="text-[11px] text-slate-400 -mt-1 mb-2">Share of creators by primary category</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {categoryData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
