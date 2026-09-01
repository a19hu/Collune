import type {
  BrandCampaignListResponse,
  BrandLogoApi,
  BrandCampaignDetailApi,
  BrandDashboardApi,
  BrandProfileApi,
  BrandRegisterPayload,
  BrandRegisterResponse,
  BrandSavedCreatorsResponse,
  BrandShortlistApi,
  BrandShortlistPayload,
  CampaignApi,
  CampaignApplicationApi,
  CampaignPayload,
  CampaignReviewResponse,
  CreatorAppliedCampaignsResponse,
  CreatorCampaignDetailApi,
  CreatorCampaignListParams,
  CreatorCampaignListResponse,
  CreatorDashboardApi,
  CreatorListItemApi,
  CreatorPublicProfileApi,
  CreatorProfileApi,
  CreatorRegisterPayload,
  CreatorRegisterResponse,
  CreatorSavedCampaignsResponse,
  EmailAvailabilityResponse,
  LoginApiUser,
  LoginResponse,
  NotificationListResponse,
  NotificationReadPayload,
  NotificationReadResponse,
  OtpChannel,
  OtpResponse,
  PaginatedResponse,
} from "../types";
import { authStorage } from "../contexts/authStorage";

const DEFAULT_API_ORIGIN = "https://collune-backend-727341248620.asia-south1.run.app";

function resolveApiBaseUrl() {
  const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!raw || raw === "undefined" || raw === "null") {
    return `${DEFAULT_API_ORIGIN}/api/v1`;
  }
  const normalized = raw.replace(/\/+$/, "");
  return `${normalized}/api/v1`;
}

const API_BASE_URL = resolveApiBaseUrl();

