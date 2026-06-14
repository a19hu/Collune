import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  LogIn,
  Key,
  UserCircle2,
  Info,
  Mail,
  MapPin,
  ShieldCheck,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type PublicSchoolLookupResponse } from '../lib/authApi';
import HtmlInput from '../HtmlComponents/HtmlInput';

type SchoolLoginPageProps = {
  schoolDomain: string;
  schoolInfo: PublicSchoolLookupResponse;
};


export const LoginPage = ({ schoolDomain, schoolInfo }: SchoolLoginPageProps) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState(() => localStorage.getItem('saaserp_last_login_username') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const schoolAddress = schoolInfo?.address;
  const schoolLocation = schoolAddress
    ? [schoolAddress.city, schoolAddress.state, schoolAddress.country].filter(Boolean).join(', ')
    : '';
  const schoolLogoUrl = schoolInfo?.school.logo_url || '';

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!username || !password) {
      setAuthError('Please enter username and password.');
      return;
    }

    try {
      const mapped = await login(username, password, schoolDomain);
      window.alert(`Welcome back, ${mapped.name}! Opening ${mapped.role} dashboard.`);
      switch (mapped.role) {
        case 'SchoolAdmin':
          navigate('/admin');
          break;
        case 'Teacher':
          navigate('/teacher');
          break;
        case 'Student':
          navigate('/student');
          break;
        default:
          navigate('/admin');
      }
    } catch (error: any) {
      setAuthError(error.message || 'Invalid username or password.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9e6] via-[#f5f7ff] to-[#e8eeff] font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
      <div className="bg-gradient-to-r from-[#001133] via-[#003399] to-[#001133] border-b-2 border-[#ffbb00] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs md:text-sm">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#ffd700]" />
            Verified School Mate ERP Workspace
          </span>
          {schoolInfo?.school.email && (
            <a href={`mailto:${schoolInfo.school.email}`} className="flex items-center gap-2 font-bold text-[#ffd700]">
              <Mail className="h-4 w-4" />
              {schoolInfo.school.email}
            </a>
          )}
        </div>
      </div>

      <header className="border-b-4 border-[#ffbb00] bg-gradient-to-br from-[#001133] via-[#003399] to-[#001133] shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-white/20 bg-gradient-to-br from-[#ffbb00] via-[#ff8c00] to-[#ff6600] text-xl font-black text-white shadow-lg shadow-orange-500/30">
              SM
            </div>
            <div>
              <div className="text-2xl font-black tracking-wide text-white">SCHOOL MATE</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ffd700]">Secure ERP Login</div>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-right text-[#ffd700] sm:flex">
            <Phone className="h-5 w-5" />
            <div>
              <div className="text-xs text-white/70">Support</div>
              <div className="font-black">+91 99318 XXXXX</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#000d26] via-[#003399] to-[#000d26] px-4 py-8 text-white md:py-12">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(255,255,255,0.04)_40px,rgba(255,255,255,0.04)_80px)]" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <div className="grid w-full grid-cols-1 items-stretch overflow-hidden rounded-lg border-2 border-white/15 bg-[#001133]/80 shadow-2xl shadow-black/40 backdrop-blur lg:grid-cols-12">
            <section className="relative flex flex-col justify-between overflow-hidden border-b-4 border-[#ffbb00] bg-gradient-to-br from-[#001133] via-[#003399] to-[#001133] p-6 text-left md:p-8 lg:col-span-5 lg:border-b-0 lg:border-r-4">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,187,0,0.16),transparent_35%,rgba(255,102,0,0.14)_70%,transparent)]" />
              <div className="relative space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd700]/70 bg-gradient-to-r from-[#ff6600] to-[#ff8c00] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified School Workspace
                </div>

                <div className="space-y-5">
                  {schoolLogoUrl && !logoLoadFailed ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={schoolLogoUrl}
                      alt={schoolInfo?.school.school_name}
                      onError={() => setLogoLoadFailed(true)}
                      className="h-24 w-24 rounded-lg border-2 border-[#ffd700] bg-white object-contain p-2 shadow-xl shadow-black/30"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-[#ffd700] bg-white/10 text-[#ffd700] shadow-xl shadow-black/30">
                      <Building2 className="h-11 w-11" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h1 className="text-3xl font-black leading-tight tracking-normal text-white md:text-4xl">
                      {schoolInfo?.school.school_name}
                    </h1>
                    {schoolLocation && (
                      <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-200">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd700]" />
                        <span>{schoolLocation}</span>
                      </p>
                    )}
                    {schoolAddress?.full_address && (
                      <p className="max-w-md text-xs font-medium leading-5 text-slate-300">
                        {schoolAddress.full_address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs font-semibold text-slate-100">
                  {schoolInfo?.school.email && (
                    <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur">
                      <Mail className="h-4 w-4 shrink-0 text-[#ffd700]" />
                      <span className="truncate">{schoolInfo?.school.email}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#ffd700]/30 bg-[#ffd700]/10 p-3">
                      <GraduationCap className="mb-2 h-5 w-5 text-[#ffd700]" />
                      <div className="font-black text-[#ffd700]">ERP Ready</div>
                      <div className="mt-1 text-[10px] text-slate-300">Role-based access</div>
                    </div>
                    <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                      <ShieldCheck className="mb-2 h-5 w-5 text-emerald-300" />
                      <div className="font-black text-emerald-300">Secure</div>
                      <div className="mt-1 text-[10px] text-slate-300">School domain login</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="relative mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffd700]">
                School Mate by SP Systems
              </p>
            </section>

            <section className="flex items-center justify-center bg-white p-5 text-slate-900 md:p-8 lg:col-span-7">
              <div className="w-full max-w-md space-y-6">
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-[#ff6600]">
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Institution Core</span>
                  </div>
                  <h2 className="text-3xl font-black leading-tight tracking-normal text-[#001133]">Sign In to Dashboard</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Use your school-issued username and password to continue.
                  </p>
                </div>

                {authError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-50 p-3.5 text-left text-xs font-semibold text-red-700">
                    {authError}
                  </div>
                )}

                <form id="erp-login-action-form" onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <HtmlInput
                    divClass='space-y-1'
                    labelClass="text-[11px] font-black uppercase tracking-wide text-[#001133]"
                    inputClass="w-full rounded-lg border-2 border-slate-200 bg-[#f8fbff] py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#003399] focus:ring-4 focus:ring-blue-100"
                    label='Username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type='text'
                    ID='login-phone-control'
                    placeholder="Enter username"
                    required
                  />
                  <HtmlInput
                    divClass='space-y-1'
                    labelClass="text-[11px] font-black uppercase tracking-wide text-[#001133]"
                    inputClass="w-full rounded-lg border-2 border-slate-200 bg-[#f8fbff] py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#003399] focus:ring-4 focus:ring-blue-100"
                    label='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type='password'
                    ID='login-otp-control'
                    placeholder="Enter password"
                    required
                  />
                  <button
                    id="login-submit-trigger"
                    type="submit"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-[#ffd700] bg-gradient-to-r from-[#ff6600] to-[#ffaa00] py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-[#ff7a1a] hover:to-[#ffbb00]"
                  >
                    <LogIn className="h-4 w-4" />
                    Login to ERP
                  </button>
                </form>

                <div className="flex gap-2 rounded-lg border-l-4 border-[#ff6600] bg-[#fff9e6] p-3 text-left">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6600]" />
                  <span className="text-[11px] leading-relaxed text-slate-700">
                    Use the auto-generated username from school registration with your chosen password.
                  </span>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

    </main>
  );
};
