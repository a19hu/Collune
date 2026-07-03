import type {
  BrandCampaignListResponse,
  BrandDashboardApi,
  BrandProfileApi,
  BrandRegisterPayload,
  BrandRegisterResponse,
  BrandShortlistApi,
  BrandShortlistPayload,
  CampaignApi,
  CampaignApplicationApi,
  CampaignPayload,
  CreatorCampaignDetailApi,
  CreatorCampaignListParams,
  CreatorCampaignListResponse,
  CreatorDashboardApi,
  CreatorListItemApi,
  CreatorPublicProfileApi,
  CreatorProfileApi,
  CreatorRegisterPayload,
  CreatorRegisterResponse,
  EmailAvailabilityResponse,
  LoginApiUser,
  LoginResponse,
  OtpChannel,
  OtpResponse,
  PaginatedResponse,
} from "../types";
import { authStorage } from "../contexts/authStorage";


const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

type ApiError = { error?: string; detail?: string; message?: string };
type ApiRecord = Record<string, unknown>;

function getAuthHeader() {
  const access = authStorage.getAccessToken();
  if (access) return `Bearer ${access}`;
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
  if (logo) body.append("logo", logo, logo.name);
  return apiPostForm<BrandRegisterResponse>("/auth/brands/register/", body);
}

export async function getBrandMe() {
  const data = await apiRequest<{ brand: BrandProfileApi }>("/brands/me/", {}, true);
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

export async function getCreatorProfile() {
  const data = await apiRequest<{ creator: CreatorProfileApi }>("/auth/creator/profile/", {}, true);
  return data.creator;
}

export async function getCreatorsList() {
  const data = await apiRequest<{ creators: CreatorListItemApi[] }>(
    "/creators/list/",
    {},
    true,
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
  return returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : "";
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

export async function sendOtp(channel: OtpChannel, target: string) {
  return apiPost<OtpResponse>("/auth/otp/send/", { channel, target });
}

export async function verifyOtp(channel: OtpChannel, target: string, code: string) {
  return apiPost<OtpResponse>("/auth/otp/verify/", { channel, target, code });
}

export function createCampaign(payload: CampaignPayload) {
  return apiPost<CampaignApi>("/campaigns/", payload, true);
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
