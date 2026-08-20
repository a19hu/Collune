import { Campaign, CampaignStatus } from '../types';
import { mockCampaigns } from '../mocks/mockData';

let campaignsState: Campaign[] = [...mockCampaigns];

export const campaignService = {
  getCampaigns: async (): Promise<Campaign[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...campaignsState]), 150);
    });
  },

  getCampaignById: async (id: string): Promise<Campaign | null> => {
    return new Promise((resolve) => {
      const campaign = campaignsState.find((c) => c.id === id || c.campaignCode === id) || null;
      setTimeout(() => resolve(campaign ? { ...campaign } : null), 100);
    });
  },

  createCampaign: async (campaignData: Omit<Campaign, 'id' | 'campaignCode' | 'createdAt' | 'deliverablesTotal' | 'deliverablesCompleted' | 'creatorsSelected' | 'applicationsCount'>): Promise<Campaign> => {
    return new Promise((resolve) => {
      const nextNum = 2050 + campaignsState.length + 1;
      const deliverablesTotal = campaignData.deliverables.reduce((acc, d) => acc + d.quantity, 0);
      const newCampaign: Campaign = {
        ...campaignData,
        id: `CMP-${String(campaignsState.length + 1).padStart(3, '0')}`,
        campaignCode: `CMP-${nextNum}`,
        creatorsSelected: 0,
        applicationsCount: 0,
        deliverablesTotal,
        deliverablesCompleted: 0,
        createdAt: new Date().toISOString(),
      };
      campaignsState = [newCampaign, ...campaignsState];
      setTimeout(() => resolve(newCampaign), 200);
    });
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    return new Promise((resolve, reject) => {
      const index = campaignsState.findIndex((c) => c.id === id || c.campaignCode === id);
      if (index === -1) {
        reject(new Error('Campaign not found'));
        return;
      }
      campaignsState[index] = { ...campaignsState[index], ...updates };
      setTimeout(() => resolve({ ...campaignsState[index] }), 200);
    });
  },

  updateStatus: async (id: string, status: CampaignStatus): Promise<Campaign> => {
    return campaignService.updateCampaign(id, { status });
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const init = campaignsState.length;
      campaignsState = campaignsState.filter((c) => c.id !== id && c.campaignCode !== id);
      if (campaignsState.length === init) {
        reject(new Error('Campaign not found'));
        return;
      }
      setTimeout(() => resolve(true), 200);
    });
  },
};
