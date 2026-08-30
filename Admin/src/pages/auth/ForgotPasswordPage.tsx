import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';

import { confirmPasswordReset, requestPasswordReset } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
// @ts-ignore - SVG module type declaration not found, but import works via bundler asset handling
import logo from '../../assests/Logo.svg';

type Step = 'request' | 'confirm';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);
      setStep('confirm');
      setMessage(response.message);
      success('Reset code sent', response.message);
    } catch (err: any) {
      const nextError = err?.message || 'Unable to send reset code.';
      setFormError(nextError);
      showError('Request failed', nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setMessage('');

    if (newPassword.trim().length < 8) {
      const nextError = 'Password must be at least 8 characters.';
      setFormError(nextError);
      return;
    }

    if (newPassword !== confirmPassword) {
      const nextError = 'Passwords do not match.';
      setFormError(nextError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await confirmPasswordReset(email, code, newPassword);
      setMessage(response.message);
      success('Password reset', 'Your password has been updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      const nextError = err?.message || 'Unable to reset password.';
      setFormError(nextError);
      showError('Reset failed', nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(35,54,120,0.08)] md:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex flex-col overflow-hidden bg-[#0F172A] px-6 py-7 sm:px-8 sm:py-8 md:min-h-[320px] md:px-10 md:py-10 lg:justify-between lg:px-12 lg:py-11">
          <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />

          <div className="relative z-10 mt-8 md:mt-10 lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black text-indigo-300 sm:text-xs">
              <ShieldCheck className="h-4 w-4" />
              Secure account recovery
            </div>
            <h1 className="mt-6 max-w-[16ch] text-[28px] font-black leading-tight tracking-normal text-white sm:text-[34px] md:text-[40px] lg:mt-8 lg:max-w-md lg:text-[44px]">
              Reset your staff password and get back in quickly
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm font-medium leading-relaxed text-slate-400 sm:text-[15px] md:text-base lg:mt-5 lg:max-w-md">
              Enter your staff account email to receive a one-time reset code, then choose a new secure password.
            </p>
          </div>

          <div className="relative mt-8 hidden h-[220px] md:block lg:mt-0 lg:h-[250px]">
            <div className="absolute left-0 top-4 w-52 rounded-2xl bg-white/10 p-5 text-white shadow-xl lg:left-8 lg:top-6 lg:w-56">
              <KeyRound className="h-9 w-9 text-indigo-300" />
              <div className="mt-6 h-2 rounded-full bg-white/20" />
              <div className="mt-3 h-2 w-28 rounded-full bg-white/20" />
              <div className="mt-3 h-2 w-20 rounded-full bg-white/20" />
            </div>
            <div className="absolute bottom-2 right-0 w-48 rounded-2xl bg-indigo-600 p-5 text-white shadow-xl lg:bottom-7 lg:right-6 lg:w-56">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-200" />
                <p className="text-sm font-black">Fast recovery flow</p>
              </div>
              <div className="mt-4 grid gap-2">
                <span className="h-10 rounded-lg bg-white/20" />
                <span className="h-10 rounded-lg bg-white/20" />
                <span className="h-10 rounded-lg bg-white/20" />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
          <div className="w-full max-w-[420px]">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mt-6">
              <h2 className="text-[26px] font-black tracking-normal text-slate-900 sm:text-[28px]">Forgot password</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {step === 'request'
                  ? 'We will send a 6-digit reset code to your staff email.'
                  : 'Enter the reset code and choose a new password.'}
              </p>
            </div>

            {message ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                {message}
              </p>
            ) : null}

            {formError ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">
                {formError}
              </p>
            ) : null}

            {step === 'request' ? (
              <form className="mt-7 grid gap-4" onSubmit={handleRequest}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setFormError('');
                        setEmail(e.target.value);
                      }}
                      placeholder="you@collune.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,70,229,0.25)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending code...' : 'Send reset code'}
                </button>
              </form>
            ) : (
              <form className="mt-7 grid gap-4" onSubmit={handleConfirm}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setFormError('');
                        setEmail(e.target.value);
                      }}
                      placeholder="you@collune.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Reset Code</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={code}
                      onChange={(e) => {
                        setFormError('');
                        setCode(e.target.value);
                      }}
                      placeholder="Enter 6-digit code"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">New Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setFormError('');
                        setNewPassword(e.target.value);
                      }}
                      placeholder="Enter new password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setFormError('');
                        setConfirmPassword(e.target.value);
                      }}
                      placeholder="Confirm new password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setFormError('');
                      setMessage('');
                      setCode('');
                    }}
                    className="inline-flex h-[50px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Send another code
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[50px] items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,70,229,0.25)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Updating...' : 'Reset password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
