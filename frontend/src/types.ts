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
  preferred_response_time: string;
  open_to_travel: boolean;
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

export type CreatorSocialPlatform = "INSTAGRAM" | "YOUTUBE" |"X" | "FACEBOOK";


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
