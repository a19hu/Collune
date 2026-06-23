import type { CreatorSocialPlatform } from "../types";


const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

type ApiError = { error?: string; detail?: string; message?: string };
type ApiRecord = Record<string, unknown>;
export type CampaignPayload = {
  title: string;
  internal_reference_name?: string;
  brief?: string;
  objective: string;
  deliverables: string;
  brand_requirements: string;
  creative_direction: string;
  tone_of_communication: string;
  content_references?: string;
  platforms: string[];
  category: string;
  audience_type: string;
  location?: string;
  minimum_followers: number;
  language_preference: string;
  content_style: string;
  additional_preferences?: string;
  total_budget: string;
  budget_range: string;
  compensation_type: string;
  deliverable_pricing: Record<string, string>;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  status?: "DRAFT" | "ACTIVE" | "REVIEWING" | "PAUSED" | "COMPLETED";
};

export type CampaignApi = CampaignPayload & {
  campaign_id: string;
  brand: string;
  brand_detail?: BrandProfileApi;
  brand_guidelines_url: string;
  applications_count: number;
  status_summary?: {
    summary_id: string;
    campaign?: string;
    applications_received: number;
    recommended_creators: number;
    collaborations_started: number;
    applications_close_in_days: number;
    created_at: string;
    updated_at: string;
  } | null;
  progress_steps?: Array<{
    progress_id: string;
    title: string;
    status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
    display_date: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>;
  created_at: string;
  updated_at: string;
};
export type CampaignStatusSummaryApi = {
  summary_id: string;
  campaign: string;
  applications_received: number;
  recommended_creators: number;
  collaborations_started: number;
  applications_close_in_days: number;
  created_at: string;
  updated_at: string;
};
export type CampaignApplicationApi = {
  application_id: string;
  campaign: string;
  campaign_detail?: CampaignApi;
  creator: string;
  creator_detail?: CreatorProfileApi;
  pitch: string;
  quoted_rate: string;
  status: "APPLIED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED";
  created_at: string;
  updated_at: string;
};
export type BrandShortlistStatusApi = "DRAFT" | "SUBMITTED" | "OUTREACH_IN_PROGRESS" | "COMPLETED";
export type BrandShortlistPayload = {
  title: string;
  creators?: string[];
  status?: BrandShortlistStatusApi;
  purpose?: string;
  notes?: string;
  platforms?: string[];
  categories?: string;
  audience?: string;
  budget_range?: string;
  timeline?: string;
};
export type BrandShortlistApi = BrandShortlistPayload & {
  shortlist_id: string;
  brand: string;
  creators: string[];
  creator_details: CreatorProfileApi[];
  status: BrandShortlistStatusApi;
  purpose: string;
  notes: string;
  platforms: string[];
  categories: string;
  audience: string;
  budget_range: string;
  timeline: string;
  created_at: string;
  updated_at: string;
};
type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
export type LoginApiUser = {
  user_id: string;
  username: string;
  email: string;
  name: string;
  phone_no: string | null;
  role: string | null;
  school: string | null;
  is_active: boolean;
};

export type LoginResponse = {
  message: string;
  token: string;
  refresh: string;
  access: string;
  user: LoginApiUser;
};

type RegisterUserPayload = {
  name: string;
  email: string;
  phone_no?: string;
  password: string;
};

export type CreatorSocialAccountPayload = {
  platform: CreatorSocialPlatform;
  handle: string;
  url?: string;
  followers?: number;
  is_connected?: boolean;
};

export type CreatorRegisterPayload = {
  user: RegisterUserPayload;
  display_name?: string;
  category?: string;
  location?: string;
  languages?: string[];
  collaboration_preferences?: string[];
  preferred_response_time?: string;
  open_to_travel?: boolean;
  social_accounts?: CreatorSocialAccountPayload[];
  bio?: string;
  portfolio_url?: string;
  audience_size?: number;
  rate_min?: number | string;
  rate_max?: number | string;
};

export type CreatorRegisterResponse = LoginResponse & {
  creator: {
    creator_id: string;
    display_name: string;
    category: string;
    location: string;
    languages: string[];
    collaboration_preferences: string[];
    preferred_response_time: string;
    open_to_travel: boolean;
    bio: string;
    portfolio_url: string;
    audience_size: number;
    rate_min: string;
    rate_max: string;
    verification_status: string;
    profile_completion: number;
  };
};

export type CreatorProfileApi = {
  creator_id: string;
  user?: LoginApiUser;
  display_name: string;
  category: string;
  location: string;
  languages: string[];
  collaboration_preferences: string[];
  preferred_response_time: string;
  open_to_travel: boolean;
  bio: string;
  portfolio_url: string;
  profile_image: string | null;
  profile_image_url: string;
  audience_size: number;
  rate_min: string;
  rate_max: string;
  verification_status: string;
  profile_completion: number;
  social_accounts: Array<{
    account_id: string;
    platform: CreatorSocialPlatform;
    social_id: string;
    username: string;
    handle: string;
    url?: string;
    followers?: number;
    media_count?: number;
    view_count?: number;
    engagement_rate?: number;
    audience_country?: Record<string, number>;
    youtube_short_video_count?: number;
    youtube_long_video_count?: number;
    youtube_videos?: Array<{
      video_id: string;
      title: string;
      published_at: string;
      thumbnail_url: string;
      duration: string;
      duration_seconds: number;
      content_type: "SHORT" | "LONG";
      view_count: number;
      like_count: number;
      comment_count: number;
    }>;
    youtube_analytics?: Record<string, unknown>;
    provider_data?: Record<string, unknown>;
    expires_at?: string | null;
    is_connected: boolean;
    last_synced_at?: string | null;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
};

export type BrandRegisterPayload = {
  user: RegisterUserPayload;
  company_name: string;
  industry?: string;
  website?: string;
  company_size?: string;
  linkedin_url?: string;
};

export type BrandRegisterResponse = LoginResponse & {
  brand: BrandProfileApi;
};

export type BrandProfileApi = {
  brand_id: string;
  company_name: string;
  industry: string;
  website: string;
  company_size: string;
  linkedin_url: string;
  logo_url: string;
  verification_status: string;
  profile_completion: number;
};

export type OtpChannel = "EMAIL" | "PHONE";

export type OtpResponse = {
  message: string;
  channel: OtpChannel;
  target: string;
  expires_in?: number;
};

export type EmailAvailabilityResponse = {
  email: string;
  available: boolean;
};

function getAuthHeader() {
  const access = localStorage.getItem("saaserp_access_token");
  const drfToken = localStorage.getItem("saaserp_drf_token");
  if (access) return `Bearer ${access}`;
  if (drfToken) return `Token ${drfToken}`;
  return "";
}

function formatApiError(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "Request failed";

  const apiError = data as ApiError & ApiRecord;
  if (apiError.error || apiError.detail || apiError.message) {
    return String(apiError.error || apiError.detail || apiError.message);
  }

  for (const [key, value] of Object.entries(apiError)) {
    if (typeof value === "string") return `${key}: ${value}`;
    if (Array.isArray(value) && value.length > 0) return `${key}: ${String(value[0])}`;
    if (value && typeof value === "object") {
      const nested = formatApiError(value);
      if (nested !== "Request failed") return `${key}: ${nested}`;
    }
  }

  return "Request failed";
}

async function apiRequest<T>(path: string, init: RequestInit = {}, authed = false): Promise<T> {
  const authHeader = authed ? getAuthHeader() : "";
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers || {}),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const text = res.status === 204 ? "" : await res.text();
  let data = {} as T & ApiError;
  if (text) {
    try {
      data = JSON.parse(text) as T & ApiError;
    } catch {
      throw new Error(`Invalid API response (${res.status} ${res.statusText || "Unknown"}): ${text.slice(0, 160)}`);
    }
  }

  if (!res.ok) {
    if (authed && [401, 403].includes(res.status)) {
      window.dispatchEvent(new CustomEvent("saaserp:session-expired"));
    }
    throw new Error(text ? formatApiError(data) : `Request failed (${res.status} ${res.statusText || "Unknown"})`);
  }

  return data as T;
}

function apiPost<T>(path: string, body: unknown, authed = false) {
  return apiRequest<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    authed,
  );
}

