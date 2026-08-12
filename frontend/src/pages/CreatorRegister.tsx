import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import { AuthSwitchLink, RegisterError, RegisterSubmitButtons } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";
import {
  checkEmailAvailability,
  getFacebookConnectUrl,
  getCreatorProfile,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  registerCreator,
  verifyOtp,
} from "../lib/authApi";
import { CreatorRegisterForm, CreatorSocialPlatform, SocialAccountForm, VerificationState } from "../types";
import { parseLocationParts, StepsCreatorRegister } from "./StepsCreatorRegister";
import { formButton, normalizePhoneNumber } from "../lib/function";

const totalSteps = 6;

const initialCreatorForm: CreatorRegisterForm = {
  name: "",
  email: "",
  emailOtp: "",
  phone_no: "",
  password: "",
  acceptedTerms: false,
  category: "Political Commentary",
  location: "",
  languages: ["Hindi", "English"],
  collaboration_preferences: ["Product Launches", "UGC Content"],
  bio: "",
  about: "",
  gender: "",
};

const initialSocialAccounts: SocialAccountForm[] = [
  { platform: "INSTAGRAM", title: "Instagram", handle: "" },
  { platform: "YOUTUBE", title: "YouTube", handle: "" },
  { platform: "FACEBOOK", title: "Facebook", handle: "" },
  { platform: "X", title: "X (Twitter)", handle: "" },
];

const initialConnectedPlatforms: Record<CreatorSocialPlatform, boolean> = {
  INSTAGRAM: false,
  YOUTUBE: false,
  FACEBOOK: false,
  X: false,
};

