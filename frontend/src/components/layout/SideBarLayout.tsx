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
        <main className="min-h-[calc(100vh-98px)] bg-white px-6 py-8 lg:px-8">
          <Outlet context={{ isVerified, mode }} />
        </main>
      </div>
    </div>
  );
};

export default SideBarLayout;