function resolveWebSocketBaseUrl() {
  const base = API_BASE_URL.replace(/\/api\/v1$/, "");
  return base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

type ApiError = { error?: string; detail?: string; message?: string };
type ApiRecord = Record<string, unknown>;

function getAuthHeader() {
  const access = authStorage.getAccessToken();
  if (access) return `Bearer ${access}`;
  return "";
}

export function getNotificationsSocketUrl(token: string) {
  return `${resolveWebSocketBaseUrl()}/ws/notifications/?token=${encodeURIComponent(token)}`;
}

function detectOAuthClient() {
  if (typeof navigator === "undefined") return "web";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? "app" : "web";
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

function apiDelete<T>(path: string, body: unknown, authed = false) {
  return apiRequest<T>(
    path,
    {
      method: "DELETE",
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



export async function requestPasswordReset(email: string) {
  return apiPost<{ message: string; email: string; expires_in: number }>("/auth/password-reset/request/", { email: email.trim() });
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string) {
  return apiPost<{ message: string }>("/auth/password-reset/confirm/", {
    email: email.trim(),
    code: code.trim(),
    new_password: newPassword,
  });
}
export async function registerCreator(payload: CreatorRegisterPayload) {
  return apiPost<CreatorRegisterResponse>("/auth/creators/register/", payload);
}

export async function registerBrand(payload: BrandRegisterPayload) {
  return apiPost<BrandRegisterResponse>("/auth/brands/register/", payload);
}

export async function registerBrandFormData(
  payload: BrandRegisterPayload,
  files?: {
    logo?: File | null;
    gst_certificate?: File | null;
    pan_card?: File | null;
    company_registration_certificate?: File | null;
  },
) {
  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  if (files?.logo) body.append("logo", files.logo, files.logo.name);
  if (files?.gst_certificate) body.append("gst_certificate", files.gst_certificate, files.gst_certificate.name);
  if (files?.pan_card) body.append("pan_card", files.pan_card, files.pan_card.name);
  if (files?.company_registration_certificate) {
    body.append("company_registration_certificate", files.company_registration_certificate, files.company_registration_certificate.name);
  }
  return apiPostForm<BrandRegisterResponse>("/auth/brands/register/", body);
}

export async function getBrandMe() {
  const data = await apiRequest<{ brand: BrandProfileApi }>("/auth/brand/profile/", {}, true);
  return data.brand;
}

export async function updateBrandProfile(body: FormData) {
  const data = await apiPatchForm<{ brand: BrandProfileApi }>("/auth/brand/profile/", body, true);
  return data.brand;
}

export async function getBrandDashboard() {
  const data = await apiRequest<{ brand_dashboard: BrandDashboardApi }>("/brands/dashboard/", {}, true);
  return data.brand_dashboard;
}

export async function getCreatorDashboard(period = "7d") {
  const params = new URLSearchParams({ period });
  const data = await apiRequest<{ creator: CreatorDashboardApi }>(`/creators/dashboard/?${params.toString()}`, {}, true);
  return data.creator;
}

export async function getNotifications(limit = 20) {
  return apiRequest<NotificationListResponse>(`/notifications/?limit=${limit}`, {}, true);
}

export async function markNotificationsRead(payload: NotificationReadPayload) {
  return apiPatch<NotificationReadResponse>(`/notifications/read/`, payload, true);
}

export async function getBrandsList() {
  const data = await apiRequest<{ brands: BrandProfileApi[] } | BrandProfileApi[] | PaginatedResponse<BrandProfileApi>>(
    "/brands/list/",
    {},
    true,
  );
  if (Array.isArray(data)) return data;
  if ("results" in data) return data.results;
  return data.brands;
}

export async function getBrandLogos() {
  const data = await apiRequest<{ brands: BrandLogoApi[] }>("/brands/logo-carousel/");
  return data.brands;
}

export async function getCreatorProfile() {
  const data = await apiRequest<{ creator: CreatorProfileApi }>("/auth/creator/profile/", {}, true);
  return data.creator;
}

export async function getCreatorsList() {
  const data = await apiRequest<{ creators: CreatorListItemApi[] }>(
    "/creators/list/",
    {},
  );
  return data.creators
}








export async function getCreatorPublicProfile(creatorId: string) {
  const data = await apiRequest<{ creator: CreatorPublicProfileApi }>(`/creator/${creatorId}/`, {}, true);
  return data.creator;
}

export async function updateCreatorProfile(payload: FormData) {
  await apiPatchForm<{ message: string }>("/auth/creator/profile/", payload, true);
  return getCreatorProfile();
}

function oauthReturnQuery(returnTo?: "registration") {
  const params = new URLSearchParams();
  if (returnTo) params.set("return_to", returnTo);
  params.set("client", detectOAuthClient());
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getInstagramConnectUrl(returnTo?: "registration") {
  return apiRequest<{ auth_url: string }>(`/auth/instagram/connect/${oauthReturnQuery(returnTo)}`, {}, true);
}

export async function getFacebookConnectUrl(returnTo?: "registration") {
  return apiRequest<{ auth_url: string }>(`/auth/facebook/connect/${oauthReturnQuery(returnTo)}`, {}, true);
}

export async function getYouTubeConnectUrl(returnTo?: "registration") {
  return apiRequest<{ auth_url: string }>(`/auth/youtube/connect/${oauthReturnQuery(returnTo)}`, {}, true);
}

export async function getXConnectUrl(returnTo?: "registration") {
  return apiRequest<{ auth_url: string }>(`/auth/x/connect/${oauthReturnQuery(returnTo)}`, {}, true);
}

export async function refreshYouTubeVideos() {
  const data = await apiPost<{ creator: CreatorProfileApi }>("/auth/youtube/refresh/", {}, true);
  return data.creator;
}

export async function sendOtp(channel: OtpChannel, target: string, userName?: string) {
  return apiPost<OtpResponse>("/auth/otp/send/", { channel, target, userName });
}

export async function verifyOtp(channel: OtpChannel, target: string, code: string) {
  return apiPost<OtpResponse>("/auth/otp/verify/", { channel, target, code });
}

export async function sendWhatsAppOtp(target: string, userName?: string) {
  return sendOtp("PHONE", target, userName);
}

export async function verifyWhatsAppOtp(target: string, code: string) {
  return verifyOtp("PHONE", target, code);
}

function appendCampaignPayload(body: FormData, payload: CampaignPayload) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "platforms" && Array.isArray(value)) {
      value.forEach((platform) => body.append("platforms", platform));
      return;
    }
    if (key === "deliverable_pricing") {
      body.append(key, JSON.stringify(value));
      return;
    }
    body.append(key, String(value));
  });
}

export function createCampaign(payload: CampaignPayload, brandGuidelines?: File | null, coverImage?: File | null) {
  const body = new FormData();
  appendCampaignPayload(body, payload);
  if (brandGuidelines) body.append("brand_guidelines", brandGuidelines, brandGuidelines.name);
  if (coverImage) body.append("cover_image", coverImage, coverImage.name);
  return apiPostForm<{ message: string }>("/brands/campaigns/", body, true);
}

export function reviewCampaign(payload: CampaignPayload) {
  return apiPost<CampaignReviewResponse>("/brands/campaigns/review/", payload, true);
}


export async function getCreatorCampaigns(params: CreatorCampaignListParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 6),
    sort: params.sort ?? "recent",
  });
  if (params.search?.trim()) query.set("search", params.search.trim());
  return apiRequest<CreatorCampaignListResponse>(`/creator/campaigns/?${query.toString()}`, {}, true);
}

