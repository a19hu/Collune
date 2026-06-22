import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getBrandMe, getCreatorProfile } from "../../lib/authApi";
import LoadingPage from "./LoadingPage";
import SideBar from "./SideBar";
import type { SidebarMode } from "./SideBar";

function useDashboardState() {
  const location = useLocation();
  const mode: SidebarMode = location.pathname.startsWith("/brand") ? "brand" : "creator";

  return { mode };
}

export const SideBarLayout = () => {
  const { currentUser } = useAuth();
  const { mode } = useDashboardState();
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

  if (isVerificationLoading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1d203a]">
      <SideBar isVerified={isVerified} mode={mode} />

      <div className="lg:pl-[270px]">
        {/* <header className="sticky top-0 z-20 flex h-[98px] items-center justify-between border-b border-[#eef1f6] bg-white px-6 lg:px-14">
          <h1 className="text-[24px] font-black tracking-normal text-[#1438a8]">
            {greeting}
          </h1>

          <div className="flex items-center gap-6">
            <span
              className={`hidden items-center gap-2 rounded-md px-4 py-2 text-sm font-black sm:inline-flex ${
                isVerified ? "bg-[#cff8df] text-[#00a875]" : "bg-[#fff0dd] text-[#e67600]"
              }`}
            >
              {isVerified ? <CheckCircle className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-[#f39a18]" />}
              {statusLabel}
            </span>

            <button className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1438a8] text-sm font-black text-white">
                {profileInitial}
              </span>
              <span className="hidden text-[15px] font-semibold text-[#1438a8] sm:inline">{profileName}</span>
              <ChevronDown className="h-4 w-4 text-[#1438a8]" />
            </button>
          </div>
        </header> */}

        <main className="min-h-[calc(100vh-98px)] bg-white px-6 py-8 lg:px-8">
          <Outlet context={{ isVerified, mode }} />
        </main>
      </div>
    </div>
  );
};

export default SideBarLayout;
