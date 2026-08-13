import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import './index.css';
import CreatorRegister from './pages/CreatorRegister.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LandingPage from "./pages/LandingPage.tsx";
import PublicCreatorProfile from "./pages/PublicCreatorProfile.tsx";
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import BrandRegister from './pages/BrandRegister.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { SideBarLayout } from './components/layout/SideBarLayout.tsx';
import CreatorDashBoard from './components/Creator/CreatorDashBoard.tsx';
import CreatorProfile from './components/Creator/CreatorProfile.tsx';
import BrandProfile from './components/Brand/BrandProfile.tsx';
import BrandDashBoard from './components/Brand/BrandDashBoard.tsx';
import { BrandCampaigns } from './components/Brand/BrandCampaigns.tsx';
import { CampaignApplicationsPage } from './components/Brand/Campaigns/CampaignApplicationsPage.tsx';
import { RecommendedCreatorsPage } from './components/Brand/Campaigns/RecommendedCreatorsPage.tsx';
import { BrandShortlists } from './components/Brand/BrandShortlists.tsx';
import LoadingPage from './components/layout/LoadingPage.tsx';
import type { UserAccount } from './types.ts';
import { CampaignCreateForm } from './components/Brand/Campaigns/CampaignCreateForm.tsx';
import { ShortlistCreateForm } from './components/Brand/Shortlists/ShortlistCreateForm.tsx';
import { DiscoverCreatorsPage } from './pages/DiscoverCreatorsPage.tsx';
import { CampaignMarketplaceDetail } from './components/Creator/CampaignMarketplace/CampaignMarketplaceDetail.tsx';
import { CampaignMarketplaceList } from './components/Creator/CampaignMarketplace/CampaignMarketplaceList.tsx';
import AppliedCampaigns from './components/Creator/AppliedCampaigns.tsx';
import SavedCampaigns from './components/Creator/SavedCampaigns.tsx';
import AboutCollune from './pages/AboutCollune.tsx';
import BrandSubscriptionPage from './components/Brand/BrandSubscriptionPage.tsx';
import SavedCreators from './components/Brand/SavedCreators.tsx';
import CreatorSubscriptionPage from './components/Creator/CreatorSubscriptionPage.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsConditions from './pages/TermsConditions.tsx';
import BrandServicesTerms from './pages/BrandServicesTerms.tsx';
import CreativeServicesTerms from './pages/CreativeServicesTerms.tsx';
import AdminDashboard from './components/Admin/AdminDashboard.tsx';
import AdminUsers from './components/Admin/AdminUsers.tsx';
import AdminCreators from './components/Admin/AdminCreators.tsx';
import AdminBrands from './components/Admin/AdminBrands.tsx';
import AdminCampaigns from './components/Admin/AdminCampaigns.tsx';
import AdminShortlists from './components/Admin/AdminShortlists.tsx';

function isInternalWorkspaceRole(role: UserAccount["role"]) {
    return role !== "Brand" && role !== "Creator";
}

function getDashboardPath(role: UserAccount["role"]) {
    return role === "Brand" ? "/brand" : role === "Creator" ? "/creator" : "/admin";
}

function RequireAuth({ allowedRole }: { allowedRole: UserAccount['role'] }) {
    const { currentUser, isAuthLoading } = useAuth();

    if (isAuthLoading) return <LoadingPage />;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (allowedRole === "Admin") {
        if (!isInternalWorkspaceRole(currentUser.role)) {
            return <Navigate to={getDashboardPath(currentUser.role)} replace />;
        }
    } else if (currentUser.role !== allowedRole) {
        return <Navigate to={getDashboardPath(currentUser.role)} replace />;
    }

    return <Outlet />;
}

function RequireVerified({ children }: { children: React.ReactElement }) {
    const { currentUser } = useAuth();
    const isBrand = currentUser?.role === 'Brand';
    const isVerified = currentUser.verification_status === "VERIFIED"


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
                        <Route path="about-collune" element={<AboutCollune />} />
                        <Route path="privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="terms-conditions" element={<TermsConditions />} />
                        <Route path="brand-services-terms" element={<BrandServicesTerms />} />
                        <Route path="creative-services-terms" element={<CreativeServicesTerms />} />
                        <Route path="discover-creators" element={<DiscoverCreatorsPage />} />
                        <Route path="creator_profile/:creatorId" element={<PublicCreatorProfile />} />
                        <Route path="creators/:creatorId" element={<PublicCreatorProfile />} />


                    </Route>
                    
                    <Route element={<RequireAuth allowedRole="Creator" />}>
                        <Route path="/creator/*" element={<SideBarLayout />}>
                            <Route index element={<CreatorDashBoard />} />
                            <Route path="profile" element={<CreatorProfile />} />
                            <Route path="marketplace/:campaignId" element={<RequireVerified><CampaignMarketplaceDetail /></RequireVerified>} />
                            <Route path="marketplace" element={<RequireVerified><CampaignMarketplaceList /></RequireVerified>} />
                            <Route path="applied-campaigns" element={<RequireVerified><AppliedCampaigns /></RequireVerified>} />
                            <Route path="saved-campaigns" element={<RequireVerified><SavedCampaigns /></RequireVerified>} />
                            <Route path="creator-subscription" element={<CreatorSubscriptionPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Route>
                    <Route element={<RequireAuth allowedRole="Brand" />}>
                        <Route path="/brand/*" element={<SideBarLayout />}>
                            <Route index element={<BrandDashBoard />} />
                            <Route path="analytics" element={<BrandDashBoard />} />
                            <Route path="profile" element={<BrandProfile />} />
                            <Route path="saved-creators" element={<RequireVerified><SavedCreators /></RequireVerified>} />
                            <Route path="shortlists" element={<BrandShortlists />} />
                            <Route path="shortlists/new_create" element={<ShortlistCreateForm />} />
                            <Route path="shortlists/:shortlistId/edit" element={<ShortlistCreateForm />} />
                            <Route path="shortlists/:shortlistId" element={<BrandShortlists />} />
                            <Route path="campaigns" element={<BrandCampaigns />} />
                            <Route path="campaigns/new_create" element={<CampaignCreateForm />} />
                            <Route path="campaigns/:campaignId/edit" element={<CampaignCreateForm />} />
                            <Route path="campaigns/:campaignId/recommended-creators" element={<RecommendedCreatorsPage />} />
                            <Route path="campaigns/:campaignId" element={<CampaignApplicationsPage />} />
                            <Route path="brand-subscription" element={<BrandSubscriptionPage />} />

                            {/* <Route path="campaigns/:campaignId/applications" element={<CampaignApplicationsPage />} /> */}
                        </Route>
                    </Route>
                    <Route element={<RequireAuth allowedRole="Admin" />}>
                        <Route path="/admin/*" element={<SideBarLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="creators" element={<AdminCreators />} />
                            <Route path="brands" element={<AdminBrands />} />
                            <Route path="campaigns" element={<AdminCampaigns />} />
                            <Route path="shortlists" element={<AdminShortlists />} />
                        </Route>
                    </Route>
                    <Route path="/creator-register" element={<CreatorRegister />} />
                    <Route path="/brand-register" element={<BrandRegister />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<NotFoundPage />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
};

export default App;
