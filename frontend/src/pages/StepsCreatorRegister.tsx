import { CalendarDays, Check, ChevronDown, CloudUpload, Eye, EyeClosed, Globe, Grid2X2, Instagram, Linkedin, Lock, Mail, MapPin, Megaphone, Phone, Plane, Play, Rocket, User, Users, X, Youtube } from "lucide-react";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { RegisterError, RegisterStepHeader, SelectablePill, VerificationBlock } from "../HtmlComponents/RegisterFormParts";
import { CreatorRegisterForm, SocialAccountForm, VerificationState } from "../types";
import type { ChangeEvent, ReactNode } from "react";


const inputClass =
  "h-[52px] w-full rounded-xl border border-[#d8e2fb] bg-white px-12 text-[15px] font-semibold text-[#173ca8] outline-none transition placeholder:text-[#9aa7bf] focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10";
const labelClass = "mb-2 block text-xs font-semibold text-[#6e7d99]";

const languageOptions = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam"];
const responseTimeOptions = ["Within 24 Hours", "Within 48 Hours", "Flexible"];
const categoryOptions = ["Political Commentary", "Business & Finance", "Lifestyle", "Technology", "Beauty", "Travel", "Education"];

const collaborationOptions = [
  { title: "Sponsored Posts", copy: "Promote your content through sponsored posts", icon: <Megaphone className="h-7 w-7" /> },
  { title: "Long-Term Partnerships", copy: "Build ongoing relationships with brands", icon: <Users className="h-7 w-7" /> },
  { title: "Product Launches", copy: "Be part of exciting new product launches", icon: <Rocket className="h-7 w-7" /> },
  { title: "UGC Content", copy: "Create user-generated content for brands", icon: <Play className="h-7 w-7" /> },
  { title: "Events", copy: "Participate in brand events and meetups", icon: <CalendarDays className="h-7 w-7" /> },
  { title: "Webinars", copy: "Join or host webinars and live sessions", icon: <Globe className="h-7 w-7" /> },
];

function SocialCard({
  icon,
  title,
  handle,
  onHandleChange,
}: {
  key?: string;
  icon: ReactNode;
  title: string;
  handle: string;
  onHandleChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-[#e0e0e0] bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span>{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-[#202337]">{title}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.2fr_0.8fr]">
          <input
            value={handle}
            onChange={onHandleChange}
            placeholder="@handle"
            className="h-10 rounded-lg border border-[#dfe4ed] px-3 text-sm font-semibold text-[#202337] outline-none focus:border-[#7082f9]"
          />
        </div>
      </div>
    </article>
  );
}

function PreferenceTile({
  title,
  copy,
  icon,
  active,
  onClick,
}: {
  key?: string;
  title: string;
  copy: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`relative min-h-[132px] rounded-lg border p-4 text-center transition ${active
      ? "border-[#796cff] bg-[#eef3ff]"
      : "border-[#dfe4ed] bg-white"
      }`}
    >
      <span className={`absolute left-3 top-3 grid h-4 w-4 place-items-center rounded-[3px] border ${active ? "border-[#2f31e7] bg-[#2f31e7]" : "border-[#cbd4df] bg-white"}`}>
        {active ? <Check className="h-3 w-3 text-white" /> : null}
      </span>
      <span className="mx-auto mt-5 grid h-8 place-items-center text-[#776bff]">{icon}</span>
      <strong className="mt-3 block text-sm font-black text-[#202337]">{title}</strong>
      <span className="mt-2 block text-[11px] font-medium leading-snug text-[#707b91]">{copy}</span>
    </button>
  );
}

