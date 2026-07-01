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

  return { mode };
}

export const SideBarLayout = () => {
  const { currentUser } = useAuth();
  const { mode } = useDashboardState();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(true);
  const isBrand = mode === "brand";
  const [locationPath, setLocationPath] = useState(window.location.pathname.replace(/\/$/, ""));

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

  useEffect(() => {
    const location =  window.location.pathname.replace(/\/$/, "");
    setLocationPath(location);
  },[]);

  function TopComponents() {
    switch (locationPath) {
      case "/brand/campaigns":
        return (
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#173ca8] font-semibold">
           Campaigns
          </h1>
        </div>

          <button
            type="button"
            onClick={() => navigate("/brand/campaigns/new_create")}
            className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#173ca8] px-7 text-sm font-black text-white shadow-[0_8px_14px_rgba(23,60,168,0.22)]"
          >
            <Plus className="h-5 w-5" />
            Create Campaign
          </button>
      </header>
        );
      case "/brand/shortlists":
        return (
          <HeaderButton onClick={() => navigate("/brand/shortlists/new_create")} variant="solid">
            <Plus className="h-5 w-5" />
            Build Shortlist
          </HeaderButton>
        );
      case "/brand/campaigns/new_create":
        return (
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#173ca8] font-semibold">
           Create new campaign
          </h1>
        </div>
      </header>
        )
      default:
        return(
          <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#173ca8] font-semibold">Welcome 
            {/* {brandName}! */}
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
        )
        ;
    } 
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
