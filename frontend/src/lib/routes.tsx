import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import LoadingPage from "../components/layout/LoadingPage";
import React from "react";
import { TeacherPortal } from "../components/TeacherPortal";
import { StudentPortal } from "../components/StudentPortal";


export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser, isAuthLoading } = useAuth();

    if (isAuthLoading) return <LoadingPage />;
    if (!currentUser) return <Navigate to="/login" replace />;

    return <>{children}</>;
};


export const DashboardRouter = () => {
    const { currentUser } = useAuth();

    switch (currentUser.role) {
        case 'Teacher':
            return (
                <TeacherPortal />
            );
        case 'Student':
            return (
                <StudentPortal />
            );
        default:
            return (
                <StudentPortal />
            );
    }
}

export const protectedDashboardPage =
        <ProtectedRoute>
            <DashboardRouter />
        </ProtectedRoute>

