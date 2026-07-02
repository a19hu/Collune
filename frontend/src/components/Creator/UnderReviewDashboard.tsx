import { Panel } from "@/src/HtmlComponents/BrandCard";
import { CreatorDashboardApi } from "@/src/types";
import { CalendarDays, CheckCircle } from "lucide-react";

export const UnderReviewDashboard = ({ dashboard }: { dashboard?: CreatorDashboardApi | null }) => {

    const accountCreated = dashboard?.account_created ?? false;
    const socialMediaConnected = dashboard?.social_media_connected ?? dashboard?.Social_media_connected ?? false;
    const profileCompletion = dashboard?.profile_completion ?? 0;
    const steps = [
        ["We review your profile", "Our team checks your details and content"],
        ["We verify your accounts", "We verify your social media authenticity"],
        ["Your profile goes live", "You'll get notified once approved"],
        ["Brands can discover you", "You'll start receiving opportunities"],
    ];

    return (
        <div className="grid gap-5">
            <div className="grid gap-5 xl:grid-cols-3">
                <Panel className="min-h-[432px] p-8">
                    <div className="flex items-start justify-between">
                        <h2 className="text-[22px] font-black text-[#1d203a]">Profile Verification</h2>
                        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e9e2ff] text-[#2f31e7]">✦</span>
                    </div>
                    <div className="mt-8 grid gap-5">
                        {[
                            ["Account Created", accountCreated],
                            ["Social Accounts Connected", socialMediaConnected],
                            ["Verification In Progress", false],
                        ].map(([label, done]) => (
                            <div key={label as string} className="flex items-start gap-4">
                                {done ? <CheckCircle className="h-5 w-5 fill-[#16b989] text-white" /> : <ClockIcon />}
                                <div>
                                    <p className="font-semibold text-[#343b4d]">{label as string}</p>
                                    {!done ? <p className="mt-1 text-sm font-medium text-[#6f7889]">Our team is reviewing your profile</p> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-7 flex items-center gap-4 rounded-lg bg-[#f6f2ff] p-5">
                        <CalendarDays className="h-5 w-5 text-[#2f31e7]" />
                        <div>
                            <p className="text-sm font-medium text-[#7a8496]">Expected completion:</p>
                            <p className="font-black text-[#1d203a]">Within 24 hours</p>
                        </div>
                    </div>
                </Panel>

                <Panel className="min-h-[432px] p-8">
                    <h2 className="text-[22px] font-black text-[#1d203a]">What happens next?</h2>
                    <div className="mt-7 grid gap-5">
                        {steps.map(([title, copy], index) => (
                            <div key={title} className="flex gap-4">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2f31e7] text-sm font-black text-white">{index + 1}</span>
                                <div>
                                    <h3 className="font-black text-[#1d203a]">{title}</h3>
                                    <p className="mt-1 text-sm font-medium text-[#6f7889]">{copy}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel className="min-h-[432px] p-8 text-center">
                    <h2 className="text-[22px] font-black text-[#1d203a] text-left">Complete your profile</h2>
                    <ProfileCompletionRing value={profileCompletion} />
                    <p className="mx-auto mt-8 max-w-xs text-[15px] font-medium leading-snug text-[#6f7889]">
                        A complete profile gets more discovery and better opportunities.
                    </p>
                </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <LockedPanel title="Available after verification" copy="Once your profile is verified, you'll be able to browse and apply to campaigns." />
                <LockedPanel title="No opportunities yet" copy="Complete verification first. Once approved, brands will start discovering you." />
            </div>
        </div>
    );
}

function ClockIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#2f31e7]">
      <span className="h-2 w-px bg-[#2f31e7]" />
    </span>
  );
}

function ProfileCompletionRing({ value }: { value: number }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value || 0)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative mx-auto mt-16 grid h-[132px] w-[132px] place-items-center text-center">
      <svg viewBox="0 0 132 132" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#e8ecf5"
          strokeWidth="10"
        />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#2f31e7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
      <div className="relative">
        <strong className="block text-[36px] font-black text-[#2f31e7]">{percentage}%</strong>
        <span className="text-sm font-medium text-[#6f7889]">Complete</span>
      </div>
    </div>
  );
}

function LockedPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <Panel className="grid min-h-[348px] place-items-center p-8 text-center">
      <div>
        <Lock className="mx-auto h-12 w-12 text-[#8b7cff]" />
        <h3 className="mt-7 text-xl font-black text-[#343b4d]">{title}</h3>
        <p className="mx-auto mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#6f7889]">{copy}</p>
        <button className="mt-7 h-12 rounded-lg border-2 border-[#2f31e7] px-8 text-sm font-black text-[#2f31e7]">
          Learn More
        </button>
      </div>
    </Panel>
  );
}
