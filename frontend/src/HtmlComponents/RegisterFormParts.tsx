import type { ChangeEvent, ReactNode } from "react";
import { ArrowRight, CheckCircle, Plus, X } from "lucide-react";

export function RegisterStepHeader({
  title,
  copy,
  centered = false,
  titleClassName = "text-[28px] font-black tracking-normal text-[#202337]",
  copyClassName = "mt-3 text-[15px] font-medium text-[#707b91]",
}: {
  title: string;
  copy: string;
  centered?: boolean;
  titleClassName?: string;
  copyClassName?: string;
}) {
  return (
    <div className={centered ? "text-center" : undefined}>
      <h1 className={titleClassName}>{title}</h1>
      <p className={copyClassName}>{copy}</p>
    </div>
  );
}

export function RegisterError({ message, className = "mt-5" }: { message?: string; className?: string }) {
  if (!message) return null;

  return (
    <div className={`${className} rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700`}>
      {message}
    </div>
  );
}

export function RegisterSubmitButtons({
  isFinalStep,
  isSubmitting,
  disabled = false,
  onSkip,
  submitLabel = "Continue",
  finalLabel = "Continue to Dashboard",
  submittingLabel = "Creating account...",
  skipLabel = "Skip for now",
  className = "mt-6",
  buttonClassName = "inline-flex h-[52px] flex-1 items-center justify-center gap-3 rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8] disabled:cursor-not-allowed disabled:opacity-70",
}: {
  isFinalStep: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
  onSkip?: () => void;
  submitLabel?: string;
  finalLabel?: string;
  submittingLabel?: string;
  skipLabel?: string;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={`${className} ${isFinalStep && onSkip ? "grid gap-3" : "flex"}`}>
      <button type="submit" disabled={isSubmitting || disabled} className={buttonClassName}>
        {isFinalStep && isSubmitting ? submittingLabel : isFinalStep ? finalLabel : submitLabel}
        <ArrowRight className="h-5 w-5" />
      </button>

      {isFinalStep && onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="w-full text-center text-sm font-black text-[#64738e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AuthSwitchLink({
  show,
  copy = "Already have an account?",
  label = "Log in",
  href = "/login",
  className = "mt-8 text-center text-xs font-medium text-[#738098]",
  linkClassName = "font-black text-[#1438a8]",
}: {
  show: boolean;
  copy?: string;
  label?: string;
  href?: string;
  className?: string;
  linkClassName?: string;
}) {
  if (!show) return null;

  return (
    <p className={className}>
      {copy} <a className={linkClassName} href={href}>{label}</a>
    </p>
  );
}

export function SelectablePill({
  active,
  children,
  onClick,
  showIcon = false,
}: {
  key?: string;
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  showIcon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium ${active ? "bg-[#eee9ff] text-[#584cff]" : "border border-dashed border-[#c8ced9] text-[#4c566b]"}`}
    >
      {children}
      {showIcon ? active ? <X className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" /> : null}
    </button>
  );
}

export function OtpBoxes({
  code,
  onChange,
}: {
  code?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      value={code}
      onChange={onChange}
      inputMode="numeric"
      maxLength={6}
      placeholder="000000"
      className="h-14 w-full max-w-[220px] rounded-xl border border-[#dfe4ed] bg-white text-center text-xl font-black tracking-[0.35em] text-[#202337] outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
    />
  );
}

export function VerificationBlock({
  icon,
  title,
  target,
  otp,
  otpSent,
  verified,
  isVerifying,
  onOtpChange,
  onVerify,
}: {
  icon: ReactNode;
  title: string;
  target: string;
  otp: string;
  otpSent: boolean;
  verified: boolean;
  isVerifying: boolean;
  onOtpChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onVerify: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#dce7ff] text-[#2345b9]">
          {icon}
        </span>
        <div>
          <h2 className="font-black text-[#202337]">{title}</h2>
          <p className="text-sm font-medium text-[#707b91]">{target}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <OtpBoxes code={otp} onChange={onOtpChange} />

        {verified ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#04b981]">
            <CheckCircle className="h-6 w-6" />
            Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={onVerify}
            disabled={!otpSent || isVerifying}
            className="h-11 rounded-lg border border-[#2447bd] px-5 text-sm font-black text-[#2447bd] disabled:opacity-60"
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>
        )}
      </div>
    </div>
  );
}