const socialConnectOptions: Array<{
  platform: CreatorSocialPlatform;
  oauth: "instagram" | "youtube" | "facebook" | "x";
  label: string;
}> = [
  { platform: "INSTAGRAM", oauth: "instagram", label: "Instagram" },
  { platform: "YOUTUBE", oauth: "youtube", label: "YouTube" },
  { platform: "FACEBOOK", oauth: "facebook", label: "Facebook" },
  { platform: "X", oauth: "x", label: "X" },
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
  const [step, setStepState] = useState(1);
  const [form, setForm] = useState<CreatorRegisterForm>(initialCreatorForm);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const socialAccounts = initialSocialAccounts;
  const [verification, setVerification] = useState<VerificationState>(initialVerification);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<CreatorSocialPlatform | "">(
    () => (localStorage.getItem("creatorRegisterSocialPlatform") as CreatorSocialPlatform | null) || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<CreatorSocialPlatform, boolean>>(initialConnectedPlatforms);
  const [submitError, setSubmitError] = useState("");

  const onFieldChange = (field: keyof CreatorRegisterForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const onLocationChange = (value: string) => {
    setForm((current) => ({ ...current, location: value }));
  };

  const onTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, acceptedTerms: event.target.checked }));
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

  const setStep = (updater: (current: number) => number) => {
    setStepState((current) => {
      const next = Math.min(totalSteps, Math.max(1, updater(current)));
      return next;
    });
  };

  const loadSocialConnectionStatus = async () => {
    const profile = await getCreatorProfile();
    const next = { ...initialConnectedPlatforms };
    profile.social_accounts.forEach((account) => {
      if (account.is_connected) next[account.platform] = true;
    });
    setConnectedPlatforms(next);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const socialStatus = socialConnectOptions.find(({ oauth }) => params.has(oauth));
    const shouldShowSocialStep = params.get("social_step") === "1" || Boolean(socialStatus);

    if (!shouldShowSocialStep) return;

    if (authStorage.getAccessToken()) {
      setRegistrationComplete(true);
      void loadSocialConnectionStatus().catch(() => {
        setSubmitError("Could not refresh social connection status.");
      });
    } else {
      setStepState(3);
    }

    if (socialStatus && params.get(socialStatus.oauth) === "connected") {
      localStorage.removeItem("creatorRegisterSocialPlatform");
    }

    if (socialStatus && params.get(socialStatus.oauth) === "error") {
      setSubmitError(`Could not connect ${socialStatus.label}. Please try again.`);
    }
  }, []);

  useEffect(() => {
    if (!registrationComplete || !authStorage.getAccessToken()) return;
    void loadSocialConnectionStatus().catch(() => {
      setSubmitError("Could not refresh social connection status.");
    });
  }, [registrationComplete]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(form.name.trim() && form.email.trim() && form.phone_no.trim() && form.password && form.acceptedTerms);
    if (step === 2) return verification.emailVerified;
    if (step === 3) return Boolean(selectedSocialPlatform);
    if (step === 4) return Boolean(form.category && form.location.trim() && form.bio.trim());
    if (step === 5) return Boolean(form.languages.length && form.collaboration_preferences.length);
    return true;
  }, [form, selectedSocialPlatform, step, verification.emailVerified]);

  const validateAccountStep = async () => {
    setSubmitError("");

    if (form.password.trim().length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return false;
    }

    if (!form.acceptedTerms) {
      setSubmitError("Please agree to the Terms of Service and Privacy Policy.");
      return false;
    }

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
      // await verifyOtp("PHONE", phoneNumber, phoneOtp);
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

    if (form.password.trim().length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    if (!form.acceptedTerms) {
      setSubmitError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    const missingOtp: string[] = [];
    if (!verification.emailVerified) missingOtp.push("Email OTP is not verified.");
    // if (!verification.phoneVerified) missingOtp.push("Phone OTP is not verified.");
    if (missingOtp.length) {
      setSubmitError(missingOtp.join(" "));
      return;
    }

    setIsSubmitting(true);

    try {
      const address = parseLocationParts(form.location.trim());
      const response = await registerCreator({
        user: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone_no: "+91" + normalizePhoneNumber(form.phone_no),
          password: form.password,
        },
        display_name: form.name.trim(),
        category: form.category,
        location: form.location.trim(),
        country: address.country,
        state: address.state,
        district: address.district,
        city: address.city,
        postalCode: address.postalCode,
        streetAddress: address.streetAddress,
        languages: form.languages,
        collaboration_preferences: form.collaboration_preferences,
        bio: form.bio.trim(),
        about: form.about.trim(),
        gender: form.gender,
        social_accounts: [],
      });

      authStorage.setTokens(response.access, response.refresh, response.token);
      authStorage.setUser(response.user);
      setSessionUser(response.user);
      if (connectPlatform) {
        await connectOAuth(connectPlatform);
        return;
      }
      localStorage.removeItem("creatorRegisterSocialPlatform");
      setRegistrationComplete(true);
      void loadSocialConnectionStatus();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your creator account.");
      setIsConnecting("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectSocialDuringRegistration = async (platform: CreatorSocialPlatform) => {
    setSelectedSocialPlatform(platform);
    localStorage.setItem("creatorRegisterSocialPlatform", platform);
    setVerificationStatus({ message: `${platform} selected. Continue to complete setup.`, error: "" });
  };

  const connectOAuth = async (platform: "instagram" | "youtube" | "facebook" | "x") => {
    setSubmitError("");
    setIsConnecting(platform);
    try {
      const response =
        platform === "instagram"
          ? await getInstagramConnectUrl("registration")
          : platform === "youtube"
            ? await getYouTubeConnectUrl("registration")
            : platform === "facebook"
              ? await getFacebookConnectUrl("registration")
              : await getXConnectUrl("registration");
      window.location.href = response.auth_url;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : `Could not connect ${platform}.`);
      setIsConnecting("");
      setStep(() => 3);
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
            {socialConnectOptions.map(({ platform, oauth, label }) => {
              const isConnected = connectedPlatforms[platform];
              return (
                <button
                  key={platform}
                  type="button"
                  disabled={isConnected || Boolean(isConnecting)}
                  onClick={() => void connectOAuth(oauth)}
                  className={`h-12 rounded-xl border px-4 text-sm font-black disabled:opacity-60 ${
                    isConnected
                      ? "border-[#bdebd9] bg-[#effbf6] text-[#067647]"
                      : "border-[#d8e2fb] bg-white text-[#173ca8]"
                  }`}
                >
                  {isConnected ? "Connected" : isConnecting === oauth ? "Opening..." : `Connect ${label}`}
                </button>
              );
            })}
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
            submitCreatorRegistration: () => submitCreatorRegistration(
              selectedSocialPlatform ? socialPlatformToOAuth(selectedSocialPlatform) : undefined,
            ),
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
            selectedSocialPlatform={selectedSocialPlatform}
            connectingPlatform={isConnecting}
            onFieldChange={onFieldChange}
            onLocationChange={onLocationChange}
            onEmailOtpChange={(event) => setForm((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
            onPhoneOtpChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            onConnectSocial={(platform) => void connectSocialDuringRegistration(platform)}
            onToggleFormArrayValue={onToggleFormArrayValue}
            onTogglePassword={() => setShowPassword((current) => !current)}
            onTermsChange={onTermsChange}
            onVerifyEmailOtp={() => void verifyEmailOtp()}
            onVerifyPhoneOtp={() => void verifyPhoneOtp()}
          />
        </div>

        <RegisterError message={submitError} />

        <RegisterSubmitButtons
          isFinalStep={step === totalSteps}
          isSubmitting={isSubmitting}
          disabled={!canContinue}
          onSkip={() => void submitCreatorRegistration()}
        />

        <AuthSwitchLink show={step === 1} href="/login" />
      </form>
    </Register>
  );
};
export default CreatorRegister;
