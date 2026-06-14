import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  CloudUpload,
  Eye,
  Grid2X2,
  Globe,
  Image as ImageIcon,
  Instagram,
  Languages,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Plane,
  Play,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  User,
  Users,
  X,
  Youtube,
} from "lucide-react";

import logo from "../assets/Logo.svg";
import { HtmlProgess } from "../HtmlComponents/HtmlProgress";
import Register from "../components/layout/Register";
import HtmlInput from "../HtmlComponents/HtmlInput";

const totalSteps = 6;

const inputClass =
  "h-[52px] w-full rounded-xl border border-[#d8e2fb] bg-white px-12 text-[15px] font-semibold text-[#173ca8] outline-none transition placeholder:text-[#9aa7bf] focus:border-[#6d7eff] focus:ring-4 focus:ring-[#6d7eff]/10";
const labelClass = "mb-2 block text-xs font-semibold text-[#6e7d99]";


function OtpBoxes({ code }: { code: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {code.split("").map((digit, index) => (
        <input
          key={`${digit}-${index}`}
          className="h-14 w-14 rounded-xl border border-[#dfe4ed] bg-white text-center text-xl font-black text-[#202337] outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
          defaultValue={digit}
          maxLength={1}
        />
      ))}
    </div>
  );
}

function ConnectedPill({ connected }: { connected?: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#c8f5dc] px-3 py-2 text-xs font-semibold text-[#00a875]">
      <CheckCircle className="h-4 w-4 fill-current text-[#16b989]" />
      Connected
    </span>
  ) : (
    <button type="button" className="rounded-md border-2 border-[#7667ff] px-5 py-2 text-xs font-black text-[#6353ff]">
      Connect Account
    </button>
  );
}

