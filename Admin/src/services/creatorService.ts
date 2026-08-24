import { Creator, VerificationStatus, AccountStatus } from '../types';
import * as api from '../lib/api';

export type UpdateCreatorPayload = api.AdminCreatorWritePayload;

let creatorsState: Creator[] = [];

const VERIFICATION_TO_BACKEND: Record<VerificationStatus, string> = {
  Verified: 'VERIFIED',
  Pending: 'PENDING',
  Rejected: 'REJECTED',
  Unverified: 'UNVERIFIED',
};

const ACCOUNT_TO_BACKEND: Record<AccountStatus, string> = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
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
    const apiCreators = await api.getAdminCreators();
    creatorsState = apiCreators.map(mapApiCreator);
    return [...creatorsState];
  },

  getCreatorById: async (id: string): Promise<Creator | null> => {
    const apiCreator = await api.getAdminCreator(id);
    const creator = mapApiCreator(apiCreator);
    creatorsState = creatorsState.some((c) => c.id === creator.id)
      ? creatorsState.map((c) => (c.id === creator.id ? creator : c))
      : [creator, ...creatorsState];
    return creator;
  },

  createCreator: async (): Promise<Creator> => {
    throw new Error('Creator creation is not available in the admin frontend.');
  },

  updateCreator: async (id: string, payload: UpdateCreatorPayload): Promise<Creator> => {
    const updated = await api.updateAdminCreator(id, payload);
    const creator = mapApiCreator(updated);
    creatorsState = creatorsState.some((c) => c.id === id)
      ? creatorsState.map((c) => (c.id === id ? creator : c))
      : [creator, ...creatorsState];
    return creator;
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
