import { Creator, VerificationStatus, AccountStatus } from '../types';
import { mockCreators } from '../mocks/mockData';
import * as api from '../lib/api';

let creatorsState: Creator[] = [...mockCreators];

const VERIFICATION_TO_BACKEND: Record<VerificationStatus, string> = {
  Verified: 'VERIFIED',
  Pending: 'PENDING',
  Rejected: 'REJECTED',
  Unverified: 'UNVERIFIED',
};

const ACCOUNT_TO_BACKEND: Record<AccountStatus, string> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Suspended: 'SUSPENDED',
};

function mapApiCreator(apiCreator: api.AdminCreatorApi): Creator {
  return {
    ...apiCreator,
    category: apiCreator.category as Creator['category'],
    verificationStatus: apiCreator.verificationStatus as VerificationStatus,
    accountStatus: apiCreator.accountStatus as AccountStatus,
    socials: apiCreator.socials.map((s) => ({ ...s, platform: s.platform as any })),
    documents: [],
  };
}

export const creatorService = {
  getCreators: async (): Promise<Creator[]> => {
    try {
      const apiCreators = await api.getAdminCreators();
      creatorsState = apiCreators.map(mapApiCreator);
      return [...creatorsState];
    } catch (err) {
      // Not authenticated yet, or backend unreachable — keep working off the mock catalog.
      return [...creatorsState];
    }
  },

  getCreatorById: async (id: string): Promise<Creator | null> => {
    try {
      const apiCreator = await api.getAdminCreator(id);
      const creator = mapApiCreator(apiCreator);
      creatorsState = creatorsState.some((c) => c.id === creator.id)
        ? creatorsState.map((c) => (c.id === creator.id ? creator : c))
        : [creator, ...creatorsState];
      return creator;
    } catch (err) {
      const creator = creatorsState.find((c) => c.id === id) || null;
      return creator ? { ...creator } : null;
    }
  },

  createCreator: async (creatorData: Omit<Creator, 'id' | 'joinedAt'>): Promise<Creator> => {
    return new Promise((resolve) => {
      const newCreator: Creator = {
        ...creatorData,
        id: `CR-${String(creatorsState.length + 1).padStart(3, '0')}`,
        joinedAt: new Date().toISOString(),
      };
      creatorsState = [newCreator, ...creatorsState];
      setTimeout(() => resolve(newCreator), 200);
    });
  },

  updateCreator: async (id: string, updates: Partial<Creator>): Promise<Creator> => {
    return new Promise((resolve, reject) => {
      const index = creatorsState.findIndex((c) => c.id === id);
      if (index === -1) {
        reject(new Error('Creator not found'));
        return;
      }
      creatorsState[index] = { ...creatorsState[index], ...updates };
      setTimeout(() => resolve({ ...creatorsState[index] }), 200);
    });
  },

  updateVerification: async (id: string, status: VerificationStatus): Promise<Creator> => {
    const updated = await api.updateCreatorStatus(id, { verification_status: VERIFICATION_TO_BACKEND[status] });
    const creator = mapApiCreator(updated);
    creatorsState = creatorsState.map((c) => (c.id === id ? creator : c));
    return creator;
  },

  verifyCreator: async (id: string, status: VerificationStatus): Promise<Creator> => {
    return creatorService.updateVerification(id, status);
  },

  updateAccountStatus: async (id: string, status: AccountStatus): Promise<Creator> => {
    const updated = await api.updateCreatorStatus(id, { account_status: ACCOUNT_TO_BACKEND[status] });
    const creator = mapApiCreator(updated);
    creatorsState = creatorsState.map((c) => (c.id === id ? creator : c));
    return creator;
  },

  updateStatus: async (id: string, status: AccountStatus): Promise<Creator> => {
    return creatorService.updateAccountStatus(id, status);
  },

  deleteCreator: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const init = creatorsState.length;
      creatorsState = creatorsState.filter((c) => c.id !== id);
      if (creatorsState.length === init) {
        reject(new Error('Creator not found'));
        return;
      }
      setTimeout(() => resolve(true), 200);
    });
  },

  bulkUpdateVerification: async (ids: string[], status: VerificationStatus): Promise<number> => {
    return new Promise((resolve) => {
      creatorsState = creatorsState.map((c) => (ids.includes(c.id) ? { ...c, verificationStatus: status } : c));
      setTimeout(() => resolve(ids.length), 200);
    });
  },

  bulkUpdateStatus: async (ids: string[], status: AccountStatus): Promise<number> => {
    return new Promise((resolve) => {
      creatorsState = creatorsState.map((c) => (ids.includes(c.id) ? { ...c, accountStatus: status } : c));
      setTimeout(() => resolve(ids.length), 200);
    });
  },
};
