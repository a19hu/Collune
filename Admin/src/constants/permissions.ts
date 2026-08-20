import { Permission, PermissionDefinition, ModuleName, Role } from '../types';

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  {
    key: 'dashboard.view',
    label: 'View Dashboard',
    module: 'Dashboard',
    description: 'Access the main dashboard, KPI metrics, and top-level analytics charts',
  },

  // Users
  {
    key: 'users.view',
    label: 'View Staff Users',
    module: 'Users',
    description: 'Browse internal staff members list and profile details',
  },
  {
    key: 'users.create',
    label: 'Create Staff User',
    module: 'Users',
    description: 'Add new staff user accounts to the platform',
  },
  {
    key: 'users.edit',
    label: 'Edit Staff User',
    module: 'Users',
    description: 'Modify staff profile, department, and account details',
  },
  {
    key: 'users.delete',
    label: 'Delete Staff User',
    module: 'Users',
    description: 'Permanently remove internal staff accounts',
  },
  {
    key: 'users.activate',
    label: 'Activate User',
    module: 'Users',
    description: 'Restore access to suspended or inactive staff',
  },
  {
    key: 'users.deactivate',
    label: 'Deactivate User',
    module: 'Users',
    description: 'Suspend or disable internal staff accounts',
  },
  {
    key: 'users.export',
    label: 'Export Users Data',
    module: 'Users',
    description: 'Download staff user directories in CSV/Excel format',
  },

  // Roles
  {
    key: 'roles.view',
    label: 'View Roles',
    module: 'Roles',
    description: 'Inspect roles and their associated permission matrices',
  },
  {
    key: 'roles.create',
    label: 'Create Role',
    module: 'Roles',
    description: 'Create custom roles with tailored permission lists',
  },
  {
    key: 'roles.edit',
    label: 'Edit Role',
    module: 'Roles',
    description: 'Modify existing role names, descriptions, and permission matrices',
  },
  {
    key: 'roles.delete',
    label: 'Delete Role',
    module: 'Roles',
    description: 'Delete custom roles not currently locked by the system',
  },
  {
    key: 'roles.assign',
    label: 'Assign Roles',
    module: 'Roles',
    description: 'Assign or reassign roles to staff members',
  },

  // Creators
  {
    key: 'creators.view',
    label: 'View Creators',
    module: 'Creators',
    description: 'Browse creator profiles, social metrics, and documents',
  },
  {
    key: 'creators.create',
    label: 'Create Creator',
    module: 'Creators',
    description: 'Manually register a new creator profile',
  },
  {
    key: 'creators.edit',
    label: 'Edit Creator',
    module: 'Creators',
    description: 'Modify creator details, social handles, and categories',
  },
  {
    key: 'creators.verify',
    label: 'Verify Creator Profile',
    module: 'Creators',
    description: 'Mark creator KYC and identity as verified badge',
  },
  {
    key: 'creators.approve',
    label: 'Approve Creator Application',
    module: 'Creators',
    description: 'Approve pending creator onboardings',
  },
  {
    key: 'creators.reject',
    label: 'Reject Creator Application',
    module: 'Creators',
    description: 'Reject fraudulent or non-compliant creator profiles',
  },
  {
    key: 'creators.activate',
    label: 'Activate Creator',
    module: 'Creators',
    description: 'Enable disabled or unblocked creator profiles',
  },
  {
    key: 'creators.deactivate',
    label: 'Deactivate Creator',
    module: 'Creators',
    description: 'Suspend or blacklist creator accounts',
  },
  {
    key: 'creators.delete',
    label: 'Delete Creator',
    module: 'Creators',
    description: 'Permanently remove creator records from platform',
  },
  {
    key: 'creators.export',
    label: 'Export Creator Data',
    module: 'Creators',
    description: 'Download creator lists, audience analytics, and contact info',
  },

  // Brands
  {
    key: 'brands.view',
    label: 'View Brands',
    module: 'Brands',
    description: 'Browse brand profiles, contact details, and campaigns',
  },
  {
    key: 'brands.create',
    label: 'Create Brand',
    module: 'Brands',
    description: 'Onboard new enterprise brands and advertisers',
  },
  {
    key: 'brands.edit',
    label: 'Edit Brand',
    module: 'Brands',
    description: 'Update brand contact information, billing, and settings',
  },
  {
    key: 'brands.verify',
    label: 'Verify Brand',
    module: 'Brands',
    description: 'Verify brand business registration documents & GST/Tax ID',
  },
  {
    key: 'brands.approve',
    label: 'Approve Brand',
    module: 'Brands',
    description: 'Approve brand onboarding applications',
  },
  {
    key: 'brands.reject',
    label: 'Reject Brand',
    module: 'Brands',
    description: 'Reject non-compliant brand registration applications',
  },
  {
    key: 'brands.activate',
    label: 'Activate Brand',
    module: 'Brands',
    description: 'Enable active status for brands',
  },
  {
    key: 'brands.deactivate',
    label: 'Deactivate Brand',
    module: 'Brands',
    description: 'Temporarily suspend brand account access',
  },
  {
    key: 'brands.delete',
    label: 'Delete Brand',
    module: 'Brands',
    description: 'Permanently remove brand accounts',
  },
  {
    key: 'brands.export',
    label: 'Export Brand Data',
    module: 'Brands',
    description: 'Download brand directory, spend histories, and campaign records',
  },

  // Campaigns
  {
    key: 'campaigns.view',
    label: 'View Campaigns',
    module: 'Campaigns',
    description: 'Inspect all active, completed, and draft campaigns',
  },
  {
    key: 'campaigns.create',
    label: 'Create Campaign',
    module: 'Campaigns',
    description: 'Launch new influencer marketing campaigns for brands',
  },
  {
    key: 'campaigns.edit',
    label: 'Edit Campaign',
    module: 'Campaigns',
    description: 'Modify campaign requirements, budgets, and timelines',
  },
  {
    key: 'campaigns.approve',
    label: 'Approve Campaign',
    module: 'Campaigns',
    description: 'Approve campaign briefs before public creator casting',
  },
  {
    key: 'campaigns.pause',
    label: 'Pause/Resume Campaign',
    module: 'Campaigns',
    description: 'Temporarily pause or restart active campaign deliverables',
  },
  {
    key: 'campaigns.close',
    label: 'Close Campaign',
    module: 'Campaigns',
    description: 'Mark campaigns as completed and finalize payouts',
  },
  {
    key: 'campaigns.delete',
    label: 'Delete Campaign',
    module: 'Campaigns',
    description: 'Permanently remove draft or test campaigns',
  },
  {
    key: 'campaigns.export',
    label: 'Export Campaign Data',
    module: 'Campaigns',
    description: 'Download campaign metrics, ROI, and deliverable stats',
  },

  // Exports
  {
    key: 'exports.view',
    label: 'View Data Exports',
    module: 'Exports',
    description: 'Access the data export hub and view historical exports',
  },
  {
    key: 'exports.creator',
    label: 'Export Creator Datasets',
    module: 'Exports',
    description: 'Generate and download creator CSV/Excel datasets',
  },
  {
    key: 'exports.brand',
    label: 'Export Brand Datasets',
    module: 'Exports',
    description: 'Generate and download brand directory datasets',
  },
  {
    key: 'exports.campaign',
    label: 'Export Campaign Datasets',
    module: 'Exports',
    description: 'Generate and download campaign performance datasets',
  },
  {
    key: 'exports.user',
    label: 'Export Staff User Datasets',
    module: 'Exports',
    description: 'Generate and download internal staff rosters',
  },

  // Audit Logs
  {
    key: 'audit_logs.view',
    label: 'View Audit Logs',
    module: 'Audit Logs',
    description: 'Browse detailed audit trail of all staff activities and security events',
  },

  // Settings
  {
    key: 'settings.view',
    label: 'View System Settings',
    module: 'Settings',
    description: 'View platform configuration, currency, timezone, and security params',
  },
  {
    key: 'settings.edit',
    label: 'Edit System Settings',
    module: 'Settings',
    description: 'Update platform-wide settings and integrations',
  },
];

