import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getBrandMe, getCreatorProfile } from "../../lib/authApi";
import LoadingPage from "./LoadingPage";
import SideBar from "./SideBar";
import type { SidebarMode } from "./SideBar";
import { Plus } from "lucide-react";
import { HeaderButton } from "@/src/HtmlComponents/HtmlButton";

function useDashboardState() {
  const location = useLocation();
  const mode: SidebarMode = location.pathname.startsWith("/brand") ? "brand" : "creator";
  const pathname = location.pathname.replace(/\/$/, "") || "/";

  return { mode, pathname };
}

export const SideBarLayout = () => {
  const { currentUser } = useAuth();
  const { mode, pathname } = useDashboardState();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(true);
  const isBrand = mode === "brand";

  useEffect(() => {
    let mounted = true;
    setIsVerificationLoading(true);

    const loadVerificationStatus = isBrand ? getBrandMe : getCreatorProfile;
    loadVerificationStatus()
      .then((profile) => {
        if (!mounted) return;
        setIsVerified(String(profile.verification_status || "").toUpperCase() === "VERIFIED");
      })
      .catch(() => {
        if (mounted) setIsVerified(false);
      })
      .finally(() => {
        if (mounted) setIsVerificationLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser?.id, isBrand]);

  function TopComponents() {
    const topRoutes = [
      {
        matches: () => pathname === "/brand",
        render: () => (
          <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h1 className="text-[28px] font-semibold tracking-normal text-[#173ca8]">
                Welcome {currentUser?.name || "Brand"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HeaderButton onClick={() => navigate("/brand/campaigns/new_create")} variant="solid">
                <Plus className="h-5 w-5" />
                Create Campaign
              </HeaderButton>
              <HeaderButton onClick={() => navigate("/brand/shortlists")} variant="outline">
                <Plus className="h-5 w-5" />
                Build Shortlist
              </HeaderButton>
            </div>
          </header>
        ),
      },
      {
        matches: () => pathname === "/creator",
        render: () => (
          <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h1 className="text-[28px] font-semibold tracking-normal text-[#173ca8]">
                Welcome {currentUser?.name || "Creator"}
              </h1>
            </div>
            <HeaderButton onClick={() => navigate("/creator/marketplace")} variant="solid">
              Browse Campaigns
            </HeaderButton>
          </header>
        ),
      },
      {
        matches: () => pathname === "/brand/campaigns/new_create",
        render: () => (
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold tracking-normal text-[#173ca8]">
                Create new campaign
              </h1>
            </div>
          </header>
        ),
      },
      {
        matches: () => pathname === "/brand/campaigns",
        render: () => (
          <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h1 className="text-[28px] font-semibold tracking-normal text-[#173ca8]">
                Campaigns
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HeaderButton onClick={() => navigate("/brand/campaigns/new_create")} variant="solid">
                <Plus className="h-5 w-5" />
                Create Campaign
              </HeaderButton>
            </div>
          </header>
        ),
      },
    ];

    return topRoutes.find((route) => route.matches())?.render() ?? null;
  }

  if (isVerificationLoading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1d203a]">
      <SideBar isVerified={isVerified} mode={mode} />

      <div className="lg:pl-[270px]">
        <main className="min-h-[calc(100vh-98px)] bg-white px-6 py-8 lg:px-8">
          <div className="min-h-screen bg-white">
            <TopComponents />
            <Outlet context={{ isVerified, mode }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SideBarLayout;
