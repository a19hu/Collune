import { BadgeCheck, CheckCircle2, ShieldCheck, Sparkles, UserRound } from "lucide-react";

const benefits = [
  "Create your creator profile at no subscription cost",
  "Get discovered by brands looking for verified creators",
  "Showcase your category, location, and collaboration preferences",
  "Join now for free while Collune continues expanding creator tools",
];

export default function CreatorSubscriptionPage() {
  return (
    // <main className="min-h-screen bg-[#f4f6fb] px-4 pb-16 pt-28 text-[#202337] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-[#dfe7fb] bg-white shadow-[0_24px_60px_rgba(36,71,189,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-[linear-gradient(135deg,#eef3ff_0%,#f7f9ff_45%,#ebe7ff_100%)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-[#2447bd] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Creator Subscription
            </span>
            <h1 className="mt-6 text-[34px] font-black leading-tight tracking-normal text-[#17327c] sm:text-[42px]">
              Collune is currently free for creators.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] font-medium leading-7 text-[#5f6f89] sm:text-base">
              Right now, subscription is free for creators. You can join Collune, build your profile,
              and receive collaboration opportunities without paying any subscription fee.
            </p>

            <div className="mt-8 grid gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-4 text-sm font-semibold text-[#3f5070] shadow-[0_8px_20px_rgba(36,71,189,0.06)]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5a6dff]" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
            <div className="rounded-[24px] border border-[#e2e9fb] bg-[#f8faff] p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e6edff] text-[#2447bd]">
                <UserRound className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-normal text-[#202337]">Current Plan</h2>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#6f80ff]">Free access</p>
              <div className="mt-6 rounded-2xl bg-white px-5 py-4 shadow-[0_10px_24px_rgba(36,71,189,0.06)]">
                <p className="text-4xl font-black text-[#17327c]">₹0</p>
                <p className="mt-2 text-sm font-medium text-[#65758f]">No subscription charge for creators at this time.</p>
              </div>
              <div className="mt-6 grid gap-3 text-sm font-semibold text-[#4d5b76]">
                <span className="flex items-center gap-3"><BadgeCheck className="h-4 w-4 text-[#6174ff]" /> Subscription is currently free for all creator accounts</span>
                <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#6174ff]" /> Verification and platform rules still apply</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    // </main>
  );
}
