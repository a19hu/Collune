import type { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import { AuthSwitchLink, RegisterError, RegisterSubmitButtons } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";
import {
  checkEmailAvailability,
  getFacebookConnectUrl,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  registerCreator,
  verifyOtp,
} from "../lib/authApi";
import { CreatorRegisterForm, CreatorSocialPlatform, SocialAccountForm, VerificationState } from "../types";
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
  bio: "",
  about: "",
  gender: "",
  work_with: [],
};

const initialSocialAccounts: SocialAccountForm[] = [
  { platform: "INSTAGRAM", title: "Instagram", handle: "" },
  { platform: "YOUTUBE", title: "YouTube", handle: "" },
  { platform: "FACEBOOK", title: "Facebook", handle: "" },
  { platform: "X", title: "X (Twitter)", handle: "" },
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
  const [isConnecting, setIsConnecting] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onFieldChange = (field: keyof CreatorRegisterForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
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

  const validateAccountStep = async () => {
    setSubmitError("");
    try {
      const response = await checkEmailAvailability(form.email);
      if (!response.available) {
        setSubmitError("This email is already registered.");
        return false;
      }
      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not check email availability.");
      return false;
    }
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

  const socialPlatformToOAuth = (platform: CreatorSocialPlatform): "instagram" | "youtube" | "facebook" | "x" => {
    if (platform === "INSTAGRAM") return "instagram";
    if (platform === "YOUTUBE") return "youtube";
    if (platform === "FACEBOOK") return "facebook";
    return "x";
  };

  const submitCreatorRegistration = async (connectPlatform?: "instagram" | "youtube" | "facebook" | "x") => {
    setSubmitError("");

    const missingOtp: string[] = [];
    if (!verification.emailVerified) missingOtp.push("Email OTP is not verified.");
    // if (!verification.phoneVerified) missingOtp.push("Phone OTP is not verified.");
    if (missingOtp.length) {
      setSubmitError(missingOtp.join(" "));
      return;
    }

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
        bio: form.bio.trim(),
        about: form.about.trim(),
        gender: form.gender,
        work_with: form.work_with,
        social_accounts: [],
      });

      authStorage.setTokens(response.access, response.refresh, response.token);
      authStorage.setUser(response.user);
      setSessionUser(response.user);
      if (connectPlatform) {
        await connectOAuth(connectPlatform);
        return;
      }
      setRegistrationComplete(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your creator account.");
      setIsConnecting("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectSocialDuringRegistration = async (platform: CreatorSocialPlatform) => {
    if (!verification.emailVerified) {
      setVerificationStatus({ error: "Email OTP is not verified.", message: "" });
      return;
    }
    setIsConnecting(platform);
    await submitCreatorRegistration(socialPlatformToOAuth(platform));
  };

  const connectOAuth = async (platform: "instagram" | "youtube" | "facebook" | "x") => {
    setSubmitError("");
    setIsConnecting(platform);
    try {
      const response =
        platform === "instagram"
          ? await getInstagramConnectUrl()
          : platform === "youtube"
            ? await getYouTubeConnectUrl()
            : platform === "facebook"
              ? await getFacebookConnectUrl()
              : await getXConnectUrl();
      window.location.href = response.auth_url;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : `Could not connect ${platform}.`);
      setIsConnecting("");
    }
  };

  if (registrationComplete) {
    return (
      <Register totalSteps={totalSteps} step={totalSteps}>
        <section className="w-full max-w-[622px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-10 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-10">
          <h1 className="text-2xl font-black text-[#173ca8]">Connect your creator accounts</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6e7d99]">
            Your account is created. Connect Instagram, YouTube, Facebook, or X now to import public metrics automatically.
          </p>
          <RegisterError message={submitError} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["instagram", "Connect Instagram"],
              ["youtube", "Connect YouTube"],
              ["facebook", "Connect Facebook"],
              ["x", "Connect X"],
            ].map(([platform, label]) => (
              <button
                key={platform}
                type="button"
                disabled={Boolean(isConnecting)}
                onClick={() => void connectOAuth(platform as "instagram" | "youtube" | "facebook" | "x")}
                className="h-12 rounded-xl border border-[#d8e2fb] bg-white px-4 text-sm font-black text-[#173ca8] disabled:opacity-60"
              >
                {isConnecting === platform ? "Opening..." : label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/creator/profile", { replace: true })}
            className="mt-7 h-12 w-full rounded-xl bg-[#2447bd] text-sm font-black text-white"
          >
            Go to Creator Profile
          </button>
        </section>
      </Register>
    );
  }

  return (
    <Register totalSteps={totalSteps} step={step}>
      <form
        className="w-full max-w-[622px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-10 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-10"
        onSubmit={async (event) => {
          event.preventDefault();
          if (step === 1 && !(await validateAccountStep())) return;
          await formButton({
            step,
            totalSteps,
            form,
            verification,
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
            connectingPlatform={isConnecting}
            onFieldChange={onFieldChange}
            onEmailOtpChange={(event) => setForm((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
            onPhoneOtpChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            onConnectSocial={(platform) => void connectSocialDuringRegistration(platform)}
            onToggleFormArrayValue={onToggleFormArrayValue}
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
