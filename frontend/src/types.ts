export type UserAccount = {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Creator' | 'Brand';
  schoolCode?: string;
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

export type SocialAccountForm = {
  platform: CreatorSocialPlatform;
  title: string;
  handle: string;
};

export type CreatorSocialPlatform = "INSTAGRAM" | "YOUTUBE" | "LINKEDIN" | "X" | "FACEBOOK" | "TIKTOK" | "SNAPCHAT" | "PINTEREST" | "THREADS" | "WEBSITE";


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