import { Brand, VerificationStatus, AccountStatus } from '../types';
import { mockBrands } from '../mocks/mockData';

let brandsState: Brand[] = [...mockBrands];

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...brandsState]), 150);
    });
  },

  getBrandById: async (id: string): Promise<Brand | null> => {
    return new Promise((resolve) => {
      const brand = brandsState.find((b) => b.id === id || b.brandCode === id) || null;
      setTimeout(() => resolve(brand ? { ...brand } : null), 100);
    });
  },

  createBrand: async (brandData: Omit<Brand, 'id' | 'brandCode' | 'joinedAt' | 'totalCampaigns' | 'activeCampaigns' | 'creatorsHired' | 'totalSpend'>): Promise<Brand> => {
    return new Promise((resolve) => {
      const nextNum = 8040 + brandsState.length + 1;
      const newBrand: Brand = {
        ...brandData,
        id: `BR-${String(brandsState.length + 1).padStart(3, '0')}`,
        brandCode: `BR-${nextNum}`,
        totalCampaigns: 0,
        activeCampaigns: 0,
        creatorsHired: 0,
        totalSpend: 0,
        joinedAt: new Date().toISOString(),
      };
      brandsState = [newBrand, ...brandsState];
      setTimeout(() => resolve(newBrand), 200);
    });
  },

  updateBrand: async (id: string, updates: Partial<Brand>): Promise<Brand> => {
    return new Promise((resolve, reject) => {
      const index = brandsState.findIndex((b) => b.id === id || b.brandCode === id);
      if (index === -1) {
        reject(new Error('Brand not found'));
        return;
      }
      brandsState[index] = { ...brandsState[index], ...updates };
      setTimeout(() => resolve({ ...brandsState[index] }), 200);
    });
  },

  updateVerification: async (id: string, status: VerificationStatus): Promise<Brand> => {
    return brandService.updateBrand(id, { verificationStatus: status });
  },

  verifyBrand: async (id: string, status: VerificationStatus): Promise<Brand> => {
    return brandService.updateVerification(id, status);
  },

  updateAccountStatus: async (id: string, status: AccountStatus): Promise<Brand> => {
    return brandService.updateBrand(id, { accountStatus: status });
  },

  updateStatus: async (id: string, status: AccountStatus): Promise<Brand> => {
    return brandService.updateAccountStatus(id, status);
  },

  deleteBrand: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const init = brandsState.length;
      brandsState = brandsState.filter((b) => b.id !== id && b.brandCode !== id);
      if (brandsState.length === init) {
        reject(new Error('Brand not found'));
        return;
      }
      setTimeout(() => resolve(true), 200);
    });
  },
};
