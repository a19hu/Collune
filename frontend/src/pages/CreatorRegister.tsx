import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/Logo.svg";
import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { registerCreator, sendOtp, verifyOtp, } from "../lib/authApi";
import { CreatorRegisterForm, SocialAccountForm, VerificationState } from "../types";
import { StepsCreatorRegister } from "./StepsCreatorRegister";
import { formButton } from "../lib/function";

const totalSteps = 6;

const initialCreatorForm: CreatorRegisterForm = {
  name: "",
  email: "",
  emailOtp: "",
  phone_no: "",
  password: "",
  category: "Political Commentary",
  location: "",
  languages: ["Hindi", "English"],
  collaboration_preferences: ["Sponsored Posts", "Long-Term Partnerships", "Product Launches", "UGC Content"],
  preferred_response_time: "Within 24 Hours",
  open_to_travel: true,
  bio: "",
};

const initialSocialAccounts: SocialAccountForm[] = [
  { platform: "INSTAGRAM", title: "Instagram", handle: ""},
  { platform: "YOUTUBE", title: "YouTube", handle: "" },
  { platform: "LINKEDIN", title: "LinkedIn", handle: "" },
  { platform: "X", title: "X (Twitter)", handle: "" },
  { platform: "FACEBOOK", title: "Facebook", handle: "" },
  { platform: "TIKTOK", title: "TikTok", handle: "" },
  { platform: "SNAPCHAT", title: "Snapchat", handle: "" },
  { platform: "PINTEREST", title: "Pinterest", handle: "" },
  { platform: "THREADS", title: "Threads", handle: "" },
  { platform: "WEBSITE", title: "Website", handle: "" },
];



const initialVerification: VerificationState = {
  emailSent: false,
  emailVerified: false,
  phoneOtpSent: false,
  phoneVerified: false,
  isSendingEmail: false,
  isSendingPhone: false,
  isCheckingEmail: false,
  isVerifyingPhone: false,
  message: "",
  error: "",
};



