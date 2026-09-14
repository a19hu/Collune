import React from 'react';
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/permissions/PermissionGuard';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { RolesPage } from './pages/roles/RolesPage';
import { CreatorsPage } from './pages/creators/CreatorsPage';
import { CreatorDetailPage } from './pages/creators/CreatorDetailPage';
import { BrandsPage } from './pages/brands/BrandsPage';
import { BrandDetailPage } from './pages/brands/BrandDetailPage';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import { CampaignDetailPage } from './pages/campaigns/CampaignDetailPage';
import { ShortlistsPage } from './pages/shortlists/ShortlistsPage';
import { ShortlistDetailPage } from './pages/shortlists/ShortlistDetailPage';
// import { ExportsPage } from './pages/exports/ExportsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Wrapper for User Detail route to extract params
const UserDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <UserDetailPage userId={id || '1'} onRouteChange={(r) => navigate(r)} />;
};

// Wrapper for Creator Detail route
const CreatorDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <CreatorDetailPage creatorId={id || '1'} onRouteChange={(r) => navigate(r)} />;
};

// Wrapper for Brand Detail route
const BrandDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <BrandDetailPage brandId={id || '1'} onRouteChange={(r) => navigate(r)} />;
};

// Wrapper for Campaign Detail route
const CampaignDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <CampaignDetailPage campaignId={id || '1'} onRouteChange={(r) => navigate(r)} />;
};

// Wrapper for Shortlist Detail route
const ShortlistDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <ShortlistDetailPage shortlistId={id || '1'} onRouteChange={(r) => navigate(r)} />;
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Public login screen — rendered without the admin chrome (sidebar/topbar).
  if (location.pathname === '/login') {
    return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />;
  }

  if (location.pathname === '/forgot-password') {
    return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <ForgotPasswordPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout
      activeRoute={location.pathname}
      currentRoute={location.pathname}
      onRouteChange={(path) => navigate(path)}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute permission="dashboard.view">
              <DashboardPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />

        {/* Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute permission="users.view">
              <UsersPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute permission="users.view">
              <UserDetailWrapper />
            </ProtectedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute permission="roles.view">
              <RolesPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />

        {/* Creators */}
        <Route
          path="/admin/creators"
          element={
            <ProtectedRoute permission="creators.view">
              <CreatorsPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/creators/:id"
          element={
            <ProtectedRoute permission="creators.view">
              <CreatorDetailWrapper />
            </ProtectedRoute>
          }
        />

        {/* Brands */}
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute permission="brands.view">
              <BrandsPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands/:id"
          element={
            <ProtectedRoute permission="brands.view">
              <BrandDetailWrapper />
            </ProtectedRoute>
          }
        />

        {/* Campaigns */}
        <Route
          path="/admin/campaigns"
          element={
            <ProtectedRoute permission="campaigns.view">
              <CampaignsPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaigns/:id"
          element={
            <ProtectedRoute permission="campaigns.view">
              <CampaignDetailWrapper />
            </ProtectedRoute>
          }
        />

        {/* Shortlists */}
        <Route
          path="/admin/shortlists"
          element={
            <ProtectedRoute permission="shortlists.view">
              <ShortlistsPage onRouteChange={(r) => navigate(r)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shortlists/:id"
          element={
            <ProtectedRoute permission="shortlists.view">
              <ShortlistDetailWrapper />
            </ProtectedRoute>
          }
        />
        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppShell />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
