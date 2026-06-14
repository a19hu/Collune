import { Outlet } from "react-router-dom";
import SchoolSidebar from "./SchoolSidebar";

const AdminLayout = () => {
    return (
        <div className="bg-slate-50 h-screen overflow-hidden text-slate-800 flex flex-col md:flex-row font-sans selection:bg-indigo-600 selection:text-white">
            <SchoolSidebar />
            <main className="flex-1 h-full p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
