import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeClosed,
  Facebook,
  FileBadge2,
  FileCheck2,
  FileText,
  Globe,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPinned,
  Phone,
  Shield,
  UploadCloud,
  User,
  Users,
  Youtube,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { BrandSelect } from "../HtmlComponents/HtmlSelect";
import { AuthSwitchLink, RegisterError, RegisterStepHeader, RegisterSubmitButtons, VerificationBlock } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";
import { showProjectToast } from "../HtmlComponents/HtmlRoster";
import { checkEmailAvailability, registerBrandFormData, sendOtp, sendWhatsAppOtp, verifyOtp, verifyWhatsAppOtp } from "../lib/authApi";
import { normalizePhoneNumber } from "../lib/function";
import type { BrandRegisterForm, VerificationState } from "../types";
import { inputClass, labelClass } from "./StepsCreatorRegister";

const totalSteps = 5;
const maxLogoSizeBytes = 2 * 1024 * 1024;
const maxDocumentSizeBytes = 5 * 1024 * 1024;
const allowedLogoTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedLogoExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const allowedDocumentTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const allowedDocumentExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

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
  about_brand: "",
  website: "",
  company_size: "",
  linkedin_url: "",
  gst_number: "",
  cin_registration_number: "",
  year_established: "",
  headquarters_city: "",
  headquarters_state: "",
  headquarters_country: "",
  instagram_url: "",
  facebook_url: "",
  x_url: "",
  youtube_url: "",
  logo: null,
  gst_certificate: null,
  pan_card: null,
  company_registration_certificate: null,
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

type BrandFieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

type ReviewRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function ReviewRow({ icon, label, value }: ReviewRowProps) {
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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        className={`${inputClass} min-h-[148px] resize-y py-4 pl-4`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />
      <span className="mt-2 block text-right text-xs font-semibold text-[#7a869d]">
        {value.trim().length}/1000
      </span>
    </label>
  );
}

