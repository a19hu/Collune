export type UserAccount = {
  name: string;
  email: string;
  role: 'Admin' | 'Creator' | 'Brand';
};


export type CreatorRegisterForm = {
  name: string;
  email: string;
  emailOtp: string;
  phone_no: string;
  password: string;
  category: string;
  location: string;
  languages: string[];
  collaboration_preferences: string[];
  bio: string;
};

export type BrandRegisterForm = {
  name: string;
  email: string;
  phone_no: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  company_name: string;
  industry: string;
  website: string;
  company_size: string;
  linkedin_url: string;
  logo: File | null;
};

export type SocialAccountForm = {
  platform: CreatorSocialPlatform;
  title: string;
  handle: string;
};

export type CreatorSocialPlatform = "INSTAGRAM" | "YOUTUBE" | "LINKEDIN" | "X" | "FACEBOOK" | "TIKTOK" | "SNAPCHAT";


export type VerificationState = {
  emailSent: boolean;
  emailVerified: boolean;
  phoneOtpSent: boolean;
  phoneVerified: boolean;
  isSendingEmail: boolean;
  isSendingPhone: boolean;
  isCheckingEmail: boolean;
  isVerifyingPhone: boolean;
  message: string;
  error: string;
};


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
export type CreatorCampaignListItemApi = {
  id: string;
  title: string;
  objective: string;
  deadline: string | null;
  posted_at: string;
  brand_name: string;
  brand_logo: string | null;
};
export type CreatorCampaignDetailApi = CreatorCampaignListItemApi & {
  brief: string;
  deliverables: string;
  creative_direction: string;
  platforms: string[];
  category: string;
  audience_type: string;
  location: string;
  minimum_followers: number;
  language_preference: string;
  content_style: string;
  brand_requirements: string;
  start_date: string | null;
  end_date: string | null;
  cover_image: string;
  brand_type: string;
  creator_requirements: {
    looking_for: string;
    audience: string;
    minimum_followers: number;
    languages: string;
    location: string;
    content_style: string;
  };
};
export type CreatorCampaignListResponse = {
  campaigns: CreatorCampaignListItemApi[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
};
export type CreatorCampaignListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "recent" | "deadline" | "brand";
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
export type BrandCampaignListItemApi = {
  id: string;
  name: string;
  status: CampaignApi["status"];
  applications_received_count: number;
  recommended_creators_count: number;
  updated_at: string;
};
export type BrandCampaignListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  total_pages: number;
  page_size: number;
  campaigns: BrandCampaignListItemApi[];
};
export type BrandShortlistStatusApi = "DRAFT" | "SUBMITTED" ;
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
export type PaginatedResponse<T> = {
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
  user: UserAccount;
};

export type RegisterUserPayload = {
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
    bio: string;
    portfolio_url?: string;
    audience_size?: number;
    rate_min?: string;
    rate_max?: string;
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
  bio: string;
  portfolio_url?: string;
  profile_image: string | null;
  profile_image_url: string;
  is_profile_visible: boolean;
  audience_size?: number;
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

export type CreatorListPlatformApi = {
  name: CreatorSocialPlatform;
  followers: number;
  engagement_rate?: number;
  view_count?: number;
  media_count?: number;
};

export type CreatorListItemApi = {
  creator_id: string;
  display_name: string;
  category: string;
  verified?: boolean;
  username?: string;
  profile_image: string | null;
  work_with?: string[];
  total_followers: number;
  platform_data?: CreatorListPlatformApi[];
  location?: string;
  gender?: string;
  created_at?: string;
};

export type CreatorPublicProfileApi = CreatorListItemApi & {
  updated_at?: string;
  languages?: string[];
  bio?: string;
  about?: string;
  avg_eng_rate?: number;
  total_view_count?: number;
  total_media_count?: number;
  collaboration_preferences?: string[];
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
  is_profile_visible: boolean;
  verification_status: string;
  profile_completion: number;
};

export type BrandDashboardApi = {
  brand?: BrandProfileApi;
  no_of_active_campaigns: number;
  no_of_submitted_shortlists?: number;
  no_of_active_shortlists: number;
  collaborations_active?: number;
  active_campaigns: Array<CampaignApi | { id: string; name: string; status: string }>;
  active_shortlists?: Array<BrandShortlistApi | { id: string; name: string; status: string }>;
  submitted_shortlists?: BrandShortlistApi[];
};

export type CreatorDashboardApi = {
  account_id?: string;
  account_created?: boolean;
  social_media_connected?: boolean;
  Social_media_connected?: boolean;
  verification_status?: string;
  profile_completion: number;
  profile_view?: number;
  brand_requests?: number;
  campaign_applications?: number;
  campaigns?: Array<{
    id: string;
    title: string;
    objective: string;
    cover_image: string;
    deadline: string | null;
    looking_for: string;
  }>;
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
