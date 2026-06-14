import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import CreatorRegister from './pages/CreatorRegister.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LandingPage from "./pages/LandingPage.tsx";
import ColluneInfoPage from "./pages/ColluneInfoPage.tsx";
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import BrandRegister from './pages/BrandRegister.tsx';
import { SideBarLayout } from './components/layout/SideBarLayout.tsx';
import CreatorDashBoard from './components/Creator/CreatorDashBoard.tsx';
import BrandDashBoard from './components/Brand/BrandDashBoard.tsx';
import { BrandSettings } from './components/Brand/BrandSettings.tsx';
import { BrandCampaigns } from './components/Brand/BrandCampaigns.tsx';


const App: React.FC = () => {

    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path='/' element={<LandingPage />} />
                        <Route path="discover-creators" element={<ColluneInfoPage page="discover-creators" />} />
                        <Route path="featured-creators" element={<ColluneInfoPage page="featured-creators" />} />
                        <Route path="success-stories" element={<ColluneInfoPage page="success-stories" />} />
                        <Route path="blogs" element={<ColluneInfoPage page="blogs" />} />
                        <Route path="faqs" element={<ColluneInfoPage page="faqs" />} />


                    </Route>
                    
                    <Route path="/creator/*" element={<SideBarLayout />}>
                        <Route index element={<CreatorDashBoard />} />
                        <Route path="verified" element={<CreatorDashBoard />} />
                        <Route path="profile" element={<CreatorDashBoard />} />
                        <Route path="marketplace" element={<CreatorDashBoard />} />
                        <Route path="settings" element={<CreatorDashBoard />} />
                    </Route>
                    <Route path="/brand/*" element={<SideBarLayout />}>
                        <Route index element={<BrandDashBoard />} />
                        <Route path="verified" element={<BrandDashBoard />} />
                        <Route path="Shortlists" element={<BrandDashBoard />} />
                        <Route path="creators" element={<BrandDashBoard />} />
                        <Route path="campaigns" element={<BrandCampaigns />} />
                        <Route path="settings" element={<BrandSettings />} />
                    </Route>
                    <Route path="/creator-register" element={<CreatorRegister />} />
                    <Route path="/brand-register" element={<BrandRegister />} />
                    <Route path="/login" element={<NotFoundPage />} />
                    <Route path="*" element={<NotFoundPage />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
};

export default App;
