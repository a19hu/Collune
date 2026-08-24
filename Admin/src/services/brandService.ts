import { Brand, VerificationStatus, AccountStatus } from '../types';
import * as api from '../lib/api';

let brandsState: Brand[] = [];

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
    const apiBrands = await api.getAdminBrands();
    brandsState = apiBrands.map(mapApiBrand);
    return [...brandsState];
  },

  getBrandById: async (id: string): Promise<Brand | null> => {
    const apiBrand = await api.getAdminBrand(id);
    const brand = mapApiBrand(apiBrand);
    brandsState = brandsState.some((b) => b.id === brand.id)
      ? brandsState.map((b) => (b.id === brand.id ? brand : b))
      : [brand, ...brandsState];
    return brand;
  },

  createBrand: async (): Promise<Brand> => {
    throw new Error('Brand creation is not available in the admin frontend.');
  },

  updateBrand: async (): Promise<Brand> => {
    throw new Error('Brand editing is not available in the admin frontend.');
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
