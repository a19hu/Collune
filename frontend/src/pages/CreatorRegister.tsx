import type { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import { AuthSwitchLink, RegisterError, RegisterSubmitButtons } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { registerCreator, verifyOtp } from "../lib/authApi";
import { CreatorRegisterForm, SocialAccountForm, VerificationState } from "../types";
import { StepsCreatorRegister } from "./StepsCreatorRegister";
import { formButton, normalizePhoneNumber } from "../lib/function";

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
  { platform: "INSTAGRAM", title: "Instagram", handle: "" },
  { platform: "YOUTUBE", title: "YouTube", handle: "" },
  { platform: "LINKEDIN", title: "LinkedIn", handle: "" },
  { platform: "X", title: "X (Twitter)", handle: "" },
  { platform: "FACEBOOK", title: "Facebook", handle: "" },
  { platform: "TIKTOK", title: "TikTok", handle: "" },
  { platform: "SNAPCHAT", title: "Snapchat", handle: "" },
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

  return (
    <Register totalSteps={totalSteps} step={step}>
      <form
        className="w-full max-w-[622px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-10 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-10"
        onSubmit={async (event) => {
          event.preventDefault();
          await formButton({
            step,
            totalSteps,
            form,
            setStep,
            setVerificationStatus,
            submitCreatorRegistration,
          });
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

        <RegisterError message={submitError} />

        <RegisterSubmitButtons
          isFinalStep={step === totalSteps}
          isSubmitting={isSubmitting}
          onSkip={() => void submitCreatorRegistration()}
        />

        <AuthSwitchLink show={step === 1} href="/login" />
      </form>
    </Register>
  );
};
export default CreatorRegister;
