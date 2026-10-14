import { CalendarDays, Check, ChevronDown, Eye, EyeClosed, Globe, Grid2X2, Instagram, Lock, Mail, MapPin, MapPinned, Megaphone, Phone, Play, Rocket, User, Users, X, Youtube } from "lucide-react";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { RegisterError, RegisterStepHeader, SelectablePill, VerificationBlock } from "../HtmlComponents/RegisterFormParts";
import { CreatorRegisterForm, SocialAccountForm, VerificationState } from "../types";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getGeoNamesLocations, type GeoNamesLocation } from "../lib/authApi";


export const inputClass =
  "h-[52px] w-full rounded-xl border border-[#d8e2fb] bg-white px-12 text-[15px] font-semibold text-brand-primary outline-none transition placeholder:text-[#9aa7bf] focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10";
export const labelClass = "mb-2 block text-xs font-semibold text-[#6e7d99]";

const languageOptions = ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam"];
const categoryOptions = ["", "Political Commentary", "Business & Finance", "Lifestyle", "Technology", "Beauty", "Travel", "Education"];
const genderOptions = ["", "Female", "Male", "other"];

const collaborationOptions = [
  { title: "Sponsored Posts", copy: "Promote your content through sponsored posts", icon: <Megaphone className="h-7 w-7" /> },
  { title: "Long-Term Partnerships", copy: "Build ongoing relationships with brands", icon: <Users className="h-7 w-7" /> },
  { title: "Product Launches", copy: "Be part of exciting new product launches", icon: <Rocket className="h-7 w-7" /> },
  { title: "UGC Content", copy: "Create user-generated content for brands", icon: <Play className="h-7 w-7" /> },
  { title: "Events", copy: "Participate in brand events and meetups", icon: <CalendarDays className="h-7 w-7" /> },
  { title: "Webinars", copy: "Join or host webinars and live sessions", icon: <Globe className="h-7 w-7" /> },
];

export type AddressFieldKey = "country" | "state" | "district" | "city" | "postalCode" | "streetAddress";

export type AddressParts = Record<AddressFieldKey, string>;

export const emptyAddressParts: AddressParts = {
  country: "",
  state: "",
  district: "",
  city: "",
  postalCode: "",
  streetAddress: "",
};

const addressFieldOrder: AddressFieldKey[] = ["country", "state", "district", "city", "postalCode", "streetAddress"];

const addressFieldMeta: Array<{
  key: AddressFieldKey;
  label: string;
  placeholder: string;
  optional?: boolean;
}> = [
  { key: "country", label: "Country", placeholder: "India" },
  { key: "state", label: "State", placeholder: "Delhi" },
  { key: "district", label: "District", placeholder: "Central Delhi" },
  { key: "city", label: "City", placeholder: "New Delhi" },
  { key: "postalCode", label: "Postal Code", placeholder: "110001" },
  { key: "streetAddress", label: "Street Address", placeholder: "House no., building, street", optional: true },
];

function normalizeAddressFieldKey(rawKey: string): AddressFieldKey | null {
  const normalizedKey = rawKey.trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (normalizedKey === "country") return "country";
  if (normalizedKey === "state") return "state";
  if (normalizedKey === "district") return "district";
  if (normalizedKey === "city") return "city";
  if (normalizedKey === "postalcode") return "postalCode";
  if (normalizedKey === "streetaddress") return "streetAddress";

  return null;
}

export function parseLocationParts(location: string): AddressParts {
  if (!location.trim()) return emptyAddressParts;

  const structuredParts = location.split("|").reduce<Partial<AddressParts>>((accumulator, item) => {
    const [rawKey, ...rest] = item.split(":");
    const key = rawKey ? normalizeAddressFieldKey(rawKey) : null;
    if (!key) return accumulator;
    accumulator[key] = rest.join(":").trim();
    return accumulator;
  }, {});

  if (Object.keys(structuredParts).length > 0) {
    return { ...emptyAddressParts, ...structuredParts };
  }

  const fallbackParts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    ...emptyAddressParts,
    city: fallbackParts[0] || "",
    state: fallbackParts[1] || "",
    country: fallbackParts[2] || "",
  };
}

export function formatLocationParts(parts: AddressParts) {
  return addressFieldOrder
    .map((key) => `${key}: ${parts[key].trim()}`)
    .filter((item) => !item.endsWith(":"))
    .join(" | ");
}

