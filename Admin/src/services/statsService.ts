import { DashboardStats } from '../types';
import * as api from '../lib/api';

export interface DashboardData {
  stats: DashboardStats;
  growth: api.AdminDashboardGrowthPointApi[];
  campaignOverview: api.AdminCampaignOverviewPointApi[];
  categoryDistribution: api.AdminCategoryDistributionPointApi[];
}

export const statsService = {
  getDashboardData: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardData> => {
    return await api.getAdminDashboard(timeRange);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const data = await api.getAdminDashboard('30d');
    return data.stats;
  },

  getUserGrowth: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<api.AdminDashboardGrowthPointApi[]> => {
    const data = await api.getAdminDashboard(timeRange);
    return data.growth;
  },

  getCampaignOverview: async (): Promise<api.AdminCampaignOverviewPointApi[]> => {
    const data = await api.getAdminDashboard('30d');
    return data.campaignOverview;
  },

  getCategoryDistribution: async (): Promise<api.AdminCategoryDistributionPointApi[]> => {
    const data = await api.getAdminDashboard('30d');
    return data.categoryDistribution;
  },
};
