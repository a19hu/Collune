import { Campaign, CampaignStatus, CampaignDeliverable } from '../types';
import * as api from '../lib/api';

let campaignsState: Campaign[] = [];

const STATUS_TO_BACKEND: Record<CampaignStatus, string> = {
  Draft: 'DRAFT',
  'Pending Approval': 'DRAFT',
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Completed: 'COMPLETED',
  Cancelled: 'PAUSED',
};

function deliverablesToText(deliverables: CampaignDeliverable[]): string {
  return deliverables.map((d) => d.title).join(', ');
}

function mapApiCampaign(apiCampaign: api.AdminCampaignApi): Campaign {
  return {
    ...apiCampaign,
    category: apiCampaign.category as Campaign['category'],
    platforms: apiCampaign.platforms as Campaign['platforms'],
    status: apiCampaign.status as CampaignStatus,
    deliverables: apiCampaign.deliverables.map((d) => ({ ...d, platform: d.platform as any, type: d.type as any })),
  };
}

export const campaignService = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const apiCampaigns = await api.getAdminCampaigns();
    campaignsState = apiCampaigns.map(mapApiCampaign);
    return [...campaignsState];
  },

  getCampaignById: async (id: string): Promise<Campaign | null> => {
    const apiCampaign = await api.getAdminCampaign(id);
    const campaign = mapApiCampaign(apiCampaign);
    campaignsState = campaignsState.some((c) => c.id === campaign.id)
      ? campaignsState.map((c) => (c.id === campaign.id ? campaign : c))
      : [campaign, ...campaignsState];
    return campaign;
  },



  updateCampaign: async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    const updated = await api.updateAdminCampaign(id, {
      title: updates.title,
      brand_id: updates.brandId,
      category: updates.category,
      description: updates.description,
      objective: updates.objective,
      target_audience: updates.targetAudience,
      platforms: updates.platforms,
      budget: updates.budget,
      deliverables_text: updates.deliverables ? deliverablesToText(updates.deliverables) : undefined,
      start_date: updates.startDate,
      end_date: updates.endDate,
      status: updates.status ? STATUS_TO_BACKEND[updates.status] : undefined,
    });
    const campaign = mapApiCampaign(updated);
    campaignsState = campaignsState.map((c) => (c.id === id ? campaign : c));
    return campaign;
  },

  updateStatus: async (id: string, status: CampaignStatus): Promise<Campaign> => {
    return campaignService.updateCampaign(id, { status });
  },

  deleteCampaign: async (id: string): Promise<boolean> => {
    await api.deleteAdminCampaign(id);
    campaignsState = campaignsState.filter((c) => c.id !== id);
    return true;
  },
};