export function getLocationDisplayValue(location: string) {
  const parts = parseLocationParts(location);
  return [
    // parts.streetAddress,
    // parts.city,
    parts.district,
    parts.state,
    parts.country,
    // parts.postalCode ? `PIN ${parts.postalCode}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function AddressField({
  label,
  placeholder,
  value,
  optional = false,
  onChange,
  key
}: {
  label: string;
  placeholder: string;
  value: string;
  optional?: boolean;
  onChange: (value: string) => void;
  key?:string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#4c5880]">
        {label}
        {optional ? " (Optional)" : ""}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[#d8e2fb] bg-white px-4 text-sm font-semibold text-brand-primary outline-none transition placeholder:text-[#9aa7bf] focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10"
      />
    </label>
  );
}

function AddressSelectField({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: GeoNamesLocation[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#4c5880]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[#d8e2fb] bg-white px-4 text-sm font-semibold text-brand-primary outline-none transition focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">{placeholder}</option>
        {value && !options.some((option) => option.name === value) ? <option value={value}>{value}</option> : null}
        {options.map((option) => <option key={option.id || option.code} value={option.name}>{option.name}</option>)}
      </select>
    </label>
  );
}

export function AddressComposer({
  location,
  onChange,
  fields = addressFieldOrder,
}: {
  location: string;
  onChange: (value: string) => void;
  fields?: AddressFieldKey[];
}) {
  const parts = parseLocationParts(location);
  const [countries, setCountries] = useState<GeoNamesLocation[]>([]);
  const [states, setStates] = useState<GeoNamesLocation[]>([]);
  const [districts, setDistricts] = useState<GeoNamesLocation[]>([]);
  const [locationError, setLocationError] = useState("");
  const selectedCountry = countries.find((item) => item.name === parts.country);
  const selectedState = states.find((item) => item.name === parts.state);

  useEffect(() => {
    getGeoNamesLocations("countries")
      .then((data) => setCountries(data.locations))
      .catch((error) => setLocationError(error instanceof Error ? error.message : "Location choices are unavailable."));
  }, []);

  useEffect(() => {
    setStates([]);
    setDistricts([]);
    if (!selectedCountry?.code) return;
    getGeoNamesLocations("states", { country: selectedCountry.code })
      .then((data) => setStates(data.locations))
      .catch((error) => setLocationError(error instanceof Error ? error.message : "State choices are unavailable."));
  }, [selectedCountry?.code]);

  useEffect(() => {
    setDistricts([]);
    if (!selectedCountry?.code || !selectedState?.code) return;
    getGeoNamesLocations("districts", { country: selectedCountry.code, state: selectedState.code })
      .then((data) => setDistricts(data.locations))
      .catch((error) => setLocationError(error instanceof Error ? error.message : "District choices are unavailable."));
  }, [selectedCountry?.code, selectedState?.code]);

  const updatePart = (key: AddressFieldKey, value: string) => {
    const next = { ...parts, [key]: value };
    if (key === "country") {
      next.state = "";
      next.district = "";
    }
    if (key === "state") next.district = "";
    onChange(formatLocationParts(next));
  };

  return (
    <section className="block">
      <span className="mb-2 block text-xs font-semibold text-ink-strong">Location Details</span>
      <div className="rounded-2xl border border-[#d8e2fb] bg-[#f7f9ff] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <div className="mt-3 h-[228px] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.includes("country") ? <AddressSelectField label="Country" value={parts.country} options={countries} placeholder="Select country" onChange={(value) => updatePart("country", value)} /> : null}
            {fields.includes("state") ? <AddressSelectField label="State" value={parts.state} options={states} placeholder="Select state" disabled={!selectedCountry} onChange={(value) => updatePart("state", value)} /> : null}
            {fields.includes("district") ? <AddressSelectField label="District" value={parts.district} options={districts} placeholder="Select district" disabled={!selectedState} onChange={(value) => updatePart("district", value)} /> : null}
            {addressFieldMeta.filter((field) => fields.includes(field.key) && !["country", "state", "district"].includes(field.key)).map((field) => (
              <AddressField
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                optional={field.optional}
                value={parts[field.key]}
                onChange={(value) => updatePart(field.key, value)}
              />
            ))}
          </div>
          <FieldError message={locationError} />
        </div>
      </div>
    </section>
  );
}

function SocialCard({
  icon,
  title,
  isSelected,
  isConnecting,
  onConnect,
}: {
  key?: string;
  icon: ReactNode;
  title: string;
  isSelected?: boolean;
  isConnecting?: boolean;
  onConnect: () => void;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-[#e0e0e0] bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span>{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-ink-strong">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-[#707b91]">
          {isSelected ? "Selected for OAuth after setup." : "Connect with OAuth after setup is complete."}
        </p>
      </div>
      <button
        type="button"
        disabled={isConnecting}
        onClick={onConnect}
        className={`h-10 rounded-lg px-5 text-sm font-black text-white disabled:opacity-60 ${isSelected ? "bg-[#04b981]" : "bg-brand-primary"}`}
      >
        {isConnecting ? "Opening..." : isSelected ? "Selected" : "Connect"}
      </button>
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
      ? "border-[#796cff] bg-brand-accent-soft"
      : "border-[#dfe4ed] bg-white"
      }`}
    >
      <span className={`absolute left-3 top-3 grid h-4 w-4 place-items-center rounded-[3px] border ${active ? "border-brand-primary bg-brand-primary" : "border-[#cbd4df] bg-white"}`}>
        {active ? <Check className="h-3 w-3 text-white" /> : null}
      </span>
      <span className="mx-auto mt-5 grid h-8 place-items-center text-[#776bff]">{icon}</span>
      <strong className="mt-3 block text-sm font-black text-ink-strong">{title}</strong>
      <span className="mt-2 block text-[11px] font-medium leading-snug text-[#707b91]">{copy}</span>
    </button>
  );
}


function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-2 text-xs font-semibold text-[#d92d20]">{message}</p>;
}

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
    <div className="flex items-start gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8e0ff] text-[#4b22f4]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-1 break-words text-base font-black text-ink-strong">{value || "Not provided"}</p>
      </div>
    </div>
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

  if (platform === "FACEBOOK") {
    return <span className={`${iconWrapperClass} bg-[#1877f2]`}><Globe className={iconClass} /></span>;
  }

  return <span className={`${iconWrapperClass} bg-black`}><X className={iconClass} /></span>;
}


type StepContentProps = {
  step: number;
  form: CreatorRegisterForm;
  fieldErrors: Partial<Record<string, string>>;
  showPassword: boolean;
  phoneOtp: string;
  socialAccounts: SocialAccountForm[];
  verification: VerificationState;
  selectedSocialPlatform: SocialAccountForm["platform"] | "";
  connectingPlatform: string;
  onFieldChange: (field: keyof CreatorRegisterForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onLocationChange: (value: string) => void;
  onEmailOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhoneOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onConnectSocial: (platform: SocialAccountForm["platform"]) => void;
  onToggleFormArrayValue: (field: "languages" | "collaboration_preferences", value: string) => void;
  onTogglePassword: () => void;
  onTermsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onVerifyEmailOtp: () => void;
  onVerifyPhoneOtp: () => void;
};

export const StepsCreatorRegister=({
  step,
  form,
  fieldErrors,
  showPassword,
  phoneOtp,
  socialAccounts,
  verification,
  selectedSocialPlatform,
  connectingPlatform,
  onFieldChange,
  onLocationChange,
  onEmailOtpChange,
  onPhoneOtpChange,
  onConnectSocial,
  onToggleFormArrayValue,
  onTogglePassword,
  onTermsChange,
  onVerifyEmailOtp,
  onVerifyPhoneOtp,
}: StepContentProps)=>{
    if (step === 1) {
    return (
      <>
        <RegisterStepHeader title="Create your account" copy="Let's get started with a few details." />
        <div className="mt-8 grid gap-4">
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Full Name" icon={<User className="h-5 w-5" />} value={form.name} onChange={onFieldChange("name")} placeholder="Collune User" required><FieldError message={fieldErrors.name} /></HtmlInput>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Email Address" icon={<Mail className="h-5 w-5" />} value={form.email} onChange={onFieldChange("email")} placeholder="colluneuser@gmail.com" type="email" required><FieldError message={fieldErrors.email} /></HtmlInput>
          <HtmlInput labelClass={labelClass} inputClass={inputClass} label="WhatsApp Number" icon={<Phone className="h-5 w-5" />} value={form.phone_no} onChange={onFieldChange("phone_no")} placeholder="99999XXXXX" pattern="[0-9]{10}" type="tel" required maxLength={10} minLength={10}><FieldError message={fieldErrors.phone_no} /></HtmlInput>
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
              <button type="button" onClick={onTogglePassword} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-brand-accent-soft" aria-label={showPassword ? "Hide password" : "Show password"}>
                {!showPassword ? <EyeClosed className="h-5 w-5" /> :<Eye className="h-5 w-5" />}
              </button>
            }
            required
          >
            <FieldError message={fieldErrors.password} />
          </HtmlInput>
        </div>
        <label className="mt-6 flex items-center gap-3 text-sm font-medium text-ink-muted">
          <input type="checkbox" checked={form.acceptedTerms} onChange={onTermsChange} className="h-4 w-4 rounded border-[#9aa7ba]" required />
          I agree to the <Link className="text-[#6f80ff]" to="/creative-services-terms">Terms of Service</Link> & <Link className="text-[#6f80ff]" to="/privacy-policy">Privacy Policy</Link>
        </label>
        <FieldError message={fieldErrors.acceptedTerms} />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <RegisterStepHeader title="Verify your contact" copy="Enter the verification codes sent to your email and whatsapp." />
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
          <FieldError message={fieldErrors.emailOtp} />
          <VerificationBlock
            icon={<Phone className="h-5 w-5" />}
            title="Verify Whatsapp"
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
        <RegisterStepHeader title="Connect your social accounts" copy="Choose a platform to create your account and continue with OAuth." />
        <div className="mx-auto mt-9 grid max-w-[430px] gap-3.5">
          {socialAccounts.map((account) => (
            <SocialCard
              key={account.platform}
              title={account.title}
              isSelected={selectedSocialPlatform === account.platform}
              isConnecting={connectingPlatform === account.platform}
              onConnect={() => onConnectSocial(account.platform)}
              icon={getSocialIcon(account.platform)}
            />
          ))}
        </div>
        <FieldError message={fieldErrors.selectedSocialPlatform} />
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <RegisterStepHeader title="Tell us about yourself" copy="Help brands understand your audience and content." />
        <div className="mt-8 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink-strong">Creator Category</span>
            <span className="relative block">
              <Grid2X2 className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#707b91]" />
              <select value={form.category} onChange={onFieldChange("category")} className="h-12 w-full appearance-none rounded-xl border border-[#e0e0e0] bg-white px-10 text-sm font-medium text-ink-strong outline-none">
                {categoryOptions.map((category) => <option key={category} value={category}>{category || "Select creator category"}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#707b91]" />
            </span>
          </label>
          <FieldError message={fieldErrors.category} />
          <AddressComposer location={form.location} onChange={onLocationChange} />
          <FieldError message={fieldErrors.location} />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink-strong">Gender</span>
            <span className="relative block">
              <User className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#707b91]" />
              <select value={form.gender} onChange={onFieldChange("gender")} className="h-12 w-full appearance-none rounded-xl border border-[#e0e0e0] bg-white px-10 text-sm font-medium text-ink-strong outline-none">
                {genderOptions.map((gender) => <option key={gender} value={gender}>{gender || "Select gender"}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#707b91]" />
            </span>
          </label>
          <FieldError message={fieldErrors.gender} />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink-strong">Short Bio</span>
            <textarea
              className="h-36 w-full resize-none rounded-xl border border-[#e0e0e0] bg-white p-4 text-sm font-medium leading-relaxed text-ink-strong outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
              value={form.bio}
              onChange={onFieldChange("bio")}
              maxLength={200}
              placeholder="Political commentator helping young audiences understand policy and governance."
            />
            <span className="-mt-7 mr-4 block text-right text-xs font-medium text-[#9aa7bf]">{form.bio.length} / 200</span>
            <FieldError message={fieldErrors.bio} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-ink-strong">About</span>
            <textarea
              className="h-32 w-full resize-none rounded-xl border border-[#e0e0e0] bg-white p-4 text-sm font-medium leading-relaxed text-ink-strong outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
              value={form.about}
              onChange={onFieldChange("about")}
              maxLength={400}
              placeholder="Share more about your content style, audience, and creator journey."
            />
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
          <span className="mb-3 mt-5 block text-xs font-semibold text-ink-strong">Content language</span>
          <FieldError message={fieldErrors.collaboration_preferences} />
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
          <FieldError message={fieldErrors.languages} />
        </div>
      </>
    );
  }

  return (
    <>
      <RegisterStepHeader centered title="Review your profile" copy="Confirm your key details before creating your creator account." />
      <div className="mt-8 rounded-xl border border-[#dfe4ed] p-7">
        <div className="grid gap-7">
          <ReviewRow icon={<User className="h-5 w-5" />} label="Full Name" value={form.name} />
          <ReviewRow icon={<Mail className="h-5 w-5" />} label="Email" value={form.email} />
          <ReviewRow icon={<Phone className="h-5 w-5" />} label="WhatsApp Number" value={form.phone_no} />
          <ReviewRow icon={<Grid2X2 className="h-5 w-5" />} label="Creator Category" value={form.category} />
          <ReviewRow icon={<MapPin className="h-5 w-5" />} label="Location" value={getLocationDisplayValue(form.location)} />
          <ReviewRow icon={<Globe className="h-5 w-5" />} label="Content Languages" value={form.languages.join(", ")} />
          <ReviewRow icon={<Megaphone className="h-5 w-5" />} label="Collaboration Preferences" value={form.collaboration_preferences.join(", ")} />
          <ReviewRow icon={<Instagram className="h-5 w-5" />} label="Selected Social Platform" value={selectedSocialPlatform || "Not selected"} />
          <ReviewRow icon={<User className="h-5 w-5" />} label="Short Bio" value={form.bio} />
        </div>
      </div>
    </>
  );
}
