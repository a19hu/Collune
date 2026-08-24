export type Permission =
  // Dashboard
  | 'dashboard.view'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.activate'
  | 'users.deactivate'
  | 'users.export'
  // Roles
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete'
  | 'roles.assign'
  // Creators
  | 'creators.view'
  | 'creators.create'
  | 'creators.edit'
  | 'creators.verify'
  | 'creators.approve'
  | 'creators.reject'
  | 'creators.activate'
  | 'creators.deactivate'
  | 'creators.delete'
  | 'creators.export'
  // Brands
  | 'brands.view'
  | 'brands.create'
  | 'brands.edit'
  | 'brands.verify'
  | 'brands.approve'
  | 'brands.reject'
  | 'brands.activate'
  | 'brands.deactivate'
  | 'brands.delete'
  | 'brands.export'
  // Campaigns
  | 'campaigns.view'
  | 'campaigns.create'
  | 'campaigns.edit'
  | 'campaigns.approve'
  | 'campaigns.pause'
  | 'campaigns.close'
  | 'campaigns.delete'
  | 'campaigns.export'
  // Shortlists
  | 'shortlists.view'
  | 'shortlists.export'
  // Exports
  | 'exports.view'
  | 'exports.creator'
  | 'exports.brand'
  | 'exports.campaign'
  | 'exports.user'
  // Wildcard for Super Admin
  | '*';

export type ModuleName =
  | 'Dashboard'
  | 'Users'
  | 'Roles'
  | 'Creators'
  | 'Brands'
  | 'Campaigns'
  | 'Shortlists'
  | 'Exports';

export interface PermissionDefinition {
  key: Permission;
  label: string;
  module: ModuleName;
  description: string;
}

export type Department =
  | 'Operations'
  | 'Campaign Management'
  | 'Creator Management'
  | 'Brand Management'
  | 'Finance'
  | 'Support'
  | 'Export/Data'
  | 'Administration';

export type UserStatus = 'Active' | 'Inactive';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystem?: boolean; // Cannot be deleted if Super Admin
  createdAt: string;
  updatedAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department: Department;
  roleId: string;
  roleName: string;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
}

export type CreatorCategory =
  | 'Fashion'
  | 'Beauty'
  | 'Technology'
  | 'Gaming'
  | 'Food'
  | 'Travel'
  | 'Fitness'
  | 'Finance'
  | 'Lifestyle'
  | 'Entertainment';

export type VerificationStatus = 'Verified' | 'Pending' | 'Rejected' | 'Unverified';
export type AccountStatus = 'Active' | 'Inactive';

export interface SocialProfile {
  platform: 'Instagram' | 'YouTube' | 'LinkedIn' | 'X' | 'TikTok';
  handle: string;
  followers: number;
  engagementRate: number; // in percentage e.g. 5.8
  url: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  avatarUrl: string;
  coverUrl?: string;
  bio: string;
  category: CreatorCategory;
  languages: string[];
  location: string;
  city: string;
  country: string;
  totalFollowers: number;
  primaryEngagementRate: number;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  socials: SocialProfile[];
  completedCampaigns: number;
  joinedAt: string;
  documents?: {
    type: string;
    name: string;
    verified: boolean;
    uploadDate: string;
  }[];
}

export type BrandIndustry =
  | 'E-Commerce'
  | 'Fashion & Apparel'
  | 'Consumer Electronics'
  | 'Beauty & Personal Care'
  | 'Food & Beverages'
  | 'Fintech'
  | 'Health & Wellness'
  | 'Gaming & Entertainment'
  | 'Travel & Hospitality';

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  industry: BrandIndustry;
  website: string;
  email: string;
  phone: string;
  address: string;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  totalCampaigns: number;
  activeCampaigns: number;
  creatorsHired: number;
  totalSpend: number;
  joinedAt: string;
  description: string;
  invoices?: {
    id: string;
    amount: number;
    date: string;
    status: 'Paid' | 'Pending' | 'Overdue';
  }[];
}

export type CampaignStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled';

export interface CampaignDeliverable {
  id: string;
  title: string;
  platform: 'Instagram' | 'YouTube' | 'LinkedIn' | 'X';
  type: 'Reel' | 'Story' | 'Post' | 'Video' | 'Short';
  quantity: number;
  completedQuantity: number;
  dueDate: string;
}

export interface Campaign {
  id: string;
  campaignCode: string; // e.g. CMP-2048
  title: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  category: CreatorCategory;
  description: string;
  objective: string;
  targetAudience: string;
  platforms: ('Instagram' | 'YouTube' | 'LinkedIn' | 'X')[];
  budget: number;
  creatorsRequired: number;
  creatorsSelected: number;
  applicationsCount: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  campaignManager: string;
  deliverables: CampaignDeliverable[];
  deliverablesTotal: number;
  deliverablesCompleted: number;
  createdAt: string;
  impressionsCount?: number;
  engagementCount?: number;
  roi?: number;
}

export type ExportType = 'Creator Data' | 'Brand Data' | 'Campaign Data' | 'Internal User Data';

export type ShortlistStatus = 'Draft' | 'Submitted';

export interface ShortlistCreatorRef {
  id: string;
  name: string;
  avatarUrl: string;
  category: CreatorCategory | string;
  platform: 'Instagram' | 'YouTube' | 'LinkedIn' | 'X';
  followers: number;
}

export interface Shortlist {
  id: string;
  shortlistCode: string; // e.g. SL-5012
  title: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  status: ShortlistStatus;
  purpose: string;
  notes: string;
  platforms: ('Instagram' | 'YouTube' | 'LinkedIn' | 'X')[];
  categories: string;
  audience: string;
  budgetRange: string;
  startDate: string;
  endDate: string;
  creators: ShortlistCreatorRef[];
  createdAt: string;
  updatedAt: string;
}
export type ExportFormat = 'CSV' | 'Excel' | 'JSON';
export type ExportStatus = 'Completed' | 'Processing' | 'Failed';

export interface ExportRecord {
  id: string;
  exportCode: string; // e.g. EXP-9041
  type: ExportType;
  requestedBy: string;
  requestedByRole: string;
  recordsCount: number;
  format: ExportFormat;
  status: ExportStatus;
  filtersApplied: string;
  downloadUrl?: string;
  createdAt: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VERIFY'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'ACTIVATE'
  | 'DEACTIVATE';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: ModuleName;
  description: string;
  targetId?: string;
  ipAddress: string;
  timestamp: string;
}

export interface DashboardStats {
  totalCreators: number;
  verifiedCreators: number;
  pendingCreatorVerification: number;
  totalBrands: number;
  verifiedBrands: number;
  activeCampaigns: number;
  completedCampaigns: number;
  internalStaffUsers: number;
  creatorsGrowthRate: number; // e.g. 12.4%
  brandsGrowthRate: number; // e.g. 8.1%
  campaignsGrowthRate: number; // e.g. 15.2%
  spendGrowthRate: number;
}

export interface TablePagination {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