function apiPatch<T>(path: string, body: unknown, authed = false) {
  return apiRequest<T>(
    path,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    authed,
  );
}

function apiPostForm<T>(path: string, body: FormData, authed = false) {
  return apiRequest<T>(
    path,
    {
      method: "POST",
      body,
    },
    authed,
  );
}

function apiPatchForm<T>(path: string, body: FormData, authed = false) {
  return apiRequest<T>(
    path,
    {
      method: "PATCH",
      body,
    },
    authed,
  );
}

export async function loginWithEmail(email: string, password: string) {
  return apiPost<LoginResponse>("/auth/login/", {
    username: email,
    password,
  });
}

export async function getMe() {
  return apiRequest<{ user: LoginApiUser }>("/auth/me/", {}, true);
}

export async function signOutApi() {
  return apiPost<{ message: string }>("/auth/signout/", {}, true);
}

export async function checkEmailAvailability(email: string) {
  const query = encodeURIComponent(email.trim());
  return apiRequest<EmailAvailabilityResponse>(`/auth/email-availability/?email=${query}`);
}

export async function registerCreator(payload: CreatorRegisterPayload) {
  return apiPost<CreatorRegisterResponse>("/auth/creators/register/", payload);
}

export async function registerBrand(payload: BrandRegisterPayload) {
  return apiPost<BrandRegisterResponse>("/auth/brands/register/", payload);
}