export const MODULES: ModuleName[] = [
  'Dashboard',
  'Users',
  'Roles',
  'Creators',
  'Brands',
  'Campaigns',
  'Exports',
  'Audit Logs',
  'Settings',
];

export interface ModulePermissionGroup {
  name: ModuleName;
  permissions: {
    id: Permission;
    key: Permission;
    name: string;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_MODULES: ModulePermissionGroup[] = MODULES.map((mod) => ({
  name: mod,
  permissions: ALL_PERMISSIONS.filter((p) => p.module === mod).map((p) => ({
    id: p.key,
    key: p.key,
    name: p.label,
    label: p.label,
    description: p.description,
  })),
}));

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'ROLE-SUPER-ADMIN',
    name: 'Super Admin',
    description: 'Full unrestricted platform access with all administrative privileges across all modules.',
    permissions: ['*'],
    userCount: 3,
    isSystem: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'ROLE-ADMIN',
    name: 'Admin',
    description: 'General system administration with broad operational and management access.',
    permissions: [
      'dashboard.view',
      'users.view', 'users.create', 'users.edit', 'users.activate', 'users.deactivate', 'users.export',
      'roles.view',
      'creators.view', 'creators.create', 'creators.edit', 'creators.verify', 'creators.approve', 'creators.reject', 'creators.activate', 'creators.deactivate', 'creators.export',
      'brands.view', 'brands.create', 'brands.edit', 'brands.verify', 'brands.approve', 'brands.reject', 'brands.activate', 'brands.deactivate', 'brands.export',
      'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.approve', 'campaigns.pause', 'campaigns.close', 'campaigns.export',
      'exports.view', 'exports.creator', 'exports.brand', 'exports.campaign', 'exports.user',
      'audit_logs.view',
      'settings.view',
    ],
    userCount: 5,
    isSystem: false,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ROLE-OPS-MANAGER',
    name: 'Operations Manager',
    description: 'Responsible for daily operations, managing creators, brands, and campaign workflows.',
    permissions: [
      'dashboard.view',
      'creators.view', 'creators.create', 'creators.edit', 'creators.verify', 'creators.approve', 'creators.reject', 'creators.activate', 'creators.deactivate', 'creators.export',
      'brands.view', 'brands.create', 'brands.edit', 'brands.verify', 'brands.approve', 'brands.reject', 'brands.activate', 'brands.deactivate', 'brands.export',
      'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.approve', 'campaigns.pause', 'campaigns.close', 'campaigns.export',
      'exports.view', 'exports.creator', 'exports.brand', 'exports.campaign',
      'audit_logs.view',
    ],
    userCount: 8,
    isSystem: false,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2026-02-15T08:30:00Z',
  },
  {
    id: 'ROLE-CREATOR-MANAGER',
    name: 'Creator Manager',
    description: 'Focuses on creator discovery, onboarding, vetting, KYC verification, and support.',
    permissions: [
      'dashboard.view',
      'creators.view', 'creators.create', 'creators.edit', 'creators.verify', 'creators.approve', 'creators.reject', 'creators.activate', 'creators.deactivate',
      'campaigns.view',
      'brands.view',
    ],
    userCount: 7,
    isSystem: false,
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2026-03-01T11:20:00Z',
  },
  {
    id: 'ROLE-CAMPAIGN-MANAGER',
    name: 'Campaign Manager',
    description: 'Coordinates end-to-end brand campaigns, creator casting, deliverable tracking, and execution.',
    permissions: [
      'dashboard.view',
      'campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.approve', 'campaigns.pause', 'campaigns.close',
      'creators.view',
      'brands.view',
    ],
    userCount: 6,
    isSystem: false,
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-03-05T09:40:00Z',
  },
  {
    id: 'ROLE-BRAND-MANAGER',
    name: 'Brand Manager',
    description: 'Manages enterprise brand partnerships, account onboarding, billing profiles, and campaigns.',
    permissions: [
      'dashboard.view',
      'brands.view', 'brands.create', 'brands.edit', 'brands.verify', 'brands.approve', 'brands.reject', 'brands.activate', 'brands.deactivate',
      'campaigns.view', 'campaigns.create', 'campaigns.edit',
      'creators.view',
    ],
    userCount: 4,
    isSystem: false,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-03-10T14:15:00Z',
  },
  {
    id: 'ROLE-EXPORT-TEAM',
    name: 'Export Team',
    description: 'Read-only access across platform entities with high-volume data export capabilities.',
    permissions: [
      'dashboard.view',
      'creators.view', 'creators.export',
      'brands.view', 'brands.export',
      'campaigns.view', 'campaigns.export',
      'users.view', 'users.export',
      'exports.view', 'exports.creator', 'exports.brand', 'exports.campaign', 'exports.user',
    ],
    userCount: 4,
    isSystem: false,
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2026-03-12T16:00:00Z',
  },
  {
    id: 'ROLE-FINANCE-MANAGER',
    name: 'Finance Manager',
    description: 'Oversees campaign budgets, payouts, brand invoices, and financial exports.',
    permissions: [
      'dashboard.view',
      'brands.view',
      'campaigns.view',
      'creators.view',
      'exports.view', 'exports.campaign', 'exports.brand',
      'audit_logs.view',
    ],
    userCount: 3,
    isSystem: false,
    createdAt: '2025-03-20T00:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z',
  },
  {
    id: 'ROLE-SUPPORT-EXEC',
    name: 'Support Executive',
    description: 'Customer service staff with read-only visibility to resolve creator and brand inquiries.',
    permissions: [
      'dashboard.view',
      'creators.view',
      'brands.view',
      'campaigns.view',
    ],
    userCount: 5,
    isSystem: false,
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
];
