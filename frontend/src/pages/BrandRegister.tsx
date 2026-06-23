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
import { useNavigate } from "react-router-dom";

import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { BrandSelect } from "../HtmlComponents/HtmlSelect";
import { AuthSwitchLink, RegisterError, RegisterStepHeader, RegisterSubmitButtons } from "../HtmlComponents/RegisterFormParts";
import Register from "../components/layout/Register";
import { useAuth } from "../contexts/AuthContext";
import { checkEmailAvailability, registerBrandFormData } from "../lib/authApi";
import { normalizePhoneNumber } from "../lib/function";
import type { BrandRegisterForm } from "../types";

const totalSteps = 3;

const inputClass =
  "h-[47px] w-full rounded-lg border border-[#d9e2f2] bg-white px-11 text-sm font-medium text-[#202337] outline-none transition placeholder:text-[#95a3ba] focus:border-[#5068f2] focus:ring-4 focus:ring-[#5068f2]/10";
const labelClass = "mb-2 block text-xs font-black text-[#202337]";

const initialBrandForm: BrandRegisterForm = {
  name: "",
  email: "",
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
  onFieldChange: (field: keyof BrandRegisterForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTermsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
};

function BrandRegisterSteps({
  step,
  form,
  showPassword,
  onFieldChange,
  onTermsChange,
  onLogoChange,
  onTogglePassword,
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
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Phone Number" icon={<Phone className="h-5 w-5" />} value={form.phone_no} onChange={onFieldChange("phone_no")} placeholder="+91 9876543210" type="tel" pattern="^\+[1-9]\d{7,14}$" required maxLength={13} minLength={13}/>
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
            I agree to the <a className="text-[#4462ff]" href="#">Terms & Privacy Policy</a>
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
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={onLogoChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Upload company logo"
              />
              <span>
                <UploadCloud className="mx-auto h-10 w-10 text-[#95a3ba]" />
                <strong className="mt-3 block text-sm font-black text-[#202337]">{form.logo ? form.logo.name : "Upload your logo"}</strong>
                <span className="mt-2 block text-xs font-medium text-[#95a3ba]">PNG, JPG or SVG - Max size 2MB</span>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onFieldChange = (field: keyof BrandRegisterForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (submitError) setSubmitError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
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
          phone_no: normalizePhoneNumber(form.phone_no),
          password: form.password,
        },
        company_name: form.company_name.trim(),
        industry: form.industry,
        website: form.website.trim(),
        company_size: form.company_size,
        linkedin_url: form.linkedin_url.trim(),
      };
      const response = await registerBrandFormData(payload, form.logo);

      localStorage.setItem("saaserp_access_token", response.access);
      localStorage.setItem("saaserp_refresh_token", response.refresh);
      localStorage.setItem("saaserp_drf_token", response.token);
      localStorage.setItem("saaserp_last_login_username", response.user.username);

      setSessionUser({
        id: response.user.user_id,
        phone: response.user.phone_no || "",
        name: response.user.name || response.user.username,
        email: response.user.email,
        role: "Brand",
        schoolCode: response.brand.brand_id,
      });
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
          if (step === 1 && !(await validateAccountStep())) return;
          setStep((current) => Math.min(totalSteps, current + 1));
        }}
      >
        <HtmlProgess step={step} totalSteps={totalSteps} />

        <BrandRegisterSteps
          step={step}
          form={form}
          showPassword={showPassword}
          onFieldChange={onFieldChange}
          onTermsChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))}
          onLogoChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (file && file.size > 2 * 1024 * 1024) {
              setSubmitError("Company logo must be 2MB or smaller.");
              event.target.value = "";
              return;
            }
            setSubmitError("");
            setForm((current) => ({ ...current, logo: file }));
          }}
          onTogglePassword={() => setShowPassword((current) => !current)}
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