export async function registerBrandFormData(payload: BrandRegisterPayload, logo?: File | null) {
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  if (logo) body.append("logo", logo);
  return apiPostForm<BrandRegisterResponse>("/auth/brands/register/", body);
}

export async function getBrandMe() {
  const data = await apiRequest<{ brand: BrandProfileApi }>("/brands/me/", {}, true);
  return data.brand;
}

export async function getCreatorProfile() {
  const data = await apiRequest<{ creator: CreatorProfileApi }>("/auth/creator/profile/", {}, true);
  return data.creator;
}

export async function getCreatorsList() {
  const data = await apiRequest<{ creators: CreatorProfileApi[] } | CreatorProfileApi[] | PaginatedResponse<CreatorProfileApi>>(
    "/creators/list/",
  );
  if (Array.isArray(data)) return data;
  if ("results" in data) return data.results;
  return data.creators;
}

export async function getCreatorPublicProfile(creatorId: string) {
  const data = await apiRequest<{ creator: CreatorProfileApi }>(`/creators/list/${creatorId}/`);
  return data.creator;
}

export async function updateCreatorProfile(payload: FormData) {
  const data = await apiPatchForm<{ creator: CreatorProfileApi }>("/auth/creator/profile/", payload, true);
  return data.creator;
}

export async function getInstagramConnectUrl() {
  return apiRequest<{ auth_url: string }>("/auth/instagram/connect/", {}, true);
}

export async function getYouTubeConnectUrl() {
  return apiRequest<{ auth_url: string }>("/auth/youtube/connect/", {}, true);
}

export async function refreshYouTubeVideos() {
  const data = await apiPost<{ creator: CreatorProfileApi }>("/auth/youtube/refresh/", {}, true);
  return data.creator;
}

export async function sendOtp(channel: OtpChannel, target: string) {
  return apiPost<OtpResponse>("/auth/otp/send/", { channel, target });
}

export async function verifyOtp(channel: OtpChannel, target: string, code: string) {
  return apiPost<OtpResponse>("/auth/otp/verify/", { channel, target, code });
}

export function createCampaign(payload: CampaignPayload) {
  return apiPost<CampaignApi>("/campaigns/", payload, true);
}

export async function getCampaigns() {
  const data = await apiRequest<CampaignApi[] | PaginatedResponse<CampaignApi>>("/campaigns/", {}, true);
  return Array.isArray(data) ? data : data.results;
}

export function getCampaign(campaignId: string) {
  return apiRequest<CampaignApi>(`/campaigns/${campaignId}/`, {}, true);
}

export async function getCampaignStatusSummaries() {
  const data = await apiRequest<CampaignStatusSummaryApi[] | PaginatedResponse<CampaignStatusSummaryApi>>(
    "/campaign-status-summaries/",
    {},
    true,
  );
  return Array.isArray(data) ? data : data.results;
}

export async function getCampaignApplications() {
  const data = await apiRequest<CampaignApplicationApi[] | PaginatedResponse<CampaignApplicationApi>>(
    "/campaign-applications/",
    {},
    true,
  );
  return Array.isArray(data) ? data : data.results;
}

export function applyToCampaign(campaignId: string) {
  return apiPost<CampaignApplicationApi>("/campaign-applications/", { campaign: campaignId }, true);
}

export async function getBrandShortlists() {
  const data = await apiRequest<BrandShortlistApi[] | PaginatedResponse<BrandShortlistApi>>(
    "/brand-shortlists/",
    {},
    true,
  );
  return Array.isArray(data) ? data : data.results;
}

export function createBrandShortlist(payload: BrandShortlistPayload) {
  return apiPost<BrandShortlistApi>("/brand-shortlists/", payload, true);
}

export function updateBrandShortlist(shortlistId: string, payload: Partial<BrandShortlistPayload>) {
  return apiPatch<BrandShortlistApi>(`/brand-shortlists/${shortlistId}/`, payload, true);
}

export function getBrandShortlist(shortlistId: string) {
  return apiRequest<BrandShortlistApi>(`/brand-shortlists/${shortlistId}/`, {}, true);
}
