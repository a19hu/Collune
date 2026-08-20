import { Creator, VerificationStatus, AccountStatus } from '../types';
import { mockCreators } from '../mocks/mockData';

let creatorsState: Creator[] = [...mockCreators];

export const creatorService = {
  getCreators: async (): Promise<Creator[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...creatorsState]), 150);
    });
  },

  getCreatorById: async (id: string): Promise<Creator | null> => {
    return new Promise((resolve) => {
      const creator = creatorsState.find((c) => c.id === id || c.creatorCode === id) || null;
      setTimeout(() => resolve(creator ? { ...creator } : null), 100);
    });
  },

  createCreator: async (creatorData: Omit<Creator, 'id' | 'creatorCode' | 'joinedAt'>): Promise<Creator> => {
    return new Promise((resolve) => {
      const nextNum = 10500 + creatorsState.length + 1;
      const newCreator: Creator = {
        ...creatorData,
        id: `CR-${String(creatorsState.length + 1).padStart(3, '0')}`,
        creatorCode: `CR-${nextNum}`,
        joinedAt: new Date().toISOString(),
      };
      creatorsState = [newCreator, ...creatorsState];
      setTimeout(() => resolve(newCreator), 200);
    });
  },

  updateCreator: async (id: string, updates: Partial<Creator>): Promise<Creator> => {
    return new Promise((resolve, reject) => {
      const index = creatorsState.findIndex((c) => c.id === id || c.creatorCode === id);
      if (index === -1) {
        reject(new Error('Creator not found'));
        return;
      }
      creatorsState[index] = { ...creatorsState[index], ...updates };
      setTimeout(() => resolve({ ...creatorsState[index] }), 200);
    });
  },

  updateVerification: async (id: string, status: VerificationStatus): Promise<Creator> => {
    return creatorService.updateCreator(id, { verificationStatus: status });
  },

  verifyCreator: async (id: string, status: VerificationStatus): Promise<Creator> => {
    return creatorService.updateVerification(id, status);
  },

  updateAccountStatus: async (id: string, status: AccountStatus): Promise<Creator> => {
    return creatorService.updateCreator(id, { accountStatus: status });
  },

  updateStatus: async (id: string, status: AccountStatus): Promise<Creator> => {
    return creatorService.updateAccountStatus(id, status);
  },

  deleteCreator: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const init = creatorsState.length;
      creatorsState = creatorsState.filter((c) => c.id !== id && c.creatorCode !== id);
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
