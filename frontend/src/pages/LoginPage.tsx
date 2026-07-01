import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeClosed, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

import logo from "../assets/Logo.svg";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { RegisterError } from "../HtmlComponents/RegisterFormParts";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";

const inputClass =
  "h-[52px] w-full rounded-xl border border-[#d8e2fb] bg-white px-12 text-[15px] font-semibold text-[#173ca8] outline-none transition placeholder:text-[#9aa7bf] focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10";
const labelClass = "mb-2 block text-xs font-semibold text-[#6e7d99]";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(() => authStorage.getRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      authStorage.setRememberedEmail(user.email || email.trim());
      navigate(user.role === "Brand" ? "/brand" : user.role === "Creator" ? "/creator" : "/", { replace: true });
    } catch (error) {
      setAuthError("Something went wrong. Please check your credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] p-4 text-[#202337] md:p-10">
      <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1180px] overflow-hidden rounded-xl bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#f0edff] px-12 py-11 lg:flex">
          <Link to="/" aria-label="Collune home" className="inline-flex w-max">
            <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
          </Link>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#2447bd] shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Secure Collune workspace
            </div>
            <h1 className="mt-8 max-w-md text-[44px] font-black leading-tight tracking-normal text-[#202337]">
              Sign in to manage creator partnerships
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-[#65758f]">
              Access your brand dashboard or creator workspace with your registered email and password.
            </p>
          </div>

          <div className="relative h-[250px]">
            <div className="absolute left-8 top-6 h-36 w-56 rounded-2xl bg-white p-5 shadow-xl">
              <Sparkles className="h-9 w-9 text-[#7463e9]" />
              <div className="mt-7 h-2 rounded-full bg-[#dfe4ed]" />
              <div className="mt-3 h-2 w-28 rounded-full bg-[#dfe4ed]" />
            </div>
            <div className="absolute bottom-7 right-6 w-56 rounded-2xl bg-[#2447bd] p-5 text-white shadow-xl">
              <p className="text-sm font-black">Campaigns, shortlists, profiles</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((item) => <span key={item} className="h-12 rounded-lg bg-white/20" />)}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 md:px-12">
          <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
            <Link to="/" aria-label="Collune home" className="mb-10 inline-flex w-max lg:hidden">
              <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
            </Link>

            <div>
              <h2 className="text-[32px] font-black tracking-normal text-[#202337]">Welcome back</h2>
              <p className="mt-3 text-[15px] font-medium text-[#707b91]">Login with your email and password.</p>
            </div>

            <div className="mt-9 grid gap-5">
              <HtmlInput
                labelClass={labelClass}
                inputClass={inputClass}
                label="Email Address"
                icon={<Mail className="h-5 w-5" />}
                value={email}
                onChange={(event) => {
                  setAuthError("");
                  setEmail(event.target.value);
                }}
                placeholder="you@company.com"
                type="email"
                required
              />
              <HtmlInput
                labelClass={labelClass}
                inputClass={inputClass}
                label="Password"
                icon={<Lock className="h-5 w-5" />}
                value={password}
                onChange={(event) => {
                  setAuthError("");
                  setPassword(event.target.value);
                }}
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                trailing={
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-[#eef3ff]" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
                  </button>
                }
                required
              />
            </div>

            <RegisterError message={authError} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <div className="mt-7 grid gap-2 text-center text-sm font-medium text-[#65758f]">
              <p>
                New creator? <Link to="/creator-register" className="font-black text-[#2447bd]">Apply as Creator</Link>
              </p>
              <p>
                New brand? <Link to="/brand-register" className="font-black text-[#2447bd]">Create Brand Account</Link>
              </p>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
};

export default LoginPage;
