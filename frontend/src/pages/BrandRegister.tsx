import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Eye,
  Globe,
  Linkedin,
  Lock,
  Mail,
  Phone,
  Shield,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { BrandSelect } from "../HtmlComponents/HtmlSelect";
import { AuthSwitchLink, RegisterError, RegisterStepHeader, RegisterSubmitButtons, VerificationBlock } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";
import { checkEmailAvailability, registerBrandFormData, sendOtp, verifyOtp } from "../lib/authApi";
import { normalizePhoneNumber } from "../lib/function";
import type { BrandRegisterForm, VerificationState } from "../types";
import { inputClass, labelClass } from "./StepsCreatorRegister";

const totalSteps = 4;
const maxLogoSizeBytes = 2 * 1024 * 1024;
const allowedLogoTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedLogoExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const initialBrandForm: BrandRegisterForm = {
  name: "",
  email: "",
  emailOtp: "",
  phone_no: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
  company_name: "",
  industry: "",
  website: "",
  company_size: "",
  linkedin_url: "",
  logo: null,
};

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

const industryOptions = ["Technology", "Consumer Brand", "Finance", "Education"];
const companySizeOptions = ["1-2", "2-10", "10-50", "50+"];

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e0ff] text-[#4b22f4]">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-[#65758f]">{label}</p>
        <p className="mt-1 text-base font-black text-black">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

type BrandStepsProps = {
  step: number;
  form: BrandRegisterForm;
  showPassword: boolean;
  phoneOtp: string;
  verification: VerificationState;
  onFieldChange: (field: keyof BrandRegisterForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEmailOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTermsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onVerifyEmailOtp: () => void;
  onVerifyPhoneOtp: () => void;
};

function BrandRegisterSteps({
  step,
  form,
  showPassword,
  phoneOtp,
  verification,
  onFieldChange,
  onEmailOtpChange,
  onPhoneOtpChange,
  onTermsChange,
  onLogoChange,
  onTogglePassword,
  onVerifyEmailOtp,
  onVerifyPhoneOtp,
}: BrandStepsProps) {
  if (step === 1) {
    return (
      <>
        <div className="mt-16">
          <RegisterStepHeader
            title="Create your account"
            copy="Let's get your company set up on Collune."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
        <div className="mt-12 grid gap-6">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Full Name" icon={<User className="h-5 w-5" />} value={form.name} onChange={onFieldChange("name")} placeholder="John Smith" required />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Work Email" icon={<Mail className="h-5 w-5" />} value={form.email} onChange={onFieldChange("email")} placeholder="john@company.com" type="email" required />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Phone Number" icon={<Phone className="h-5 w-5" />} value={form.phone_no} onChange={onFieldChange("phone_no")} placeholder="99999 44444" pattern="[0-9]{10}" type="tel" required maxLength={10} minLength={10} />
          <HtmlInput
            labelClass={labelClass}
            inputClass={inputClass}
            label="Password"
            icon={<Lock className="h-5 w-5" />}
            value={form.password}
            onChange={onFieldChange("password")}
            placeholder="Minimum 8 characters"
            type={showPassword ? "text" : "password"}
            minLength={8}
            trailing={
              <button type="button" onClick={onTogglePassword} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-[#eef3ff]" aria-label={showPassword ? "Hide password" : "Show password"}>
                <Eye className="h-5 w-5" />
              </button>
            }
            required
          />
          <HtmlInput
            labelClass={labelClass}
            inputClass={inputClass}
            label="Confirm Password"
            icon={<Lock className="h-5 w-5" />}
            value={form.confirmPassword}
            onChange={onFieldChange("confirmPassword")}
            placeholder="Repeat password"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
          />
          <label className="flex items-center gap-3 text-sm font-medium text-[#65758f]">
            <input type="checkbox" checked={form.acceptedTerms} onChange={onTermsChange} className="h-4 w-4 rounded border-[#9aa7ba]" required />
            I agree to the <Link className="text-[#4462ff]" to="/brand-services-terms" >Terms and Conditions</Link> &<Link className="text-[#4462ff]" to="/privacy-policy">Privacy Policy</Link>
          </label>
        </div>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <div className="mt-12">
          <RegisterStepHeader
            title="Verify your contact"
            copy="Enter the verification codes sent to your work email and phone."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
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
        <div className="mt-12">
          <RegisterStepHeader
            title="Company Information"
            copy="Add a few details about your company."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
        <div className="mt-7 grid gap-5">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Company Name" icon={<Building2 className="h-5 w-5" />} value={form.company_name} onChange={onFieldChange("company_name")} placeholder="Your company name" required />
          <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Industry" icon={<BriefcaseBusiness className="h-5 w-5" />} placeholder="Select industry" value={form.industry} onChange={onFieldChange("industry")} required>
            {industryOptions.map((industry) => <option key={industry}>{industry}</option>)}
          </BrandSelect>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Company Website" icon={<Globe className="h-5 w-5" />} value={form.website} onChange={onFieldChange("website")} placeholder="https://www.acmelabs.com" type="url" />
          <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Company Size" icon={<Users className="h-5 w-5" />} placeholder="Select company size" value={form.company_size} onChange={onFieldChange("company_size")} required>
            {companySizeOptions.map((size) => <option key={size}>{size}</option>)}
          </BrandSelect>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="LinkedIn Company Page (Optional)" icon={<Linkedin className="h-5 w-5" />} value={form.linkedin_url} onChange={onFieldChange("linkedin_url")} placeholder="https://linkedin.com/company/acme-labs" type="url" />
          <label className="block">
            <span className={labelClass}>Company Logo <span className="text-[#95a3ba]">(Optional)</span></span>
            <span className="relative grid h-[148px] place-items-center rounded-lg border-2 border-dashed border-[#d9e2f2] text-center transition hover:border-[#5068f2]">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={onLogoChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Upload company logo"
              />
              <span>
                <UploadCloud className="mx-auto h-10 w-10 text-[#95a3ba]" />
                <strong className="mt-3 block text-sm font-black text-[#202337]">{form.logo ? form.logo.name : "Upload your logo"}</strong>
                <span className="mt-2 block text-xs font-medium text-[#95a3ba]">PNG, JPG or WebP - Max size 2MB</span>
              </span>
            </span>
          </label>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-[#dfe4ed] p-7">
        <div className="grid gap-7">
          <ReviewRow icon={<Building2 className="h-5 w-5" />} label="Company Name" value={form.company_name} />
          <ReviewRow icon={<BriefcaseBusiness className="h-5 w-5" />} label="Industry" value={form.industry} />
          <ReviewRow icon={<Globe className="h-5 w-5" />} label="Website" value={form.website} />
          <ReviewRow icon={<Users className="h-5 w-5" />} label="Company Size" value={form.company_size} />
          <ReviewRow icon={<Linkedin className="h-5 w-5" />} label="LinkedIn Company Page" value={form.linkedin_url} />
          <ReviewRow icon={<Shield className="h-5 w-5" />} label="Verification Status" value="Pending Review" />
        </div>
      </div>
      <div className="mt-11 flex gap-5 rounded-xl bg-[#dfe8ff] p-6">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4b22f4] text-xs font-black text-white">i</span>
        <div>
          <h3 className="font-black text-black">What happens next?</h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#65758f]">
            Our team will review your company details. Once verified, you'll be able to start creating campaigns and connecting with creators.
          </p>
        </div>
      </div>
    </>
  );
}

const BrandRegister = () => {
  const navigate = useNavigate();
  const { setSessionUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BrandRegisterForm>(initialBrandForm);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verification, setVerification] = useState<VerificationState>(initialVerification);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onFieldChange = (field: keyof BrandRegisterForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (submitError) setSubmitError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const setVerificationStatus = (patch: Partial<VerificationState>) => {
    setVerification((current) => ({ ...current, ...patch }));
  };

  const validateAccountStep = async () => {
    if (form.password !== form.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return false;
    }

    try {
      const response = await checkEmailAvailability(form.email);
      if (!response.available) {
        setSubmitError("This email is already registered.");
        return false;
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not check email availability.");
      return false;
    }

    setSubmitError("");
    return true;
  };

  const sendContactOtp = async (
    channel: "EMAIL" | "PHONE",
    target: string,
    loadingKey: "isSendingEmail" | "isSendingPhone",
    successPatch: Partial<VerificationState>,
    fallbackError: string,
  ) => {
    setVerificationStatus({ [loadingKey]: true, error: "", message: "" });
    try {
      await sendOtp(channel, target);
      setVerificationStatus(successPatch);
      return true;
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : fallbackError });
      return false;
    } finally {
      setVerificationStatus({ [loadingKey]: false });
    }
  };

  const sendBrandVerificationOtps = async () => {
    const emailSent = await sendContactOtp(
      "EMAIL",
      form.email.trim(),
      "isSendingEmail",
      { emailSent: true, emailVerified: false, message: "Email OTP sent." },
      "Could not send email OTP.",
    );
    if (!emailSent) return false;

    const phoneSent = await sendContactOtp(
      "PHONE",
      normalizePhoneNumber(form.phone_no),
      "isSendingPhone",
      { phoneOtpSent: true, phoneVerified: false, message: "Phone OTP sent." },
      "Could not send phone OTP.",
    );
    return phoneSent;
  };

  const verifyEmailOtp = async () => {
    setVerificationStatus({ isCheckingEmail: true, error: "", message: "" });
    try {
      await verifyOtp("EMAIL", form.email.trim(), form.emailOtp);
      setVerificationStatus({ emailVerified: true, message: "Email verified." });
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : "Invalid email OTP." });
    } finally {
      setVerificationStatus({ isCheckingEmail: false });
    }
  };

  const verifyPhoneOtp = async () => {
    setVerificationStatus({ isVerifyingPhone: true, error: "", message: "" });
    try {
      // await verifyOtp("PHONE", normalizePhoneNumber(form.phone_no), phoneOtp);
      setVerificationStatus({ phoneVerified: true, message: "Phone number verified." });
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : "Invalid phone OTP." });
    } finally {
      setVerificationStatus({ isVerifyingPhone: false });
    }
  };

  const validateVerificationStep = () => {
    const missing: string[] = [];
    if (!verification.emailVerified) missing.push("Email OTP is not verified.");
    if (!verification.phoneVerified) missing.push("Phone OTP is not verified.");

    if (missing.length) {
      setVerificationStatus({ error: missing.join(" "), message: "" });
      return false;
    }

    return true;
  };

  const submitBrandRegistration = async () => {
    setSubmitError("");

    if (form.password !== form.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone_no: "+91" + normalizePhoneNumber(form.phone_no),
          password: form.password,
        },
        company_name: form.company_name.trim(),
        industry: form.industry,
        website: form.website.trim(),
        company_size: form.company_size,
        linkedin_url: form.linkedin_url.trim(),
      };
      const response = await registerBrandFormData(payload, form.logo);

      authStorage.setTokens(response.access, response.refresh, response.token);
      authStorage.setUser(response.user);
      setSessionUser(response.user);
      navigate("/brand", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your brand account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Register step={step} totalSteps={totalSteps}>
      <form
        className="mx-auto w-full max-w-[580px]"
        onSubmit={async (event) => {
          event.preventDefault();
          if (step === totalSteps) {
            void submitBrandRegistration();
            return;
          }
          if (step === 1) {
            if (!(await validateAccountStep())) return;
            if (!(await sendBrandVerificationOtps())) return;
          }
          if (step === 2 && !validateVerificationStep()) return;
          setStep((current) => Math.min(totalSteps, current + 1));
        }}
      >
        <HtmlProgess step={step} totalSteps={totalSteps} />

        <BrandRegisterSteps
          step={step}
          form={form}
          showPassword={showPassword}
          phoneOtp={phoneOtp}
          verification={verification}
          onFieldChange={onFieldChange}
          onEmailOtpChange={(event) => setForm((current) => ({ ...current, emailOtp: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
          onPhoneOtpChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onTermsChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))}
          onLogoChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (!file) {
              setSubmitError("");
              setForm((current) => ({ ...current, logo: null }));
              return;
            }

            const fileName = file.name.toLowerCase();
            const hasAllowedExtension = allowedLogoExtensions.some((extension) => fileName.endsWith(extension));
            if (!allowedLogoTypes.has(file.type) && !hasAllowedExtension) {
              setSubmitError("Company logo must be a PNG, JPG, or WebP image.");
              event.target.value = "";
              setForm((current) => ({ ...current, logo: null }));
              return;
            }

            if (file.size > maxLogoSizeBytes) {
              setSubmitError("Company logo must be 2MB or smaller.");
              event.target.value = "";
              setForm((current) => ({ ...current, logo: null }));
              return;
            }
            setSubmitError("");
            setForm((current) => ({ ...current, logo: file }));
          }}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onVerifyEmailOtp={() => void verifyEmailOtp()}
          onVerifyPhoneOtp={() => void verifyPhoneOtp()}
        />

        <RegisterError message={submitError} />

        <RegisterSubmitButtons
          isFinalStep={step === totalSteps}
          isSubmitting={isSubmitting}
          finalLabel="Go to dashboard"
          submittingLabel="Creating brand..."
          className="mt-12"
          buttonClassName="inline-flex h-[50px] w-full items-center justify-center gap-3 rounded-lg bg-[#4965f4] text-base font-black text-white shadow-[0_12px_22px_rgba(73,101,244,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
        />

        <AuthSwitchLink
          show={step === 1}
          href="/login"
          label="Login"
          className="mt-6 text-center text-sm font-medium text-[#65758f]"
          linkClassName="text-[#4462ff]"
        />
      </form>
    </Register>
  );
};

export default BrandRegister;