function normalizePhoneNumber(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

const CreatorRegister = () => {
  const navigate = useNavigate();
  const { setSessionUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CreatorRegisterForm>(initialCreatorForm);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountForm[]>(initialSocialAccounts);
  const [verification, setVerification] = useState<VerificationState>(initialVerification);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onFieldChange = (field: keyof CreatorRegisterForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const onSocialAccountChange = (index: number, field: keyof Pick<SocialAccountForm, "handle">) => (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSocialAccounts((current) => current.map((account, itemIndex) => (
      itemIndex === index ? { ...account, [field]: event.target.value } : account
    )));
  };

  const onToggleFormArrayValue = (field: "languages" | "collaboration_preferences", value: string) => {
    setForm((current) => {
      const currentValues = current[field];
      return {
        ...current,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const setVerificationStatus = (patch: Partial<VerificationState>) => {
    setVerification((current) => ({ ...current, ...patch }));
  };



  const verifyEmailOtp = async () => {

    setVerificationStatus({ isCheckingEmail: true, error: "", message: "" });
    try {
      const email = form.email.trim();
      await verifyOtp("EMAIL", email, form.emailOtp);
      setVerificationStatus({
        emailVerified: true,
        message: "Email verified.",
      });
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : "Invalid email OTP." });
    } finally {
      setVerificationStatus({ isCheckingEmail: false });
    }
  };

  const verifyPhoneOtp = async () => {
    setVerificationStatus({ isVerifyingPhone: true, error: "", message: "" });
    try {
      const phoneNumber = normalizePhoneNumber(form.phone_no);
      await verifyOtp("PHONE", phoneNumber, phoneOtp);
      setVerificationStatus({ phoneVerified: true, message: "Phone number verified." });
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : "Invalid phone OTP." });
    } finally {
      setVerificationStatus({ isVerifyingPhone: false });
    }
  };



  const submitCreatorRegistration = async () => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await registerCreator({
        user: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone_no: normalizePhoneNumber(form.phone_no),
          password: form.password,
        },
        display_name: form.name.trim(),
        category: form.category,
        location: form.location.trim(),
        languages: form.languages,
        collaboration_preferences: form.collaboration_preferences,
        preferred_response_time: form.preferred_response_time,
        open_to_travel: form.open_to_travel,
        bio: form.bio.trim(),
        social_accounts: socialAccounts
          .filter((account) => account.handle.trim())
          .map((account) => ({
            platform: account.platform,
            handle: account.handle.trim(),
            is_connected: true,
          })),
      });

      localStorage.setItem("saaserp_access_token", response.access);
      localStorage.setItem("saaserp_refresh_token", response.refresh);
      localStorage.setItem("saaserp_drf_token", response.token);
      localStorage.setItem("saaserp_last_login_username", response.user.username);

      setSessionUser({
        id: response.user.user_id,
        phone: response.user.phone_no || "",
        name: response.user.name || response.user.username,
        email: response.user.email,
        role: "Creator",
        schoolCode: response.creator.creator_id,
      });
      navigate("/creator", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your creator account.");
    } finally {
      setIsSubmitting(false);
    }
  };



  if (step === 6) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] p-4 text-[#202337] md:p-10">
        <section className="relative mx-auto min-h-[calc(100vh-80px)] max-w-[1342px] overflow-hidden rounded-xl bg-white px-7 py-8 md:px-12">
          <a href="/" aria-label="Collune home" className="absolute left-7 top-8 inline-flex w-max md:left-12">
            <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
          </a>

          <div className="flex min-h-[calc(100vh-144px)] items-center justify-center pt-20">
            <form
              className="w-full max-w-[824px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-11 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-8"
              onSubmit={(event) => {
                event.preventDefault();
                void submitCreatorRegistration();
              }}
            >
              <HtmlProgess step={step} totalSteps={totalSteps} divClassName="text-center" />

              <div className="mt-9">
                <StepsCreatorRegister
                  step={step}
                  form={form}
                  showPassword={showPassword}
                  phoneOtp={phoneOtp}
                  socialAccounts={socialAccounts}
                  verification={verification}
                  onFieldChange={onFieldChange}
                  onEmailOtpChange={(event) => setForm((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  onPhoneOtpChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  onSocialAccountChange={onSocialAccountChange}
                  onToggleFormArrayValue={onToggleFormArrayValue}
                  onResponseTimeChange={(value) => setForm((current) => ({ ...current, preferred_response_time: value }))}
                  onTravelToggle={() => setForm((current) => ({ ...current, open_to_travel: !current.open_to_travel }))}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  onVerifyEmailOtp={() => void verifyEmailOtp()}
                  onVerifyPhoneOtp={() => void verifyPhoneOtp()}
                />
              </div>

              <div className="mx-auto mt-9 max-w-[535px]">
                {submitError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {submitError}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8]"
                >
                  {isSubmitting ? "Creating account..." : "Continue to Dashboard"}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => void submitCreatorRegistration()} disabled={isSubmitting} className="mt-3 w-full text-center text-sm font-black text-[#64738e]">
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <Register
        totalSteps={totalSteps}
        step={step}
        children={
          <section className="flex items-center justify-center px-5 py-10 md:px-10">
            <form
              className="w-full max-w-[622px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-10 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-10"
              onSubmit={async (event) => {
                event.preventDefault();
                await formButton(step);
              }}

            >
              <HtmlProgess step={step} totalSteps={totalSteps} divClassName="text-center" />

              <div className="mt-10">
                <StepsCreatorRegister
                  step={step}
                  form={form}
                  showPassword={showPassword}
                  phoneOtp={phoneOtp}
                  socialAccounts={socialAccounts}
                  verification={verification}
                  onFieldChange={onFieldChange}
                  onEmailOtpChange={(event) => setForm((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  onPhoneOtpChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  onSocialAccountChange={onSocialAccountChange}
                  onToggleFormArrayValue={onToggleFormArrayValue}
                  onResponseTimeChange={(value) => setForm((current) => ({ ...current, preferred_response_time: value }))}
                  onTravelToggle={() => setForm((current) => ({ ...current, open_to_travel: !current.open_to_travel }))}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  onVerifyEmailOtp={() => void verifyEmailOtp()}
                  onVerifyPhoneOtp={() => void verifyPhoneOtp()}
                />
              </div>

              {submitError ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {submitError}
                </div>
              ) : null}

              <div className="mt-6 flex">
                <button
                  type="submit"
                  className="inline-flex h-[50px] flex-1 items-center justify-center gap-3 rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8]"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {step === 1 ? (
                <p className="mt-8 text-center text-xs font-medium text-[#738098]">
                  Already have an account? <a className="font-black text-[#1438a8]" href="#login">Log in</a>
                </p>
              ) : null}
            </form>
          </section>

        }
      />

    </>
  );
};
export default CreatorRegister;
