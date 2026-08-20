import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Building2,
  Megaphone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
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
import { auditLogService } from '../../services/auditLogService';
import { DashboardStats, AuditLog } from '../../types';
import { formatCompactNumber, timeAgo } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
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
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [s, g, c, cat, logs] = await Promise.all([
          statsService.getDashboardStats(),
          statsService.getUserGrowth(growthRange),
          statsService.getCampaignOverview(),
          statsService.getCategoryDistribution(),
          auditLogService.getLogs(),
        ]);
        setStats(s);
        setGrowthData(g);
        setCampaignData(c);
        setCategoryData(cat);
        setRecentLogs(logs.slice(0, 6));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [growthRange]);

  const kpis = stats
    ? [
        {
          label: 'Total Creators',
          value: formatCompactNumber(stats.totalCreators),
          subValue: `${stats.verifiedCreators.toLocaleString()} verified`,
          change: '+12.4%',
          isPositive: true,
          icon: Sparkles,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
          route: '/admin/creators',
          permission: 'creators.view',
        },
        {
          label: 'Pending Verification',
          value: stats.pendingCreatorVerification.toString(),
          subValue: 'Requires KYC review',
          change: '-2.3%',
          isPositive: true,
          icon: Clock,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/50',
          route: '/admin/creators',
          permission: 'creators.verify',
        },
        {
          label: 'Total Brands',
          value: formatCompactNumber(stats.totalBrands),
          subValue: `${stats.verifiedBrands.toLocaleString()} verified`,
          change: '+8.1%',
          isPositive: true,
          icon: Building2,
          color: 'text-sky-600 dark:text-sky-400',
          bgColor: 'bg-sky-50 dark:bg-sky-950/50',
          route: '/admin/brands',
          permission: 'brands.view',
        },
        {
          label: 'Active Campaigns',
          value: stats.activeCampaigns.toString(),
          subValue: `${stats.completedCampaigns.toLocaleString()} completed`,
          change: '+15.2%',
          isPositive: true,
          icon: Megaphone,
          color: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-50 dark:bg-pink-950/50',
          route: '/admin/campaigns',
          permission: 'campaigns.view',
        },
        {
          label: 'Internal Staff Users',
          value: stats.internalStaffUsers.toString(),
          subValue: 'Across 8 departments',
          change: '+4.0%',
          isPositive: true,
          icon: Users,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
          route: '/admin/users',
          permission: 'users.view',
        },
      ]
    : [];

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

        <div className="flex items-center gap-2">
          {hasPermission('exports.view') && (
            <button
              onClick={() => onRouteChange('/admin/exports')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export Reports</span>
            </button>
          )}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Creator Categories (1 col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Creator Categories</h3>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Fashion & Beauty</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">34%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tech & Gadgets</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">21%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Fitness & Health</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Gaming & Esports</span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">15%</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL VERIFIED</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {stats ? stats.verifiedCreators.toLocaleString() : '8,720'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Full Width) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Activity</h3>
          {hasPermission('audit_logs.view') && (
            <button
              onClick={() => onRouteChange('/admin/audit')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View All
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3">ENTITY</th>
                <th className="px-4 py-3">ACTION</th>
                <th className="px-4 py-3">PERFORMED BY</th>
                <th className="px-4 py-3">TIME</th>
                <th className="px-4 py-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLogs.map((log) => {
                const isVerified = log.action.includes('VERIFY') || log.action.includes('APPROVED');
                const isDraft = log.action.includes('DRAFT') || log.action.includes('CREATE');
                const isExport = log.action.includes('EXPORT');

                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                      {log.targetName || log.description.split(' ')[0] || 'System'}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        {log.targetId ? `(${log.targetId})` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{log.description}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{log.userName}</td>
                    <td className="px-4 py-3 text-slate-400">{timeAgo(log.timestamp)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : isDraft
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : isExport
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
