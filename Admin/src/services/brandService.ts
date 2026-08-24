import { Brand, VerificationStatus, AccountStatus } from '../types';
import { mockBrands } from '../mocks/mockData';
import * as api from '../lib/api';

let brandsState: Brand[] = [...mockBrands];

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

function mapApiBrand(apiBrand: api.AdminBrandApi): Brand {
  return {
    ...apiBrand,
    industry: apiBrand.industry as Brand['industry'],
    verificationStatus: apiBrand.verificationStatus as VerificationStatus,
    accountStatus: apiBrand.accountStatus as AccountStatus,
    invoices: [],
  };
}

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    try {
      const apiBrands = await api.getAdminBrands();
      brandsState = apiBrands.map(mapApiBrand);
      return [...brandsState];
    } catch (err) {
      // Not authenticated yet, or backend unreachable — keep working off the mock catalog.
      return [...brandsState];
    }
  },

  getBrandById: async (id: string): Promise<Brand | null> => {
    try {
      const apiBrand = await api.getAdminBrand(id);
      const brand = mapApiBrand(apiBrand);
      brandsState = brandsState.some((b) => b.id === brand.id)
        ? brandsState.map((b) => (b.id === brand.id ? brand : b))
        : [brand, ...brandsState];
      return brand;
    } catch (err) {
      const brand = brandsState.find((b) => b.id === id) || null;
      return brand ? { ...brand } : null;
    }
  },

  createBrand: async (brandData: Omit<Brand, 'id' | 'joinedAt' | 'totalCampaigns' | 'activeCampaigns' | 'creatorsHired' | 'totalSpend'>): Promise<Brand> => {
    return new Promise((resolve) => {
      const newBrand: Brand = {
        ...brandData,
        id: `BR-${String(brandsState.length + 1).padStart(3, '0')}`,
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
      const index = brandsState.findIndex((b) => b.id === id);
      if (index === -1) {
        reject(new Error('Brand not found'));
        return;
      }
      brandsState[index] = { ...brandsState[index], ...updates };
      setTimeout(() => resolve({ ...brandsState[index] }), 200);
    });
  },

  updateVerification: async (id: string, status: VerificationStatus): Promise<Brand> => {
    const updated = await api.updateBrandStatus(id, { verification_status: VERIFICATION_TO_BACKEND[status] });
    const brand = mapApiBrand(updated);
    brandsState = brandsState.map((b) => (b.id === id ? brand : b));
    return brand;
  },

  verifyBrand: async (id: string, status: VerificationStatus): Promise<Brand> => {
    return brandService.updateVerification(id, status);
  },

  updateAccountStatus: async (id: string, status: AccountStatus): Promise<Brand> => {
    const updated = await api.updateBrandStatus(id, { account_status: ACCOUNT_TO_BACKEND[status] });
    const brand = mapApiBrand(updated);
    brandsState = brandsState.map((b) => (b.id === id ? brand : b));
    return brand;
  },

  updateStatus: async (id: string, status: AccountStatus): Promise<Brand> => {
    return brandService.updateAccountStatus(id, status);
  },

  deleteBrand: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const init = brandsState.length;
      brandsState = brandsState.filter((b) => b.id !== id);
      if (brandsState.length === init) {
        reject(new Error('Brand not found'));
        return;
      }
      setTimeout(() => resolve(true), 200);
    });
  },
};
