import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeClosed, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/Logo.svg";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { RegisterError } from "../HtmlComponents/RegisterFormParts";
import { showProjectToast } from "../HtmlComponents/HtmlRoster";
import { confirmPasswordReset, requestPasswordReset } from "../lib/authApi";
import { inputClass, labelClass } from "./StepsCreatorRegister";

type Step = "request" | "confirm";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);
      setStep("confirm");
      setMessage(response.message);
      showProjectToast("success", "Reset code sent", response.message);
    } catch (err) {
      const nextError = err instanceof Error ? err.message : "Unable to send reset code.";
      setError(nextError);
      showProjectToast("error", "Request failed", nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.trim().length < 8) {
      const nextError = "Password must be at least 8 characters.";
      setError(nextError);
      return;
    }
    if (newPassword !== confirmPassword) {
      const nextError = "Passwords do not match.";
      setError(nextError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await confirmPasswordReset(email, code, newPassword);
      setMessage(response.message);
      showProjectToast("success", "Password reset", "Your password has been updated. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      const nextError = err instanceof Error ? err.message : "Unable to reset password.";
      setError(nextError);
      showProjectToast("error", "Reset failed", nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-4 text-[#202337] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(35,54,120,0.08)] md:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex flex-col overflow-hidden bg-[#f0edff] px-6 py-7 sm:px-8 sm:py-8 md:min-h-[320px] md:px-10 md:py-10 lg:justify-between lg:px-12 lg:py-11">
          <Link to="/" aria-label="Collune home" className="inline-flex w-max">
            <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
          </Link>

          <div className="relative z-10 mt-8 md:mt-10 lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black text-[#2447bd] shadow-sm sm:text-xs">
              <ShieldCheck className="h-4 w-4" />
              Secure account recovery
            </div>
            <h1 className="mt-6 max-w-[16ch] text-[28px] font-black leading-tight tracking-normal text-[#202337] sm:text-[34px] md:text-[40px] lg:mt-8 lg:max-w-md lg:text-[44px]">
              Reset your password and get back in quickly
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm font-medium leading-relaxed text-[#65758f] sm:text-[15px] md:text-base lg:mt-5 lg:max-w-md">
              Enter your account email to receive a one-time reset code, then choose a new secure password.
            </p>
          </div>

          <div className="relative mt-8 hidden h-[220px] md:block lg:mt-0 lg:h-[250px]">
            <div className="absolute left-0 top-4 w-52 rounded-2xl bg-white p-5 shadow-xl lg:left-8 lg:top-6 lg:w-56">
              <KeyRound className="h-9 w-9 text-[#7463e9]" />
              <div className="mt-6 h-2 rounded-full bg-[#dfe4ed]" />
              <div className="mt-3 h-2 w-28 rounded-full bg-[#dfe4ed]" />
              <div className="mt-3 h-2 w-20 rounded-full bg-[#dfe4ed]" />
            </div>
            <div className="absolute bottom-2 right-0 w-48 rounded-2xl bg-[#2447bd] p-5 text-white shadow-xl lg:bottom-7 lg:right-6 lg:w-56">
              <p className="text-sm font-black">Fast recovery flow</p>
              <div className="mt-4 grid gap-2">
                <span className="h-10 rounded-lg bg-white/20" />
                <span className="h-10 rounded-lg bg-white/20" />
                <span className="h-10 rounded-lg bg-white/20" />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
          <div className="w-full max-w-[460px]">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5870aa] transition hover:text-[#2447bd]">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mt-6">
              <h2 className="text-[28px] font-black tracking-normal text-[#202337] sm:text-[30px] md:text-[32px]">
                {step === "request" ? "Forgot your password?" : "Create a new password"}
              </h2>
              <p className="mt-3 text-sm font-medium text-[#707b91] sm:text-[15px]">
                {step === "request"
                  ? "We’ll send a 6-digit reset code to your email."
                  : "Enter the code from your email and choose a new password."}
              </p>
            </div>

            {message ? <div className="mt-6 rounded-2xl border border-[#d8e3ff] bg-[#f5f8ff] px-4 py-3 text-sm font-medium text-[#3556b8]">{message}</div> : null}
            <RegisterError message={error} className="mt-6" />

            {step === "request" ? (
              <form className="mt-7 grid gap-5" onSubmit={handleRequest}>
                <HtmlInput
                  labelClass={labelClass}
                  inputClass={inputClass}
                  label="Email Address"
                  icon={<Mail className="h-5 w-5" />}
                  value={email}
                  onChange={(event) => {
                    setError("");
                    setMessage("");
                    setEmail(event.target.value);
                  }}
                  placeholder="you@company.com"
                  type="email"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2447bd] px-5 text-sm font-black text-white transition hover:bg-[#1d3ca3] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Sparkles className="h-4 w-4" />
                  {isSubmitting ? "Sending code..." : "Send reset code"}
                </button>
              </form>
            ) : (
              <form className="mt-7 grid gap-5" onSubmit={handleConfirm}>
                <HtmlInput
                  labelClass={labelClass}
                  inputClass={inputClass}
                  label="Email Address"
                  icon={<Mail className="h-5 w-5" />}
                  value={email}
                  onChange={(event) => {
                    setError("");
                    setEmail(event.target.value);
                  }}
                  placeholder="you@company.com"
                  type="email"
                  required
                />
                <HtmlInput
                  labelClass={labelClass}
                  inputClass={inputClass}
                  label="Reset Code"
                  icon={<KeyRound className="h-5 w-5" />}
                  value={code}
                  onChange={(event) => {
                    setError("");
                    setCode(event.target.value);
                  }}
                  placeholder="Enter 6-digit code"
                  required
                />
                <HtmlInput
                  labelClass={labelClass}
                  inputClass={inputClass}
                  label="New Password"
                  icon={<Lock className="h-5 w-5" />}
                  value={newPassword}
                  onChange={(event) => {
                    setError("");
                    setNewPassword(event.target.value);
                  }}
                  placeholder="Enter new password"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  trailing={<button type="button" onClick={() => setShowPassword((current) => !current)} className="text-[#8b97aa]">{showPassword ? <EyeClosed className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}
                  required
                />
                <HtmlInput
                  labelClass={labelClass}
                  inputClass={inputClass}
                  label="Confirm Password"
                  icon={<Lock className="h-5 w-5" />}
                  value={confirmPassword}
                  onChange={(event) => {
                    setError("");
                    setConfirmPassword(event.target.value);
                  }}
                  placeholder="Confirm new password"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={8}
                  trailing={<button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="text-[#8b97aa]">{showConfirmPassword ? <EyeClosed className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setError("");
                      setMessage("");
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d7dfef] bg-white px-5 text-sm font-black text-[#4e5d79] transition hover:bg-[#f7f9fd]"
                  >
                    Send another code
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[#2447bd] px-5 text-sm font-black text-white transition hover:bg-[#1d3ca3] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Updating..." : "Reset password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
