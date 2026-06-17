import type { CreatorSocialPlatform } from "../types";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_API_BASE_URL
).replace(/\/$/, "");

const API_EXTRA_HEADERS = API_BASE_URL.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

type ApiError = { error?: string; detail?: string; message?: string };
type ApiRecord = Record<string, unknown>;

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

export type BrandRegisterPayload = {
  user: RegisterUserPayload;
  company_name: string;
  industry?: string;
  website?: string;
  company_size?: string;
  linkedin_url?: string;
};

export type BrandRegisterResponse = LoginResponse & {
  brand: {
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...API_EXTRA_HEADERS,
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

export async function sendOtp(channel: OtpChannel, target: string) {
  return apiPost<OtpResponse>("/auth/otp/send/", { channel, target });
}

export async function verifyOtp(channel: OtpChannel, target: string, code: string) {
  return apiPost<OtpResponse>("/auth/otp/verify/", { channel, target, code });
}
