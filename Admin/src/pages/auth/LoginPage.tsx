import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
// @ts-ignore - SVG module type declaration not found, but import works via bundler asset handling
import logo from '../../assests/Logo.svg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState('admin@collune.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      success('Login successful', `Welcome back${user.name ? `, ${user.name}` : ''}.`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const message = err?.message || 'Invalid email or password.';
      setAuthError(message);
      showError('Login failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="relative mx-auto grid min-h-[calc(100vh-32px)] max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(35,54,120,0.08)] md:min-h-[calc(100vh-48px)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[0.9fr_1.1fr]">
        {/* Brand Panel */}
        <aside className="relative flex flex-col overflow-hidden bg-[#0F172A] px-6 py-7 sm:px-8 sm:py-8 md:min-h-[320px] md:px-10 md:py-10 lg:justify-between lg:px-12 lg:py-11">
          <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />

          <div className="relative z-10 mt-8 md:mt-10 lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black text-indigo-300 sm:text-xs">
              <ShieldCheck className="h-4 w-4" />
              Secure Admin Portal
            </div>
            <h1 className="mt-6 max-w-[18ch] text-[28px] font-black leading-tight tracking-normal text-white sm:text-[34px] md:max-w-[14ch] md:text-[40px] lg:mt-8 lg:max-w-md lg:text-[44px]">
              Sign in to manage the Collune platform
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm font-medium leading-relaxed text-slate-400 sm:text-[15px] md:max-w-[32rem] md:text-base lg:mt-5 lg:max-w-md">
              Access users, creators, brands, campaigns, shortlists, and platform settings with your staff account.
            </p>
          </div>

          <div className="relative mt-8 hidden h-[130px] md:block lg:mt-0">
            <div className="absolute bottom-0 left-0 w-56 rounded-2xl bg-white/10 p-4 text-white shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-300" />
                <p className="text-sm font-black">Role-based access control</p>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">
                Every module is gated behind your assigned staff role and permissions.
              </p>
            </div>
          </div>
        </aside>

        {/* Form Panel */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
          <form className="w-full max-w-[420px]" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-[26px] font-black tracking-normal text-slate-900 sm:text-[28px]">Staff Login</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Sign in with your Collune staff credentials.</p>
            </div>

            <div className="mt-7 grid gap-4 sm:mt-8">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setAuthError('');
                      setEmail(e.target.value);
                    }}
                    placeholder="you@collune.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setAuthError('');
                      setPassword(e.target.value);
                    }}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            {authError ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">
                {authError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,70,229,0.25)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
              <p className="font-bold text-slate-600">Demo credentials</p>
              <p className="mt-1">Any staff email below works, password is <span className="font-mono font-semibold text-slate-700">Collune@123</span></p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">admin@collune.com · siddharth.admin@collune.com · pooja.ops@collune.com</p>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
};

export default LoginPage;
