// Minimal real API client for the Admin portal — login, staff users, and roles
// are backed by the Django backend; other modules remain mock-driven for now.

const DEFAULT_API_ORIGIN = 'https://collune-backend-727341248620.asia-south1.run.app';

function resolveApiBaseUrl() {
  const raw = String((import.meta as any).env?.VITE_API_BASE_URL || '').trim();
  if (!raw || raw === 'undefined' || raw === 'null') {
    return `${DEFAULT_API_ORIGIN}/api/v1`;
  }
  return `${raw.replace(/\/+$/, '')}/api/v1`;
}

const API_BASE_URL = resolveApiBaseUrl();
const SESSION_KEY = 'collune_admin_session';

export interface StoredSession {
  access: string;
  refresh: string;
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

type ApiError = { error?: string; detail?: string; message?: string };

function formatApiError(data: unknown): string {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return 'Request failed';
  const apiError = data as ApiError & Record<string, unknown>;
  if (apiError.error || apiError.detail || apiError.message) {
    return String(apiError.error || apiError.detail || apiError.message);
  }
  for (const [key, value] of Object.entries(apiError)) {
    if (typeof value === 'string') return `${key}: ${value}`;
    if (Array.isArray(value) && value.length > 0) return `${key}: ${String(value[0])}`;
  }
  return 'Request failed';
}

async function apiRequest<T>(path: string, init: RequestInit = {}, authed = false): Promise<T> {
  const session = authed ? getSession() : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(session ? { Authorization: `Bearer ${session.access}` } : {}),
    },
  });

  const text = res.status === 204 ? '' : await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid API response (${res.status} ${res.statusText || 'Unknown'}): ${text.slice(0, 160)}`);
    }
  }

  if (!res.ok) {
    throw new Error(text ? formatApiError(data) : `Request failed (${res.status} ${res.statusText || 'Unknown'})`);
  }
  return data as T;
}

function apiPost<T>(path: string, body: unknown, authed = false) {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }, authed);
}

function apiPatch<T>(path: string, body: unknown, authed = false) {
  return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, authed);
}

function apiDelete<T>(path: string, authed = false) {
  return apiRequest<T>(path, { method: 'DELETE' }, authed);
}

export interface AdminRolePermissionsPayload {
  roleId: string;
  roleName: string;
  isWildcard: boolean;
  permissions: string[];
}

export interface LoginApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  verification_status: string;
  adminRole?: AdminRolePermissionsPayload | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  refresh: string;
  access: string;
  user: LoginApiUser;
}

export function login(email: string, password: string) {
  return apiPost<LoginResponse>('/auth/login/', { username: email, password });
}

export function signout() {
  return apiPost<{ message: string }>('/auth/signout/', {}, true);
}

export interface AdminRoleApi {
  role_id: string;
  name: string;
  description: string;
  permissions: string[];
  is_wildcard: boolean;
  is_system: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export function getAdminRoles() {
  return apiRequest<{ data: AdminRoleApi[] }>('/admin/roles/', {}, true).then((res) => res.data);
}

export interface AdminRoleWritePayload {
  name: string;
  description: string;
  permissions: string[];
}

export function createAdminRole(payload: AdminRoleWritePayload) {
  return apiPost<{ role: AdminRoleApi }>('/admin/roles/', payload, true).then((res) => res.role);
}

export function updateAdminRole(roleId: string, payload: Partial<AdminRoleWritePayload>) {
  return apiPatch<{ role: AdminRoleApi }>(`/admin/roles/${roleId}/`, payload, true).then((res) => res.role);
}

export function deleteAdminRole(roleId: string, unassignStaff = false) {
  const query = unassignStaff ? '?unassign_staff=true' : '';
  return apiDelete<void>(`/admin/roles/${roleId}/${query}`, true);
}

export interface AdminManagedUserApi {
  user_id: string;
  name: string;
  email: string;
  phone_no: string | null;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  userrole: {
    role_name: string;
    permissions: string;
    Purpose: string | null;
    assigned_role?: { role_id: string; name: string; is_wildcard: boolean; permissions: string[] };
  } | null;
}

export function getStaffUsers() {
  return apiRequest<{ data: AdminManagedUserApi[] }>('/admin/users/', {}, true).then((res) => res.data);
}

export function getStaffUser(userId: string) {
  return apiRequest<{ user: AdminManagedUserApi }>(`/admin/users/${userId}/`, {}, true).then((res) => res.user);
}

export interface UpdateStaffUserPayload {
  name?: string;
  email?: string;
  phone_no?: string;
  assigned_role_id?: string;
  assigned_role_name?: string;
  is_active?: boolean;
}

export function updateStaffUser(userId: string, payload: UpdateStaffUserPayload) {
  return apiPatch<{ user: AdminManagedUserApi }>(`/admin/users/${userId}/`, payload, true).then((res) => res.user);
}

export function deleteStaffUser(userId: string) {
  return apiDelete<void>(`/admin/users/${userId}/`, true);
}

export interface CreateStaffUserPayload {
  name: string;
  email: string;
  phone_no?: string;
  password: string;
  assigned_role_name: string;
  is_active?: boolean;
}

export function createStaffUser(payload: CreateStaffUserPayload) {
  return apiPost<{ user: AdminManagedUserApi }>('/admin/users/', payload, true).then((res) => res.user);
}

export interface AdminCreatorSocialApi {
  platform: string;
  handle: string;
  followers: number;
  engagementRate: number;
  url: string;
}

export interface AdminCreatorApi {
  id: string;
  name: string;
  displayName?: string;
  handle: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  about?: string;
  category: string;
  languages: string[];
  collaborationPreferences?: string[];
  workWith?: string[];
  location: string;
  city: string;
  country: string;
  state?: string;
  district?: string;
  postalCode?: string;
  streetAddress?: string;
  gender?: string;
  isProfileVisible?: boolean;
  totalFollowers: number;
  primaryEngagementRate: number;
  verificationStatus: string;
  accountStatus: string;
  socials: AdminCreatorSocialApi[];
  completedCampaigns: number;
  joinedAt: string;
  documents: unknown[];
}

export function getAdminCreators() {
  return apiRequest<{ data: AdminCreatorApi[] }>('/admin/creators/', {}, true).then((res) => res.data);
}

export function getAdminCreator(creatorId: string) {
  return apiRequest<{ creator: AdminCreatorApi }>(`/admin/creators/${creatorId}/`, {}, true).then((res) => res.creator);
}

export interface AdminCreatorWritePayload {
  name?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  category?: string;
  bio?: string;
  about?: string;
  gender?: string;
  languages?: string[];
  collaborationPreferences?: string[];
  workWith?: string[];
  location?: string;
  city?: string;
  state?: string;
  district?: string;
  country?: string;
  postalCode?: string;
  streetAddress?: string;
  isProfileVisible?: boolean;
  socials?: AdminCreatorSocialApi[];
}

export function updateAdminCreator(creatorId: string, payload: AdminCreatorWritePayload) {
  return apiPatch<{ creator: AdminCreatorApi }>(`/admin/creators/${creatorId}/`, payload, true).then((res) => res.creator);
}

export function updateCreatorStatus(
  creatorId: string,
  payload: { verification_status?: string; account_status?: string }
) {
  return apiPatch<{ profile: AdminCreatorApi }>(`/verification/creators/${creatorId}/`, payload, true).then(
    (res) => res.profile
  );
}

export interface AdminShortlistCreatorRefApi {
  id: string;
  name: string;
  avatarUrl: string;
  category: string;
  platform: string;
  followers: number;
}

export interface AdminShortlistApi {
  id: string;
  shortlistCode: string;
  title: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  status: string;
  purpose: string;
  notes: string;
  platforms: string[];
  categories: string;
  audience: string;
  budgetRange: string;
  startDate: string;
  endDate: string;
  creators: AdminShortlistCreatorRefApi[];
  createdAt: string;
  updatedAt: string;
}

export function getAdminShortlists() {
  return apiRequest<{ data: AdminShortlistApi[] }>('/admin/shortlists/', {}, true).then((res) => res.data);
}

export function getAdminShortlist(shortlistId: string) {
  return apiRequest<{ shortlist: AdminShortlistApi }>(`/admin/shortlists/${shortlistId}/`, {}, true).then(
    (res) => res.shortlist
  );
}

export interface AdminBrandApi {
  id: string;
  name: string;
  logoUrl: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  verificationStatus: string;
  accountStatus: string;
  totalCampaigns: number;
  activeCampaigns: number;
  creatorsHired: number;
  totalSpend: number;
  joinedAt: string;
  description: string;
  invoices: unknown[];
}

export function getAdminBrands() {
  return apiRequest<{ data: AdminBrandApi[] }>('/admin/brands/', {}, true).then((res) => res.data);
}

export function getAdminBrand(brandId: string) {
  return apiRequest<{ brand: AdminBrandApi }>(`/admin/brands/${brandId}/`, {}, true).then((res) => res.brand);
}

export function updateBrandStatus(
  brandId: string,
  payload: { verification_status?: string; account_status?: string }
) {
  return apiPatch<{ profile: AdminBrandApi }>(`/verification/brands/${brandId}/`, payload, true).then(
    (res) => res.profile
  );
}

export interface AdminCampaignDeliverableApi {
  id: string;
  title: string;
  platform: string;
  type: string;
  quantity: number;
  completedQuantity: number;
  dueDate: string;
}

export interface AdminCampaignApi {
  id: string;
  campaignCode: string;
  title: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
  category: string;
  description: string;
  objective: string;
  targetAudience: string;
  platforms: string[];
  budget: number;
  creatorsRequired: number;
  creatorsSelected: number;
  applicationsCount: number;
  startDate: string;
  endDate: string;
  status: string;
  campaignManager: string;
  deliverables: AdminCampaignDeliverableApi[];
  deliverablesTotal: number;
  deliverablesCompleted: number;
  createdAt: string;
}

export interface CampaignWritePayload {
  title: string;
  brand_id: string;
  category?: string;
  description?: string;
  objective?: string;
  target_audience?: string;
  platforms?: string[];
  budget?: number;
  deliverables_text?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export function getAdminCampaigns() {
  return apiRequest<{ data: AdminCampaignApi[] }>('/admin/campaigns/', {}, true).then((res) => res.data);
}

export function getAdminCampaign(campaignId: string) {
  return apiRequest<{ campaign: AdminCampaignApi }>(`/admin/campaigns/${campaignId}/`, {}, true).then(
    (res) => res.campaign
  );
}

export function createAdminCampaign(payload: CampaignWritePayload) {
  return apiPost<{ campaign: AdminCampaignApi }>('/admin/campaigns/', payload, true).then((res) => res.campaign);
}

export function updateAdminCampaign(campaignId: string, payload: Partial<CampaignWritePayload>) {
  return apiPatch<{ campaign: AdminCampaignApi }>(`/admin/campaigns/${campaignId}/`, payload, true).then(
    (res) => res.campaign
  );
}

export function deleteAdminCampaign(campaignId: string) {
  return apiDelete<void>(`/admin/campaigns/${campaignId}/`, true);
}

export interface AdminDashboardStatsApi {
  totalCreators: number;
  verifiedCreators: number;
  pendingCreatorVerification: number;
  totalBrands: number;
  verifiedBrands: number;
  activeCampaigns: number;
  completedCampaigns: number;
  internalStaffUsers: number;
  creatorsGrowthRate: number;
  brandsGrowthRate: number;
  campaignsGrowthRate: number;
  spendGrowthRate: number;
}

export interface AdminDashboardGrowthPointApi {
  name: string;
  creators: number;
  brands: number;
}

export interface AdminCampaignOverviewPointApi {
  month: string;
  active: number;
  completed: number;
  draft: number;
  paused: number;
}

export interface AdminCategoryDistributionPointApi {
  name: string;
  value: number;
  color: string;
}

export interface AdminDashboardApi {
  stats: AdminDashboardStatsApi;
  growth: AdminDashboardGrowthPointApi[];
  campaignOverview: AdminCampaignOverviewPointApi[];
  categoryDistribution: AdminCategoryDistributionPointApi[];
}

export function getAdminDashboard(range: '7d' | '30d' | '90d' | '1y' = '30d') {
  return apiRequest<AdminDashboardApi>(`/admin/dashboard/?range=${range}`, {}, true);
}