function getSocialIcon(platform: SocialAccountForm["platform"]) {
  const iconClass = "h-7 w-7";
  const iconWrapperClass = "grid h-12 w-12 place-items-center rounded-xl text-white";

  if (platform === "INSTAGRAM") {
    return <span className={`${iconWrapperClass} bg-gradient-to-br from-[#ff7a3f] to-[#d61d72]`}><Instagram className={iconClass} /></span>;
  }

  if (platform === "YOUTUBE") {
    return <span className={`${iconWrapperClass} bg-[#ff0303]`}><Youtube className={`${iconClass} fill-current`} /></span>;
  }

  if (platform === "LINKEDIN") {
    return <span className={`${iconWrapperClass} bg-[#116bc1]`}><Linkedin className={`${iconClass} fill-current`} /></span>;
  }

  return <span className={`${iconWrapperClass} bg-black`}><X className={iconClass} /></span>;
}


type StepContentProps = {
  step: number;
  form: CreatorRegisterForm;
  showPassword: boolean;
  phoneOtp: string;
  socialAccounts: SocialAccountForm[];
  verification: VerificationState;
  onFieldChange: (field: keyof CreatorRegisterForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onEmailOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSocialAccountChange: (index: number, field: keyof Pick<SocialAccountForm, "handle">) => (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleFormArrayValue: (field: "languages" | "collaboration_preferences", value: string) => void;
  onTogglePassword: () => void;
  onVerifyEmailOtp: () => void;
  onVerifyPhoneOtp: () => void;
};

export const StepsCreatorRegister=({
  step,
  form,
  showPassword,
  phoneOtp,
  socialAccounts,
  verification,
  onFieldChange,
  onEmailOtpChange,
  onPhoneOtpChange,
  onSocialAccountChange,
  onToggleFormArrayValue,
  onTogglePassword,
  onVerifyEmailOtp,
  onVerifyPhoneOtp,
}: StepContentProps)=>{
    if (step === 1) {
    return (
      <>
        <RegisterStepHeader title="Create your account" copy="Let's get started with a few details." />
        <div className="mt-8 grid gap-4">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Full Name" icon={<User className="h-5 w-5" />} value={form.name} onChange={onFieldChange("name")} placeholder="Aakrit Gupta" required />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Email Address" icon={<Mail className="h-5 w-5" />} value={form.email} onChange={onFieldChange("email")} placeholder="aakrit.gupta@gmail.com" type="email" required />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Phone Number" icon={<Phone className="h-5 w-5" />} value={form.phone_no} onChange={onFieldChange("phone_no")} placeholder="+91 99999 44444" pattern="^\+[1-9]\d{7,14}$" type="tel" required maxLength={13} minLength={13} />
          <HtmlInput
            labelClass={labelClass}
            inputClass={inputClass}
            label="Password"
            icon={<Lock className="h-5 w-5" />}
            value={form.password}
            onChange={onFieldChange("password")}
            placeholder="Minimum 8 characters"
            type={showPassword ? "text" : "password"}
            trailing={
              <button type="button" onClick={onTogglePassword} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-[#eef3ff]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {!showPassword ? <EyeClosed className="h-5 w-5" /> :<Eye className="h-5 w-5" />}
              </button>
            }
            required
          />
        </div>
        <p className="mt-6 text-center text-xs font-medium text-[#738098]">
          By continuing, you agree to Collune's <a className="text-[#6f80ff]" href="#">Terms of Service</a> and <a className="text-[#6f80ff]" href="#">Privacy Policy</a>.
        </p>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <RegisterStepHeader title="Verify your contact" copy="Enter the verification codes sent to your email and phone." />
        <RegisterError message={verification.error} className="mt-6" />
        <div className="mt-8 grid gap-7">
          <VerificationBlock
            icon={<Mail className="h-5 w-5" />}
            title="Verify Email"
            target={form.email || "your email"}
            otp={form.emailOtp}
            otpSent={verification.emailSent}
            verified={verification.emailVerified}
            isVerifying={verification.isCheckingEmail}
            onOtpChange={onEmailOtpChange}
            onVerify={onVerifyEmailOtp}
          />
          <VerificationBlock
            icon={<Phone className="h-5 w-5" />}
            title="Verify Phone"
            target={form.phone_no || "your phone"}
            otp={phoneOtp}
            otpSent={verification.phoneOtpSent}
            verified={verification.phoneVerified}
            isVerifying={verification.isVerifyingPhone}
            onOtpChange={onPhoneOtpChange}
            onVerify={onVerifyPhoneOtp}
          />
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <RegisterStepHeader title="Connect your social accounts" copy="We'll only import public profile information and performance metrics." />
        <div className="mx-auto mt-9 grid max-w-[430px] gap-3.5">
          {socialAccounts.map((account, index) => (
            <SocialCard
              key={account.platform}
              title={account.title}
              handle={account.handle}
              onHandleChange={onSocialAccountChange(index, "handle")}
              icon={getSocialIcon(account.platform)}
            />
          ))}
        </div>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <RegisterStepHeader title="Tell us about yourself" copy="Help brands understand your audience and content." />
        <div className="mt-8 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Creator Category</span>
            <span className="relative block">
              <Grid2X2 className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#707b91]" />
              <select value={form.category} onChange={onFieldChange("category")} className="h-12 w-full appearance-none rounded-xl border border-[#e0e0e0] bg-white px-10 text-sm font-medium text-[#202337] outline-none">
                {categoryOptions.map((category) => <option key={category}>{category}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#707b91]" />
            </span>
          </label>
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Languages</span>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((language) => (
                <SelectablePill
                  key={language}
                  active={form.languages.includes(language)}
                  onClick={() => onToggleFormArrayValue("languages", language)}
                >
                  {language}
                </SelectablePill>
              ))}
            </div>
          </div>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Location" icon={<MapPin className="h-5 w-5" />} value={form.location} onChange={onFieldChange("location")} placeholder="New Delhi, India" />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Short Bio</span>
            <textarea
              className="h-36 w-full resize-none rounded-xl border border-[#e0e0e0] bg-white p-4 text-sm font-medium leading-relaxed text-[#202337] outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
              value={form.bio}
              onChange={onFieldChange("bio")}
              maxLength={200}
              placeholder="Political commentator helping young audiences understand policy and governance."
            />
            <span className="-mt-7 mr-4 block text-right text-xs font-medium text-[#9aa7bf]">{form.bio.length} / 200</span>
          </label>
        </div>
      </>
    );
  }

  if (step === 5) {
    return (
      <>
        <RegisterStepHeader title="Collaboration preferences" copy="Select the opportunities you'd like to receive." />
        <div className="mt-5">
          <span className="mb-3 block text-sm font-black text-[#4c5880]">I'm interested in</span>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {collaborationOptions.map((option) => (
              <PreferenceTile
                key={option.title}
                active={form.collaboration_preferences.includes(option.title)}
                title={option.title}
                copy={option.copy}
                icon={option.icon}
                onClick={() => onToggleFormArrayValue("collaboration_preferences", option.title)}
              />
            ))}
          </div>
          <span className="mb-3 mt-5 block text-xs font-semibold text-[#202337]">Content language</span>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((language) => (
              <SelectablePill
                key={language}
                active={form.languages.includes(language)}
                onClick={() => onToggleFormArrayValue("languages", language)}
                showIcon
              >
                {language}
              </SelectablePill>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <RegisterStepHeader centered title="Add your Portfolio" copy="Upload examples of your best work. You can always add more later." />
      <div className="mt-8 grid min-h-[400px] place-items-center rounded-[24px] border-2 border-dashed border-[#d7e2ff] px-6 text-center">
        <div>
          <CloudUpload className="mx-auto h-16 w-16 text-[#7788ff]" />
          <h2 className="mt-7 text-lg font-semibold text-[#202337]">Drag & drop files here</h2>
          <p className="mt-4 text-sm font-medium text-[#707b91]">or</p>
          <button type="button" className="mt-6 rounded-lg border-2 border-[#2447bd] px-8 py-3 text-base font-black text-[#2447bd]">
            Upload Files
          </button>
          <p className="mt-5 text-sm font-medium text-[#707b91]">Supports: JPG, PNG, MP4 (Up to 200MB each)</p>
        </div>
      </div>
    </>
  );
}