function SocialCard({
  icon,
  title,
  subtitle,
  connected,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  connected?: boolean;
}) {
  return (
    <article className="flex min-h-[92px] items-center gap-4 rounded-xl border border-[#e0e0e0] bg-white px-5">
      <span>{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-[#202337]">{title}</h3>
        <p className="mt-0.5 text-xs font-medium leading-snug text-[#707b91]">{subtitle}</p>
      </div>
      <ConnectedPill connected={connected} />
    </article>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-md bg-[#eee9ff] px-3 text-sm font-medium text-[#584cff]">
      {children}
      <X className="h-3.5 w-3.5" />
    </span>
  );
}

function PreferenceTile({
  title,
  copy,
  icon,
  active,
}: {
  title: string;
  copy: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <button type="button" className={`relative min-h-[132px] rounded-lg border p-4 text-center transition ${active
        ? "border-[#796cff] bg-[#eef3ff]"
        : "border-[#dfe4ed] bg-white"
      }`}
    >
      <span className={`absolute left-3 top-3 grid h-4 w-4 place-items-center rounded-[3px] border ${active ? "border-[#2f31e7] bg-[#2f31e7]" : "border-[#cbd4df] bg-white"}`}>
        {active ? <Check className="h-3 w-3 text-white" /> : null}
      </span>
      <span className="mx-auto mt-5 grid h-8 place-items-center text-[#776bff]">{icon}</span>
      <strong className="mt-3 block text-sm font-black text-[#202337]">{title}</strong>
      <span className="mt-2 block text-[11px] font-medium leading-snug text-[#707b91]">{copy}</span>
    </button>
  );
}



function StepContent({ step }: { step: number }) {
  if (step === 1) {
    return (
      <>
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Create your account</h1>
          <p className="mt-3 text-[15px] font-medium text-[#707b91]">Let's get started with a few details.</p>
        </div>
        <div className="mt-8 grid gap-4">
          <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Full Name" icon={<User className="h-5 w-5" />} value="Aakrit Gupta" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Email Address" icon={<Mail className="h-5 w-5" />} value="aakrit.gupta@gmail.com" type="email" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Phone Number" icon={<Phone className="h-5 w-5" />} value="+91 99999 44444" />
          <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Password" icon={<Lock className="h-5 w-5" />} value="•••••••••••" type="password" trailing={<Eye className="h-5 w-5" />} />
        </div>
        <p className="mt-6 text-center text-xs font-medium text-[#738098]">
          By continuing, you agree to Collune's <a className="text-[#6f80ff]" href="#">Terms of Service</a> and <a className="text-[#6f80ff]" href="#">Privacy Policy</a>.
        </p>
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Verify your contact</h1>
          <p className="mt-3 text-[15px] font-medium text-[#707b91]">Enter the verification codes sent to your email and phone.</p>
        </div>
        <div className="mt-12 grid gap-7">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#dce7ff] text-[#2345b9]">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-[#202337]">Verify Email</h2>
                <p className="text-sm font-medium text-[#707b91]">aakrit.gupta@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-7">
              <OtpBoxes code="248751" />
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#04b981]">
                <CheckCircle className="h-6 w-6" />
                Verified
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-[#707b91]">Resend code in <span className="text-[#1438a8]">00:45</span></p>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#dce7ff] text-[#2345b9]">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-[#202337]">Verify Phone</h2>
                <p className="text-sm font-medium text-[#707b91]">+91 98765 43210</p>
              </div>
            </div>
            <div className="flex items-center gap-7">
              <OtpBoxes code="531962" />
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#04b981]">
                <CheckCircle className="h-6 w-6" />
                Verified
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-[#707b91]">Resend code in <span className="text-[#1438a8]">00:45</span></p>
          </div>
        </div>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Connect your social accounts</h1>
          <p className="mt-3 text-[15px] font-medium text-[#707b91]">We'll only import public profile information and performance metrics.</p>
        </div>
        <div className="mx-auto mt-9 grid max-w-[430px] gap-3.5">
          <SocialCard
            title="Instagram"
            subtitle="@aakritgupta 125K Followers"
            connected
            icon={<span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#ff7a3f] to-[#d61d72] text-white"><Instagram className="h-7 w-7" /></span>}
          />
          <SocialCard
            title="YouTube"
            subtitle="Aakrit Gupta 86K Subscribers"
            connected
            icon={<span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ff0303] text-white"><Youtube className="h-7 w-7 fill-current" /></span>}
          />
          <SocialCard
            title="LinkedIn"
            subtitle="Connect your LinkedIn profile"
            icon={<span className="grid h-12 w-12 place-items-center rounded-xl bg-[#116bc1] text-white"><Linkedin className="h-7 w-7 fill-current" /></span>}
          />
          <SocialCard
            title="X (Twitter)"
            subtitle="Connect your X profile"
            icon={<span className="grid h-12 w-12 place-items-center rounded-xl bg-black text-white"><X className="h-7 w-7" /></span>}
          />
        </div>
      </>
    );
  }

  if (step === 4) {
    return (
      <>
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Tell us about yourself</h1>
          <p className="mt-3 text-[15px] font-medium text-[#707b91]">Help brands understand your audience and content.</p>
        </div>
        <div className="mt-8 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Creator Category</span>
            <span className="relative block">
              <Grid2X2 className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#707b91]" />
              <select className="h-12 w-full appearance-none rounded-xl border border-[#e0e0e0] bg-white px-10 text-sm font-medium text-[#202337] outline-none">
                <option>Political Commentary</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#707b91]" />
            </span>
          </label>
          <div>
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Languages</span>
            <div className="flex flex-wrap gap-2">
              <Tag>Hindi</Tag>
              <Tag>English</Tag>
              <button type="button" className="inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-[#9e85ff] px-3 text-sm font-medium text-[#584cff]">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
          <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Location" icon={<MapPin className="h-5 w-5" />} value="New Delhi, India" />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#202337]">Short Bio</span>
            <textarea
              className="h-36 w-full resize-none rounded-xl border border-[#e0e0e0] bg-white p-4 text-sm font-medium leading-relaxed text-[#202337] outline-none focus:border-[#7082f9] focus:ring-4 focus:ring-[#7082f9]/10"
              defaultValue="Political commentator helping young audiences understand policy and governance."
            />
            <span className="-mt-7 mr-4 block text-right text-xs font-medium text-[#9aa7bf]">78 / 200</span>
          </label>
        </div>
      </>
    );
  }

  if (step === 5) {
    return (
      <>
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Collaboration preferences</h1>
          <p className="mt-3 text-[15px] font-medium text-[#707b91]">Select the opportunities you'd like to receive.</p>
        </div>
        <div className="mt-5">
          <span className="mb-3 block text-sm font-black text-[#4c5880]">I'm interested in</span>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <PreferenceTile active title="Sponsored Posts" copy="Promote your content through sponsored posts" icon={<Megaphone className="h-7 w-7" />} />
            <PreferenceTile active title="Long-Term Partnerships" copy="Build ongoing relationships with brands" icon={<Users className="h-7 w-7" />} />
            <PreferenceTile active title="Product Launches" copy="Be part of exciting new product launches" icon={<Rocket className="h-7 w-7" />} />
            <PreferenceTile active title="UGC Content" copy="Create user-generated content for brands" icon={<Play className="h-7 w-7" />} />
            <PreferenceTile title="Events" copy="Participate in brand events and meetups" icon={<CalendarDays className="h-7 w-7" />} />
            <PreferenceTile title="Webinars" copy="Join or host webinars and live sessions" icon={<Globe className="h-7 w-7" />} />
          </div>
          <span className="mb-3 mt-5 block text-xs font-semibold text-[#202337]">Preferred response time</span>
          <div className="grid grid-cols-3 gap-3">
            {["Within 24 Hours", "Within 48 Hours", "Flexible"].map((item, index) => (
              <button key={item} type="button" className={`flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium ${index === 0 ? "border-[#2930ff] text-[#2930ff]" : "border-[#cfd6df] text-[#4c566b]"}`}>
                <span className={`h-4 w-4 rounded-full border ${index === 0 ? "border-[#2930ff] bg-[#2930ff] ring-2 ring-white" : "border-[#cfd6df]"}`} />
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-4 rounded-lg bg-[#eef3ff] px-4 py-4">
            <Plane className="h-6 w-6 text-[#776bff]" />
            <div className="flex-1">
              <h3 className="text-sm font-black text-[#202337]">Open to travel for campaigns</h3>
              <p className="text-[11px] font-medium text-[#707b91]">Brands can invite you for in-person collaborations</p>
            </div>
            <span className="flex h-6 w-10 items-center justify-end rounded-full bg-[#3430e2] p-1">
              <span className="h-4 w-4 rounded-full bg-white" />
            </span>
          </div>
          <span className="mb-3 mt-5 block text-xs font-semibold text-[#202337]">Content language</span>
          <div className="flex flex-wrap gap-2">
            <Tag>Hindi</Tag>
            <Tag>English</Tag>
            <Tag>Punjabi</Tag>
            <button type="button" className="inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-[#c8ced9] px-3 text-sm font-medium text-[#4c566b]">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-[28px] font-black tracking-normal text-[#202337]">Add your Portfolio</h1>
        <p className="mt-3 text-[15px] font-medium text-[#707b91]">Upload examples of your best work. You can always add more later.</p>
      </div>
      <div className="mt-8 grid min-h-[400px] place-items-center rounded-[24px] border-2 border-dashed border-[#d7e2ff] px-6 text-center">
        <div>
          <CloudUpload className="mx-auto h-16 w-16 text-[#7788ff]" />
          <h2 className="mt-7 text-lg font-semibold text-[#202337]">Drag & drop files here</h2>
          <p className="mt-4 text-sm font-medium text-[#707b91]">or</p>
          <button type="button" className="mt-6 rounded-lg border-2 border-[#2447bd] px-8 py-3 text-base font-black text-[#2447bd]">
            Upload Files
          </button>
          <p className="mt-5 text-sm font-medium text-[#707b91]">Supports: JPG, PNG, MP4 (Up to 200MB each)</p>
        </div>
      </div>
    </>
  );
}

const CreatorRegister = () => {
  const [step, setStep] = useState(1);

  const goNext = () => setStep((current) => Math.min(totalSteps, current + 1));

  if (step === 6) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] p-4 text-[#202337] md:p-10">
        <section className="relative mx-auto min-h-[calc(100vh-80px)] max-w-[1342px] overflow-hidden rounded-xl bg-white px-7 py-8 md:px-12">
          <a href="/" aria-label="Collune home" className="absolute left-7 top-8 inline-flex w-max md:left-12">
            <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
          </a>

          <div className="flex min-h-[calc(100vh-144px)] items-center justify-center pt-20">
            <form
              className="w-full max-w-[824px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-11 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-8"
              onSubmit={(event) => event.preventDefault()}
            >
              <HtmlProgess step={step} totalSteps={totalSteps} divClassName="text-center" />

              <div className="mt-9">
                <StepContent step={step} />
              </div>

              <div className="mx-auto mt-9 max-w-[535px]">
                <button
                  type="submit"
                  className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8]"
                >
                  Continue to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button type="button" className="mt-3 w-full text-center text-sm font-black text-[#64738e]">
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <Register
      totalSteps={totalSteps}
        step={step}
        children={
          <section className="flex items-center justify-center px-5 py-10 md:px-10">
            <form
              className="w-full max-w-[622px] rounded-2xl border border-[#e0e7fb] bg-white px-7 py-10 shadow-[0_0_0_1px_rgba(95,119,190,0.04),0_12px_34px_rgba(46,64,120,0.08)] md:px-10"
              onSubmit={(event) => {
                event.preventDefault();
                goNext();
              }}
            >
              <HtmlProgess step={step} totalSteps={totalSteps} divClassName="text-center" />

              <div className="mt-10">
                <StepContent step={step} />
              </div>

              <div className="mt-6 flex">
                <button
                  type="submit"
                  className="inline-flex h-[50px] flex-1 items-center justify-center gap-3 rounded-xl bg-[#2447bd] text-[15px] font-black text-white shadow-[0_12px_24px_rgba(36,71,189,0.18)] transition hover:bg-[#183aa8]"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {step === 1 ? (
                <p className="mt-8 text-center text-xs font-medium text-[#738098]">
                  Already have an account? <a className="font-black text-[#1438a8]" href="#login">Log in</a>
                </p>
              ) : null}
            </form>
          </section>

        }
      />

    </>
  );
};


export default CreatorRegister;
