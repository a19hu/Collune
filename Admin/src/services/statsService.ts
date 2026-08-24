import { DashboardStats } from '../types';
import {
  mockDashboardStats,
  mockUserGrowthData,
  mockCampaignOverviewData,
  mockCategoryDistribution,
} from '../mocks/mockData';
import * as api from '../lib/api';

export interface DashboardData {
  stats: DashboardStats;
  growth: api.AdminDashboardGrowthPointApi[];
  campaignOverview: api.AdminCampaignOverviewPointApi[];
  categoryDistribution: api.AdminCategoryDistributionPointApi[];
}

export const statsService = {
  // Single call that fetches every dashboard section from the backend in one go.
  getDashboardData: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardData> => {
    try {
      return await api.getAdminDashboard(timeRange);
    } catch (err) {
      // Not authenticated yet, or backend unreachable — fall back to the mock catalog.
      const [stats, growth, campaignOverview, categoryDistribution] = await Promise.all([
        statsService.getDashboardStats(),
        statsService.getUserGrowth(timeRange),
        statsService.getCampaignOverview(),
        statsService.getCategoryDistribution(),
      ]);
      return { stats, growth, campaignOverview, categoryDistribution };
    }
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockDashboardStats }), 150);
    });
  },

  getUserGrowth: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<api.AdminDashboardGrowthPointApi[]> => {
    return new Promise((resolve) => {
      let data = [...mockUserGrowthData];
      if (timeRange === '7d') {
        data = [
          { name: 'Mon', creators: 12200, brands: 1230 },
          { name: 'Tue', creators: 12260, brands: 1232 },
          { name: 'Wed', creators: 12310, brands: 1238 },
          { name: 'Thu', creators: 12370, brands: 1240 },
          { name: 'Fri', creators: 12410, brands: 1242 },
          { name: 'Sat', creators: 12450, brands: 1244 },
          { name: 'Sun', creators: 12480, brands: 1245 },
        ];
      } else if (timeRange === '30d') {
        data = [
          { name: 'Week 1', creators: 11950, brands: 1210 },
          { name: 'Week 2', creators: 12100, brands: 1222 },
          { name: 'Week 3', creators: 12300, brands: 1236 },
          { name: 'Week 4', creators: 12480, brands: 1245 },
        ];
      } else if (timeRange === '90d') {
        data = [
          { name: 'Jun', creators: 11200, brands: 1150 },
          { name: 'Jul', creators: 11900, brands: 1205 },
          { name: 'Aug', creators: 12480, brands: 1245 },
        ];
      }
      setTimeout(() => resolve(data), 150);
    });
  },

  getCampaignOverview: async (): Promise<api.AdminCampaignOverviewPointApi[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockCampaignOverviewData]), 150);
    });
  },

  getCategoryDistribution: async (): Promise<api.AdminCategoryDistributionPointApi[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockCategoryDistribution]), 150);
    });
  },
};
