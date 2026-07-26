import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SideBar from "./SideBar";
import type { SidebarMode } from "./SideBar";
import { BadgeCheck, ChevronDown, Menu, Plus } from "lucide-react";
import { HeaderButton } from "@/src/HtmlComponents/HtmlButton";
import type { UserAccount } from "../../types";
import { WebsiteTutorial } from "./WebsiteTutorial";

function useDashboardState() {
  const location = useLocation();
  const mode: SidebarMode = location.pathname.startsWith("/admin") ? "admin" : location.pathname.startsWith("/brand") ? "brand" : "creator";
  const pathname = location.pathname.replace(/\/$/, "") || "/";

  return { mode, pathname };
}

type DashboardUserMenuProps = {
  currentUser: UserAccount | null;
  logout: () => Promise<void>;
  profilePath: string;
};

type DashboardTopBarProps = DashboardUserMenuProps & {
  title: string;
  status?: "verified-creator" | "verified-brand" | "under-review";
  actions?: ReactNode;
  onOpenSidebar?: () => void;
};

const statusPillStyles = {
  "verified-creator": {
    label: "Verified Creator",
    className: "bg-[#ddfbea] text-[#31b979]",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  "verified-brand": {
    label: "Verified Brand",
    className: "bg-[#ddfbea] text-[#31b979]",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  "under-review": {
    label: "Under Review",
    className: "bg-[#fff2df] text-[#f59a23]",
    icon: <span className="h-2 w-2 rounded-full bg-[#f59a23]" />,
  },
};

function getUserInitial(currentUser: UserAccount | null) {
  return currentUser?.name?.trim().charAt(0).toUpperCase() || currentUser?.email?.trim().charAt(0).toUpperCase() || "U";
}

function VerificationPill({ status }: { status: NonNullable<DashboardTopBarProps["status"]> }) {
  const pill = statusPillStyles[status];

  return (
    <span className={`inline-flex h-9 items-center gap-2 rounded-[7px] px-4 text-[13px] font-black ${pill.className}`}>
      {pill.icon}
      {pill.label}
    </span>
  );
}

function DashboardUserMenu({ currentUser, logout, profilePath }: DashboardUserMenuProps) {
  const userInitial = getUserInitial(currentUser);

  return (
    <div className="group relative justify-self-end">
      <button
        type="button"
        className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-transparent text-sm font-black text-[#2449bd] transition hover:bg-[#eef3ff]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#173fb5] text-white">
          {userInitial}
        </span>
        <span className="hidden max-w-[170px] truncate sm:inline">{currentUser?.name || "User"}</span>
        <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </button>
      <div className="invisible absolute right-0 top-12 z-30 w-56 rounded-2xl border border-[#dce5fb] bg-white p-2 opacity-0 shadow-[0_18px_40px_rgba(45,66,140,0.14)] transition group-hover:visible group-hover:opacity-100">
        <Link to={profilePath} className="block rounded-xl px-4 py-3 text-sm font-black text-[#34466d] transition hover:bg-[#eef3ff] hover:text-[#214bc0]">
          Profile
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="block w-full rounded-xl px-4 py-3 text-left text-sm font-black text-[#b42318] transition hover:bg-[#fff0f0]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function DashboardTopBar({ title, status, actions, currentUser, logout, profilePath, onOpenSidebar }: DashboardTopBarProps) {
  return (
    <header data-tour="topbar" className="mb-10 flex min-h-[72px] flex-wrap items-center justify-between gap-5 border-b border-[#eef2fb] bg-white pb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-[#dce5fb] bg-[#f5f7ff] text-[#214bc0] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-[22px] font-black tracking-normal text-[#173ca8]">
          {title}
        </h1>
      </div>
      <div data-tour="topbar-actions" className="flex flex-wrap items-center gap-5">
        {actions}
        {status ? null : <VerificationPill status={status} /> }
        {
          currentUser.role == "Brand" ?  null :
          <DashboardUserMenu currentUser={currentUser} logout={logout} profilePath={profilePath} />
        }
      </div>
    </header>
  );
}

export const SideBarLayout = () => {
  const { currentUser, logout } = useAuth();
  const { mode, pathname } = useDashboardState();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isBrand = mode === "brand";
  const isAdmin = mode === "admin";
  const profilePath = isAdmin ? "/admin" : isBrand ? "/brand" : "/creator/profile";
  const isVerified = currentUser.verification_status === "VERIFIED"
  const brandStatus = isVerified ? "verified-brand" : "under-review";

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  function TopComponentsCreator() {
    const topRoutes = [
      {
        matches: () => pathname === "/creator",
        render: () => (
          <DashboardTopBar
            title={
              isVerified
                ? `Hello, ${currentUser?.name || "Creator"}. Hope you're having a nice day!`
                : `Welcome, ${currentUser?.name || "Creator"}. Nice to have you onboard!`
            }
            status={isVerified ? "verified-creator" : "under-review"}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname === "/creator/marketplace" || pathname.startsWith("/creator/marketplace/"),
        render: () => (
          <DashboardTopBar
            title={
              isVerified
                ? "Campaign Marketplace"
                : `Welcome, ${currentUser?.name || "Creator"}. Nice to have you onboard!`
            }
            status={isVerified ? "verified-creator" : "under-review"}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname === "/creator/applied-campaigns",
        render: () => (
          <DashboardTopBar
            title="Applied Campaigns"
            status={isVerified ? "verified-creator" : "under-review"}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname === "/creator/saved-campaigns",
        render: () => (
          <DashboardTopBar
            title="Saved Campaigns"
            status={isVerified ? "verified-creator" : "under-review"}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname === "/creator/profile",
        render: () => (
          <DashboardTopBar
            title={"Profile"}
            status={isVerified ? "verified-creator" : "under-review"}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
    ];

    return topRoutes.find((route) => route.matches())?.render() ?? null;
  }

  function TopComponentsAdmin() {
    const topRoutes = [
      { matches: () => pathname === "/admin", title: "Admin Dashboard" },
      { matches: () => pathname === "/admin/users", title: "Users" },
      { matches: () => pathname === "/admin/creators", title: "Creators" },
      { matches: () => pathname === "/admin/brands", title: "Brands" },
      { matches: () => pathname === "/admin/campaigns", title: "Campaigns" },
      { matches: () => pathname === "/admin/shortlists", title: "Shortlists" },
    ];
    const route = topRoutes.find((item) => item.matches());

    return (
      <DashboardTopBar
        title={route?.title || "Admin"}
        currentUser={currentUser}
        logout={logout}
        profilePath={profilePath}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
      />
    );
  }

  function TopComponentsBrand() {
    const topRoutes = [
      {
        matches: () => pathname === "/brand",
        render: () => (
          <DashboardTopBar
            title={
              isVerified
                ? `Welcome ${currentUser?.name || "Brand"}`
                : `Welcome, ${currentUser?.name || "Brand"}. Your brand is under review.`
            }
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            actions={isVerified ? (
              <>
                <HeaderButton onClick={() => navigate("/brand/campaigns/new_create")} variant="solid">
                  <Plus className="h-5 w-5" />
                  Create Campaign
                </HeaderButton>
                <HeaderButton onClick={() => navigate("/brand/shortlists/new_create")} variant="outline">
                  <Plus className="h-5 w-5" />
                  Build Shortlist
                </HeaderButton>
              </>
            ) : undefined}
          />
        ),
      },
      {
        matches: () => pathname === "/creator",
        render: () => (
          <DashboardTopBar
            title={`Welcome ${currentUser?.name || "Creator"}`}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            actions={
              <HeaderButton onClick={() => navigate("/creator/marketplace")} variant="solid">
                Browse Campaigns
              </HeaderButton>
            }
          />
        ),
      },
      {
        matches: () => pathname === "/brand/campaigns/new_create",
        render: () => (
          <DashboardTopBar
            title="Create new campaign"
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname === "/brand/shortlists/new_create",
        render: () => (
          <DashboardTopBar
            title="Create new shortlist"
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          />
        ),
      },
      {
        matches: () => pathname.startsWith("/brand/shortlists/") && pathname.endsWith("/edit"),
        render: () => (
          <DashboardTopBar
            title="Edit shortlist"
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
          />
        ),
      },
      {
        matches: () => pathname === "/brand/shortlists" || pathname.startsWith("/brand/shortlists/"),
        render: () => (
          <DashboardTopBar
            title="Shortlists"
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            actions={isVerified ? (
              <HeaderButton onClick={() => navigate("/brand/shortlists/new_create")} variant="solid">
                <Plus className="h-5 w-5" />
                Build Shortlist
              </HeaderButton>
            ) : undefined}
          />
        ),
      },
      {
        matches: () => pathname === "/brand/campaigns" || pathname.startsWith("/brand/campaigns/"),
        render: () => (
          <DashboardTopBar
            title="Campaigns"
            status={brandStatus}
            currentUser={currentUser}
            logout={logout}
            profilePath={profilePath}
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            actions={isVerified ? (
              <HeaderButton onClick={() => navigate("/brand/campaigns/new_create")} variant="solid">
                <Plus className="h-5 w-5" />
                Create Campaign
              </HeaderButton>
            ) : undefined}
          />
        ),
      },
    ];

    return topRoutes.find((route) => route.matches())?.render() ?? null;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#1d203a]">
      <SideBar
        isVerified={isVerified}
        mode={mode}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="lg:pl-[270px]">
        <main className="min-h-[calc(100vh-98px)] bg-white px-6 py-0 lg:px-8">
          <div className="min-h-screen bg-white pt-8">
            {
              isAdmin ?
                <TopComponentsAdmin /> :
              isBrand ?
                <TopComponentsBrand /> :
                <TopComponentsCreator />
            }
            <div data-tour="page-content">
              <Outlet context={{ isVerified, mode }} />
            </div>
          </div>
        </main>
      </div>
      <WebsiteTutorial role={currentUser.role} userEmail={currentUser.email} />
    </div>
  );
};

export default SideBarLayout;