export async function getCreatorCampaignDetail(campaignId: string) {
  const data = await apiRequest<{ campaign: CreatorCampaignDetailApi }>(`/creator/campaignds/${campaignId}/`, {}, true);
  return data.campaign;
}

export function getBrandCampaigns(page = 1, pageSize = 10) {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return apiRequest<BrandCampaignListResponse>(`/brands/campaigns/?${query.toString()}`, {}, true);
}

export function getBrandCampaignDetail(campaignId: string) {
  return apiRequest<BrandCampaignDetailApi>(`/brands/campaigns/${campaignId}/`, {}, true);
}

export function updateBrandCampaign(campaignId: string, payload: CampaignPayload, brandGuidelines?: File | null, coverImage?: File | null) {
  const body = new FormData();
  appendCampaignPayload(body, payload);
  if (brandGuidelines) body.append("brand_guidelines", brandGuidelines, brandGuidelines.name);
  if (coverImage) body.append("cover_image", coverImage, coverImage.name);
  return apiPatchForm<{ message: string }>(`/brands/campaigns/${campaignId}/`, body, true);
}

export function deleteBrandCampaign(campaignId: string) {
  return apiDelete<{ message: string }>(`/brands/campaigns/${campaignId}/`, {}, true);
}

export function getCampaign(campaignId: string) {
  return apiRequest<CampaignApi>(`/campaigns/${campaignId}/`, {}, true);
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
  return apiPost<{ massage: string }>(
    "/campaign-applications/",
    { campaign_id: campaignId},
    true,
  );
}

export function removeCampaignApplication(campaignId: string) {
  return apiDelete<{ message: string; removed: boolean }>("/campaign-applications/", { campaign_id: campaignId }, true);
}

export function getCreatorAppliedCampaigns() {
  return apiRequest<CreatorAppliedCampaignsResponse>("/creator/applied-campaigns/", {}, true);
}

export function saveCreatorCampaign(campaignId: string) {
  return apiPost<{ message: string; saved: boolean }>("/creator/saved-campaigns/", { campaign_id: campaignId }, true);
}

export function getCreatorSavedCampaigns() {
  return apiRequest<CreatorSavedCampaignsResponse>("/creator/saved-campaigns/", {}, true);
}

export function removeSavedCampaign(campaignId: string) {
  return apiDelete<{ message: string; saved: boolean; removed: boolean }>("/creator/saved-campaigns/", { campaign_id: campaignId }, true);
}

export function getBrandSavedCreators() {
  return apiRequest<BrandSavedCreatorsResponse>("/brand/saved-creators/", {}, true);
}

export function saveBrandCreator(creatorId: string) {
  return apiPost<{ message: string; saved: boolean }>("/brand/saved-creators/", { creator_id: creatorId }, true);
}

export function removeBrandSavedCreator(creatorId: string) {
  return apiDelete<{ message: string; saved: boolean; removed: boolean }>("/brand/saved-creators/", { creator_id: creatorId }, true);
}

export async function getBrandShortlists(page = 1, pageSize = 10) {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const data = await apiRequest<BrandShortlistApi[] | PaginatedResponse<BrandShortlistApi> | { shortlists: BrandShortlistApi[]; total_pages?: number; count?: number }>(
    `/brand-shortlists/?${query.toString()}`,
    {},
    true,
  );
  if (Array.isArray(data)) {
    return { shortlists: data, total_pages: 1, count: data.length };
  }
  if ("results" in data) {
    return {
      shortlists: data.results,
      total_pages: Math.max(1, Math.ceil(data.count / pageSize)),
      count: data.count,
    };
  }
  return {
    shortlists: data.shortlists,
    total_pages: Math.max(1, data.total_pages ?? 1),
    count: data.count ?? data.shortlists.length,
  };
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
