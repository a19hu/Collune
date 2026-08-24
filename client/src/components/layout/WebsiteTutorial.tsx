import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, LayoutDashboard, LifeBuoy, Menu, MousePointerClick, Search, Sparkles, Users, X } from "lucide-react";
type TutorialRole = string;

type TutorialStep = {
  title: string;
  copy: string;
  icon: typeof Sparkles;
  target: string;
  placement: "right" | "bottom" | "center";
};

const brandSteps: TutorialStep[] = [
  {
    title: "Your main sidebar",
    copy: "Use this left sidebar to move between Dashboard, Campaigns, Discover Creators, and Shortlists.",
    icon: Menu,
    target: '[data-tour="sidebar-nav"]',
    placement: "right",
  },
  {
    title: "Brand account switcher",
    copy: "This area shows your brand identity and account controls. It is where brand-level account actions live.",
    icon: Users,
    target: '[data-tour="brand-account-switcher"]',
    placement: "right",
  },
  {
    title: "Top action buttons",
    copy: "Use these top buttons to create campaigns or build shortlists quickly from brand pages.",
    icon: MousePointerClick,
    target: '[data-tour="topbar-actions"]',
    placement: "bottom",
  },
  {
    title: "Page workspace",
    copy: "This main area changes based on the section you open. Campaign details, lists, forms, and dashboards appear here.",
    icon: LayoutDashboard,
    target: '[data-tour="page-content"]',
    placement: "center",
  },
  {
    title: "Support is always available",
    copy: "Use the support panel in the sidebar when you need help with campaigns, creator selection, or platform workflows.",
    icon: LifeBuoy,
    target: '[data-tour="support-card"]',
    placement: "right",
  },
];

const creatorSteps: TutorialStep[] = [
  {
    title: "Your creator sidebar",
    copy: "Use this left sidebar to move between Dashboard, Profile, Campaign Marketplace, Applied Campaigns, and Saved Campaigns.",
    icon: Menu,
    target: '[data-tour="sidebar-nav"]',
    placement: "right",
  },
  {
    title: "Top status area",
    copy: "The top bar shows your current page and verification state, so you know whether marketplace actions are available.",
    icon: Sparkles,
    target: '[data-tour="topbar"]',
    placement: "bottom",
  },
  {
    title: "Browse campaigns",
    copy: "Open Campaign Marketplace from the sidebar to find relevant brand campaigns, review details, save opportunities, and apply.",
    icon: Search,
    target: '[data-tour="sidebar-nav"]',
    placement: "right",
  },
  {
    title: "Main page workspace",
    copy: "This is where your dashboard, profile editor, campaign lists, and campaign details appear as you navigate.",
    icon: Compass,
    target: '[data-tour="page-content"]',
    placement: "center",
  },
  {
    title: "Need help?",
    copy: "The sidebar support area is available when you need help understanding campaigns, profile setup, or next steps.",
    icon: LifeBuoy,
    target: '[data-tour="support-card"]',
    placement: "right",
  },
];


function getStorageKey(role: TutorialRole, email?: string) {
  return `collune:tutorial:v1:${role}:${email || "unknown"}`;
}

export function WebsiteTutorial({ role, userEmail }: { role: TutorialRole; userEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const steps = useMemo(() => role === "Brand" ? brandSteps : creatorSteps, [role]);
  const storageKey = useMemo(() => getStorageKey(role, userEmail), [role, userEmail]);
  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) !== "done") {
        const timer = window.setTimeout(() => setIsOpen(true), 500);
        return () => window.clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, [storageKey]);

  const closeTutorial = () => {
    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      // localStorage may be unavailable in restricted browser modes.
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateTarget = () => {
      const target = document.querySelector(step.target);
      setTargetRect(target ? target.getBoundingClientRect() : null);
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [isOpen, step.target]);

  const popoverStyle = useMemo(() => {
    const width = 420;
    const margin = 18;
    const viewportWidth = typeof window === "undefined" ? 1200 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;

    if (!targetRect || step.placement === "center") {
      return {
        left: `${Math.max(16, (viewportWidth - width) / 2)}px`,
        top: `${Math.max(16, viewportHeight / 2 - 190)}px`,
        width: `${Math.min(width, viewportWidth - 32)}px`,
      };
    }

    if (step.placement === "right") {
      const left = Math.min(targetRect.right + margin, viewportWidth - width - 16);
      const top = Math.min(Math.max(16, targetRect.top), viewportHeight - 360);
      return { left: `${Math.max(16, left)}px`, top: `${Math.max(16, top)}px`, width: `${Math.min(width, viewportWidth - 32)}px` };
    }

    const left = Math.min(Math.max(16, targetRect.left), viewportWidth - width - 16);
    const top = Math.min(targetRect.bottom + margin, viewportHeight - 360);
    return { left: `${Math.max(16, left)}px`, top: `${Math.max(16, top)}px`, width: `${Math.min(width, viewportWidth - 32)}px` };
  }, [step.placement, targetRect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-[#0d1633]/55">
      {targetRect ? (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-[#4b22ff] bg-white/10 shadow-[0_0_0_9999px_rgba(13,22,51,0.48),0_18px_50px_rgba(75,34,255,0.28)]"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <section className="fixed rounded-xl bg-white shadow-[0_28px_80px_rgba(13,22,51,0.26)]" style={popoverStyle}>
        <header className="flex items-start justify-between gap-4 border-b border-[#e5ebf3] p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[#173ca8]">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-black text-[#173ca8]">
                {role} Tutorial · Step {stepIndex + 1} of {steps.length}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-normal text-[#1d2430]">{step.title}</h2>
            </div>
          </div>
          <button type="button" onClick={closeTutorial} className="grid h-9 w-9 place-items-center rounded-lg text-[#63728a] hover:bg-[#f3f6fa]" aria-label="Close tutorial">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6">
          <p className="text-base font-medium leading-8 text-[#63728a]">{step.copy}</p>

          <div className="mt-7 flex gap-2">
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={`h-2 flex-1 rounded-full ${index <= stepIndex ? "bg-[#173ca8]" : "bg-[#dfe7f2]"}`}
              />
            ))}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ebf3] p-6">
          <button type="button" onClick={closeTutorial} className="h-10 rounded-lg px-4 text-sm font-black text-[#63728a] hover:bg-[#f3f6fa]">
            Skip tour
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-4 text-sm font-black text-[#303948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => isLastStep ? closeTutorial() : setStepIndex((index) => index + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#173ca8] px-5 text-sm font-black text-white"
            >
              {isLastStep ? "Finish" : "Next"}
              {isLastStep ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
