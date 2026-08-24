import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeClosed, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

import logo from "../assets/Logo.svg";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { RegisterError } from "../HtmlComponents/RegisterFormParts";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../contexts/authStorage";
import { inputClass, labelClass } from "./StepsCreatorRegister";
import { showProjectToast } from "../HtmlComponents/HtmlRoster";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, setSessionUser } = useAuth();
  const [email, setEmail] = useState(() => authStorage.getRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedPassword = password.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (trimmedPassword.length < 8) {
      const message = "Password must be at least 8 characters.";
      showProjectToast("error", "Login failed", message);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);

      if (user.role !== "Brand" && user.role !== "Creator") {
        setSessionUser(null);
        authStorage.setRememberedEmail(user.email || email.trim());
        showProjectToast("error", "Login blocked", "Admin users cannot log in from the client frontend.");
        return;
      }

      authStorage.setRememberedEmail(user.email || email.trim());
      showProjectToast("success", "Login successful", `Welcome back${user.name ? `, ${user.name}` : ""}.`);
      navigate("/");
    } catch (error) {
      const message = "Something went wrong. Please check your credentials and try again.";
      showProjectToast("error", "Login failed", message);
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
              Secure Collune workspace
            </div>
            <h1 className="mt-6 max-w-[18ch] text-[28px] font-black leading-tight tracking-normal text-[#202337] sm:text-[34px] md:max-w-[14ch] md:text-[40px] lg:mt-8 lg:max-w-md lg:text-[44px]">
              Sign in to manage creator partnerships
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm font-medium leading-relaxed text-[#65758f] sm:text-[15px] md:max-w-[32rem] md:text-base lg:mt-5 lg:max-w-md">
              Access your brand dashboard or creator workspace with your registered email and password.
            </p>
          </div>

          <div className="relative mt-8 hidden h-[190px] md:block lg:mt-0 lg:h-[250px]">
            <div className="absolute left-0 top-4 h-32 w-48 rounded-2xl bg-white p-5 shadow-xl md:left-2 md:w-52 lg:left-8 lg:top-6 lg:h-36 lg:w-56">
              <Sparkles className="h-8 w-8 text-[#7463e9] lg:h-9 lg:w-9" />
              <div className="mt-6 h-2 rounded-full bg-[#dfe4ed] lg:mt-7" />
              <div className="mt-3 h-2 w-24 rounded-full bg-[#dfe4ed] lg:w-28" />
            </div>
            <div className="absolute bottom-2 right-0 w-48 rounded-2xl bg-[#2447bd] p-4 text-white shadow-xl md:right-2 md:w-52 lg:bottom-7 lg:right-6 lg:w-56 lg:p-5">
              <p className="text-sm font-black">Campaigns, shortlists, profiles</p>
              <div className="mt-4 grid grid-cols-3 gap-2 lg:mt-5">
                {[0, 1, 2].map((item) => <span key={item} className="h-10 rounded-lg bg-white/20 lg:h-12" />)}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
          <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-[28px] font-black tracking-normal text-[#202337] sm:text-[30px] md:text-[32px]">Welcome back</h2>
              <p className="mt-3 text-sm font-medium text-[#707b91] sm:text-[15px]">Login with your email and password.</p>
            </div>

            <div className="mt-7 grid gap-4 sm:mt-8 sm:gap-5 md:mt-9">
              <HtmlInput
                labelClass={labelClass}
                inputClass={inputClass}
                label="Email Address"
                icon={<Mail className="h-5 w-5" />}
                value={email}
                onChange={(event) => {
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
                  setPassword(event.target.value);
                }}
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                trailing={
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid h-8 w-8 place-items-center rounded-md text-[#71809a] hover:bg-[#eef3ff]" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeClosed className="h-5 w-5" />}
                  </button>
                }
                required
              />
              <p>
                <Link to="/forgot-password" className="font-normal text-[#2447bd]">Forgot Password?</Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <div className="mt-6 grid gap-2 text-center text-sm font-medium text-[#65758f] sm:mt-7">
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
