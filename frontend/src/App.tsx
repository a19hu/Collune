import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import './index.css';
import CreatorRegister from './pages/CreatorRegister.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LandingPage from "./pages/LandingPage.tsx";
import ColluneInfoPage from "./pages/ColluneInfoPage.tsx";
import PublicCreatorProfile from "./pages/PublicCreatorProfile.tsx";
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import BrandRegister from './pages/BrandRegister.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { SideBarLayout } from './components/layout/SideBarLayout.tsx';
import CreatorDashBoard from './components/Creator/CreatorDashBoard.tsx';
import CreatorProfile from './components/Creator/CreatorProfile.tsx';
import BrandDashBoard from './components/Brand/BrandDashBoard.tsx';
import { BrandCampaigns } from './components/Brand/BrandCampaigns.tsx';
import { CampaignApplicationsPage } from './components/Brand/Campaigns/CampaignApplicationsPage.tsx';
import { BrandShortlists } from './components/Brand/BrandShortlists.tsx';
import LoadingPage from './components/layout/LoadingPage.tsx';
import type { UserAccount } from './types.ts';
import { getBrandMe, getCreatorProfile } from './lib/authApi.ts';
import { CampaignCreateForm } from './components/Brand/Campaigns/CampaignCreateForm.tsx';
import { DiscoverCreatorsPage } from './pages/DiscoverCreatorsPage.tsx';
import { CampaignMarketplaceDetail } from './components/Creator/CampaignMarketplace/CampaignMarketplaceDetail.tsx';
import { CampaignMarketplaceList } from './components/Creator/CampaignMarketplace/CampaignMarketplaceList.tsx';

function RequireAuth({ allowedRole }: { allowedRole: UserAccount['role'] }) {
    const { currentUser, isAuthLoading } = useAuth();

    if (isAuthLoading) return <LoadingPage />;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (currentUser.role !== allowedRole) {
        return <Navigate to={currentUser.role === 'Brand' ? '/brand' : currentUser.role === 'Creator' ? '/creator' : '/'} replace />;
    }

    return <Outlet />;
}

function RequireVerified({ children }: { children: React.ReactElement }) {
    const { currentUser } = useAuth();
    const [isVerified, setIsVerified] = useState(false);
    const [isVerificationLoading, setIsVerificationLoading] = useState(true);
    const isBrand = currentUser?.role === 'Brand';

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
    if (!isVerified) return <Navigate to={isBrand ? "/brand" : "/creator"} replace />;

    return children;
}

const App: React.FC = () => {

    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path='/' element={<LandingPage />} />
                        <Route path="discover-creators" element={<DiscoverCreatorsPage />} />
                        <Route path="creator_profile/:creatorId" element={<PublicCreatorProfile />} />
                        <Route path="creators/:creatorId" element={<PublicCreatorProfile />} />
                        {/* <Route path="success-stories" element={<ColluneInfoPage page="success-stories" />} /> */}
                        {/* <Route path="blogs" element={<ColluneInfoPage page="blogs" />} /> */}
                        {/* <Route path="faqs" element={<ColluneInfoPage page="faqs" />} /> */}


                    </Route>
                    
                    <Route element={<RequireAuth allowedRole="Creator" />}>
                        <Route path="/creator/*" element={<SideBarLayout />}>
                            <Route index element={<CreatorDashBoard />} />
                            <Route path="profile" element={<CreatorProfile />} />
                            <Route path="marketplace/:campaignId" element={<RequireVerified><CampaignMarketplaceDetail /></RequireVerified>} />
                            <Route path="marketplace" element={<RequireVerified><CampaignMarketplaceList /></RequireVerified>} />
                        </Route>
                    </Route>
                    <Route element={<RequireAuth allowedRole="Brand" />}>
                        <Route path="/brand/*" element={<SideBarLayout />}>
                            <Route index element={<BrandDashBoard />} />
                            <Route path="shortlists" element={<BrandShortlists />} />
                            <Route path="shortlists/:shortlistId" element={<BrandShortlists />} />
                            <Route path="creators" element={<ColluneInfoPage page="discover-creators" />} />
                            <Route path="campaigns" element={<BrandCampaigns />} />
                            <Route path="campaigns/new_create" element={<CampaignCreateForm />} />
                            <Route path="campaigns/:campaignId" element={<CampaignApplicationsPage />} />
                            <Route path="campaigns/:campaignId/applications" element={<CampaignApplicationsPage />} />
                        </Route>
                    </Route>
                    <Route path="/creator-register" element={<CreatorRegister />} />
                    <Route path="/creator-register/:step" element={<CreatorRegister />} />
                    <Route path="/brand-register" element={<BrandRegister />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<NotFoundPage />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
};

export default App;