function FileUploadField({
  label,
  helper,
  file,
  onChange,
  accept,
}: {
  label: string;
  helper: string;
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  accept: string;
}) {
  return (
    <label className="block rounded-[22px] border border-dashed border-[#cfd8f6] bg-[#f8faff] p-5">
      <span className={labelClass}>{label}</span>
      <label className="mt-3 flex cursor-pointer items-center gap-4 rounded-[18px] border border-[#dbe3ff] bg-white px-4 py-4 transition hover:border-[#8fa4ff]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf0ff] text-[#3554d1]">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-[#1d203a]">{file?.name || `Upload ${label}`}</span>
          <span className="mt-1 block text-xs font-medium text-[#6f7c95]">{helper}</span>
        </span>
        <input type="file" className="hidden" accept={accept} onChange={onChange} />
      </label>
    </label>
  );
}

type BrandStepsProps = {
  step: number;
  form: BrandRegisterForm;
  showPassword: boolean;
  phoneOtp: string;
  verification: VerificationState;
  onFieldChange: (field: keyof BrandRegisterForm) => (event: BrandFieldChangeEvent) => void;
  onEmailOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTermsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (field: "logo" | "gst_certificate" | "pan_card" | "company_registration_certificate") => (event: ChangeEvent<HTMLInputElement>) => void;
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
  onFileChange,
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
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="WhatsApp Phone Number" icon={<Phone className="h-5 w-5" />} value={form.phone_no} onChange={onFieldChange("phone_no")} placeholder="99999 44444" pattern="[0-9]{10}" type="tel" required maxLength={10} minLength={10} />
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
            trailing={<button type="button" onClick={onTogglePassword} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-[#eef3ff]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}</button>}
            required
          />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Confirm Password" icon={<Lock className="h-5 w-5" />} value={form.confirmPassword} onChange={onFieldChange("confirmPassword")} placeholder="Repeat password" type={showPassword ? "text" : "password"} minLength={8} required />
          <label className="flex items-center gap-3 text-sm font-medium text-[#65758f]">
            <input type="checkbox" checked={form.acceptedTerms} onChange={onTermsChange} className="h-4 w-4 rounded border-[#9aa7ba]" required />
            I agree to the <Link className="text-[#4462ff]" to="/brand-services-terms">Terms and Conditions</Link> & <Link className="text-[#4462ff]" to="/privacy-policy">Privacy Policy</Link>
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
            copy="Enter the verification codes sent to your work email and WhatsApp number."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
        <RegisterError message={verification.error} className="mt-6" />
        <div className="mt-8 grid gap-7">
          <VerificationBlock icon={<Mail className="h-5 w-5" />} title="Verify Email" target={form.email || "your email"} otp={form.emailOtp} otpSent={verification.emailSent} verified={verification.emailVerified} isVerifying={verification.isCheckingEmail} onOtpChange={onEmailOtpChange} onVerify={onVerifyEmailOtp} />
          <VerificationBlock icon={<Phone className="h-5 w-5" />} title="Verify WhatsApp" target={form.phone_no || "your WhatsApp number"} otp={phoneOtp} otpSent={verification.phoneOtpSent} verified={verification.phoneVerified} isVerifying={verification.isVerifyingPhone} onOtpChange={onPhoneOtpChange} onVerify={onVerifyPhoneOtp} />
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <div className="mt-12">
          <RegisterStepHeader
            title="Brand identity"
            copy="Add your brand overview and the core company details creators should know."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
        <div className="mt-7 grid gap-5">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Company Name" icon={<Building2 className="h-5 w-5" />} value={form.company_name} onChange={onFieldChange("company_name")} placeholder="Your company name" required />
          <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Industry" icon={<BriefcaseBusiness className="h-5 w-5" />} placeholder="Select industry" value={form.industry} onChange={onFieldChange("industry")} required>
            {industryOptions.map((industry) => <option key={industry}>{industry}</option>)}
          </BrandSelect>
          <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Company Size" icon={<Users className="h-5 w-5" />} placeholder="Select size" value={form.company_size} onChange={onFieldChange("company_size")} required>
            {companySizeOptions.map((size) => <option key={size}>{size}</option>)}
          </BrandSelect>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Year Established" icon={<Shield className="h-5 w-5" />} value={form.year_established} onChange={onFieldChange("year_established")} placeholder="2020" type="number" max={new Date().getFullYear()} />
          <TextAreaField
            label="About Brand"
            value={form.about_brand}
            onChange={onFieldChange("about_brand") as (event: ChangeEvent<HTMLTextAreaElement>) => void}
            placeholder="Describe your company overview, products or services, target audience, and brand story in 500 to 1000 characters."
            minLength={100}
            maxLength={1000}
            required
          />
        </div>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <div className="mt-12">
          <RegisterStepHeader
            title="Company & social details"
            copy="Add official business details, headquarters, and optional social links."
            titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
            copyClassName="mt-6 text-base font-medium text-[#65758f]"
          />
        </div>
        <div className="mt-7 grid gap-5">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Website" icon={<Globe className="h-5 w-5" />} value={form.website} onChange={onFieldChange("website")} placeholder="https://yourbrand.com" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="LinkedIn Company Page" icon={<Linkedin className="h-5 w-5" />} value={form.linkedin_url} onChange={onFieldChange("linkedin_url")} placeholder="https://linkedin.com/company/acme-labs" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Instagram (Optional)" icon={<Instagram className="h-5 w-5" />} value={form.instagram_url} onChange={onFieldChange("instagram_url")} placeholder="https://instagram.com/yourbrand" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Facebook (Optional)" icon={<Facebook className="h-5 w-5" />} value={form.facebook_url} onChange={onFieldChange("facebook_url")} placeholder="https://facebook.com/yourbrand" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="X / Twitter (Optional)" icon={<Shield className="h-5 w-5" />} value={form.x_url} onChange={onFieldChange("x_url")} placeholder="https://x.com/yourbrand" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="YouTube (Optional)" icon={<Youtube className="h-5 w-5" />} value={form.youtube_url} onChange={onFieldChange("youtube_url")} placeholder="https://youtube.com/@yourbrand" type="url" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="GST Number (Optional)" icon={<FileText className="h-5 w-5" />} value={form.gst_number} onChange={onFieldChange("gst_number")} placeholder="22AAAAA0000A1Z5" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="CIN / Registration Number (Optional)" icon={<FileBadge2 className="h-5 w-5" />} value={form.cin_registration_number} onChange={onFieldChange("cin_registration_number")} placeholder="L12345MH2020PLC123456" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Headquarters City" icon={<MapPinned className="h-5 w-5" />} value={form.headquarters_city} onChange={onFieldChange("headquarters_city")} placeholder="Mumbai" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Headquarters State" icon={<MapPinned className="h-5 w-5" />} value={form.headquarters_state} onChange={onFieldChange("headquarters_state")} placeholder="Maharashtra" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Headquarters Country" icon={<MapPinned className="h-5 w-5" />} value={form.headquarters_country} onChange={onFieldChange("headquarters_country")} placeholder="India" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-12">
        <RegisterStepHeader
          title="Verification documents"
          copy="Upload your branding and business verification files, then review everything before submitting."
          titleClassName="text-[30px] font-black tracking-normal text-[#202337]"
          copyClassName="mt-6 text-base font-medium text-[#65758f]"
        />
      </div>
      <div className="mt-7 grid gap-5">
        <FileUploadField label="Company Logo" helper="PNG, JPG, or WebP up to 2MB" file={form.logo} onChange={onFileChange("logo")} accept=".png,.jpg,.jpeg,.webp" />
        <FileUploadField label="GST Certificate" helper="PDF or image up to 5MB" file={form.gst_certificate} onChange={onFileChange("gst_certificate")} accept=".pdf,.png,.jpg,.jpeg,.webp" />
        <FileUploadField label="PAN Card" helper="PDF or image up to 5MB" file={form.pan_card} onChange={onFileChange("pan_card")} accept=".pdf,.png,.jpg,.jpeg,.webp" />
        <FileUploadField label="Company Registration Certificate" helper="PDF or image up to 5MB" file={form.company_registration_certificate} onChange={onFileChange("company_registration_certificate")} accept=".pdf,.png,.jpg,.jpeg,.webp" />
      </div>

      <div className="mt-9 rounded-[28px] border border-[#dbe4ff] bg-[#f8fbff] p-6 shadow-[0_18px_48px_rgba(53,84,188,0.08)]">
        <h3 className="text-[20px] font-black text-[#202337]">Review your brand details</h3>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <ReviewRow icon={<Building2 className="h-5 w-5" />} label="Company Name" value={form.company_name} />
          <ReviewRow icon={<BriefcaseBusiness className="h-5 w-5" />} label="Industry" value={form.industry} />
          <ReviewRow icon={<Users className="h-5 w-5" />} label="Company Size" value={form.company_size} />
          <ReviewRow icon={<Shield className="h-5 w-5" />} label="Year Established" value={form.year_established} />
          <ReviewRow icon={<Globe className="h-5 w-5" />} label="Website" value={form.website} />
          <ReviewRow icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" value={form.linkedin_url} />
          <ReviewRow icon={<MapPinned className="h-5 w-5" />} label="Headquarters" value={[form.headquarters_city, form.headquarters_state, form.headquarters_country].filter(Boolean).join(", ")} />
          <ReviewRow icon={<FileCheck2 className="h-5 w-5" />} label="GST Number" value={form.gst_number} />
        </div>
        <div className="mt-6 rounded-[22px] bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#687796]">About Brand</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#47546a]">{form.about_brand || "Not provided"}</p>
        </div>
        <div className="mt-6 rounded-[22px] bg-white p-5">
          <h3 className="text-lg font-black text-[#202337]">What happens next?</h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#65758f]">
            Our team will review your company details and verification documents. Once verified, you'll be able to create campaigns and connect with creators.
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

  const onFieldChange = (field: keyof BrandRegisterForm) => (event: BrandFieldChangeEvent) => {
    if (submitError) setSubmitError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validateFile = (file: File, kind: "logo" | "document") => {
    const fileName = file.name.toLowerCase();
    if (kind === "logo") {
      const hasAllowedExtension = allowedLogoExtensions.some((extension) => fileName.endsWith(extension));
      if (!allowedLogoTypes.has(file.type) && !hasAllowedExtension) {
        return "Company logo must be a PNG, JPG, or WebP image.";
      }
      if (file.size > maxLogoSizeBytes) {
        return "Company logo must be 2MB or smaller.";
      }
      return "";
    }

    const hasAllowedExtension = allowedDocumentExtensions.some((extension) => fileName.endsWith(extension));
    if (!allowedDocumentTypes.has(file.type) && !hasAllowedExtension) {
      return "Verification files must be PDF, PNG, JPG, or WebP.";
    }
    if (file.size > maxDocumentSizeBytes) {
      return "Verification files must be 5MB or smaller.";
    }
    return "";
  };

  const onFileChange = (field: "logo" | "gst_certificate" | "pan_card" | "company_registration_certificate") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSubmitError("");
      setForm((current) => ({ ...current, [field]: null }));
      return;
    }

    const error = validateFile(file, field === "logo" ? "logo" : "document");
    if (error) {
      setSubmitError(error);
      event.target.value = "";
      setForm((current) => ({ ...current, [field]: null }));
      return;
    }

    setSubmitError("");
    setForm((current) => ({ ...current, [field]: file }));
  };

  const setVerificationStatus = (patch: Partial<VerificationState>) => {
    setVerification((current) => ({ ...current, ...patch }));
  };

  const validateAccountStep = async () => {
    if (form.password.trim().length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return false;
    }

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

  const validateBrandIdentityStep = () => {
    if (!form.company_name.trim()) {
      setSubmitError("Company name is required.");
      return false;
    }
    if (!form.industry.trim()) {
      setSubmitError("Please select an industry.");
      return false;
    }
    if (form.about_brand.trim().length < 100 || form.about_brand.trim().length > 1000) {
      setSubmitError("About Brand must be between 100 and 1000 characters.");
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
    setSubmitError("");
    setVerificationStatus({ [loadingKey]: true, error: "", message: "" });
    try {
      await sendOtp(channel, target);
      setVerificationStatus(successPatch);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : fallbackError;
      setVerificationStatus({ error: message });
      setSubmitError(message);
      return false;
    } finally {
      setVerificationStatus({ [loadingKey]: false });
    }
  };

  const sendBrandVerificationOtps = async () => {
    setSubmitError("");
    setVerificationStatus({ isSendingPhone: true, error: "", message: "" });
    let whatsappSent = false;
    try {
      await sendWhatsAppOtp(normalizePhoneNumber(form.phone_no));
      setVerificationStatus({ phoneOtpSent: true, phoneVerified: false, message: "WhatsApp OTP sent." });
      whatsappSent = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send WhatsApp OTP.";
      setVerificationStatus({ error: message });
      setSubmitError(message);
    } finally {
      setVerificationStatus({ isSendingPhone: false });
    }

    const emailSent = await sendContactOtp(
      "EMAIL",
      form.email.trim(),
      "isSendingEmail",
      { emailSent: true, emailVerified: false, message: "Email OTP sent." },
      "Could not send email OTP.",
    );

    return emailSent && whatsappSent;
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
      await verifyWhatsAppOtp(normalizePhoneNumber(form.phone_no), phoneOtp);
      setVerificationStatus({ phoneVerified: true, message: "WhatsApp number verified." });
    } catch (error) {
      setVerificationStatus({ error: error instanceof Error ? error.message : "Invalid WhatsApp OTP." });
    } finally {
      setVerificationStatus({ isVerifyingPhone: false });
    }
  };

  const validateVerificationStep = () => {
    const missing: string[] = [];
    if (!verification.emailVerified) missing.push("Email OTP is not verified.");
    if (!verification.phoneVerified) missing.push("WhatsApp OTP is not verified.");

    if (missing.length) {
      setVerificationStatus({ error: missing.join(" "), message: "" });
      return false;
    }

    return true;
  };

  const isOtpSending = step === 1 && (verification.isSendingEmail || verification.isSendingPhone);
  const isBusy = isSubmitting || isOtpSending;

  const submitBrandRegistration = async () => {
    setSubmitError("");

    if (form.password.trim().length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (!validateBrandIdentityStep()) {
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
        about_brand: form.about_brand.trim(),
        website: form.website.trim(),
        company_size: form.company_size,
        linkedin_url: form.linkedin_url.trim(),
        gst_number: form.gst_number.trim(),
        cin_registration_number: form.cin_registration_number.trim(),
        year_established: form.year_established ? Number(form.year_established) : undefined,
        headquarters_city: form.headquarters_city.trim(),
        headquarters_state: form.headquarters_state.trim(),
        headquarters_country: form.headquarters_country.trim(),
        instagram_url: form.instagram_url.trim(),
        facebook_url: form.facebook_url.trim(),
        x_url: form.x_url.trim(),
        youtube_url: form.youtube_url.trim(),
      };
      const response = await registerBrandFormData(payload, {
        logo: form.logo,
        gst_certificate: form.gst_certificate,
        pan_card: form.pan_card,
        company_registration_certificate: form.company_registration_certificate,
      });

      authStorage.setTokens(response.access, response.refresh, response.token);
      authStorage.setUser(response.user);
      setSessionUser(response.user);
      showProjectToast("success", "Registration successful", "Your brand account has been created.");
      navigate("/brand", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create your brand account.";
      setSubmitError(message);
      showProjectToast("error", "Registration failed", message);
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
          if (step === 3 && !validateBrandIdentityStep()) return;
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
          onFileChange={onFileChange}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onVerifyEmailOtp={() => void verifyEmailOtp()}
          onVerifyPhoneOtp={() => void verifyPhoneOtp()}
        />

        <RegisterError message={submitError} />

        <RegisterSubmitButtons
          isFinalStep={step === totalSteps}
          isSubmitting={isBusy}
          loadingLabel="Sending OTPs..."
          showBack={step > 1}
          onBack={() => {
            setSubmitError("");
            setStep((current) => Math.max(1, current - 1));
          }}
          finalLabel="Create brand account"
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
