import { useAuth } from "@/src/contexts/AuthContext";
import LogoutPart from "../layout/LogoutPart";
import { useState, useEffect } from "react";
import { getSchoolProfile } from "@/src/lib/authApi";
import { Award, BookOpen, Building2, ClipboardList, Clock, DollarSign, UserCheck, UserPlus, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type SchoolProfileState = Awaited<ReturnType<typeof getSchoolProfile>> | null;

const SchoolSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser } = useAuth();
    const [schoolProfileForm, setSchoolProfileForm] = useState<SchoolProfileState>(null)

    const navItems = [
        { id: 'Overview', label: 'Admin Hub', icon: Building2, route: '/admin' },
        { id: 'Students', label: 'Students List', icon: Users, route: '/admin/students' },
        { id: 'Teachers', label: 'Instructors', icon: BookOpen, route: '/admin/teachers' },
        { id: 'Staff', label: 'Support Staff', icon: Users, route: '/admin/staff' },
        { id: 'Attendance', label: 'Attendance', icon: UserCheck, route: '/admin/attendance' },
        { id: 'Exams', label: 'Exam Timetables', icon: Award, route: '/admin/exams' },
        { id: 'Fees', label: 'Settle Fees', icon: DollarSign, route: '/admin/fees' },
        { id: 'Settings', label: 'Workspace settings', icon: Clock, route: '/admin/settings' }
    ];

    const admissionItems = [
        { id: 'Inquiry', label: 'Student Inquiry', icon: ClipboardList, route: '/admin/admissions/inquiries' },
        { id: 'Registration', label: 'New Registration', icon: UserPlus, route: '/admin/admissions/register' },
    ];

    const teamSetupItems = [
        { id: 'AddTeacher', label: 'Add Instructor', icon: BookOpen, route: '/admin/add/teachers_new' },
        { id: 'AddStaff', label: 'Add Staff', icon: UserPlus, route: '/admin/add/staff_new' },
    ];

    const renderNavItem = (tab: typeof navItems[number]) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.route || (tab.route !== '/admin' && location.pathname.startsWith(tab.route));
        return (
            <button
                id={`school-tab-${tab.id.toLowerCase()}`}
                key={tab.id}
                onClick={() => navigate(tab.route)}
                className={`w-full py-2 px-3 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${isActive
                        ? 'bg-indigo-600 bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
            </button>
        );
    };

    useEffect(() => {
        const loadSchoolProfile = async () => {
            try {
                const res = await getSchoolProfile();
                setSchoolProfileForm(res);
            } catch (error) {
                console.error('Error fetching school profile:', error);
            }
        }
        loadSchoolProfile();

    }, []);

    return (
        <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 p-5 flex flex-col justify-between text-white md:sticky md:top-0 md:h-screen">
            <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white">
                        {schoolProfileForm?.school.logo ? (
                            <img referrerPolicy="no-referrer" src={schoolProfileForm.school.logo} alt="School logo" className="w-7 h-7 rounded-full border border-white/10" />
                        ) : (
                            <Building2 className="w-7 h-7" />
                        )}
                    </div>
                    <div className="text-left overflow-hidden">
                        <h2 className="text-sm font-extrabold truncate">{schoolProfileForm?.school.school_name || 'School Admin'}</h2>
                        <div className="text-[10px] font-mono text-indigo-400 font-bold truncate">Campus: {schoolProfileForm?.school.short_name || 'ADMIN'}</div>
                    </div>
                </div>

                <nav className="space-y-1 text-left text-xs font-semibold font-mono tracking-wide">
                    {navItems.map(renderNavItem)}
                </nav>

                <div className="pt-4 border-t border-slate-800">
                    <p className="px-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-mono text-left">
                        Team Setup
                    </p>
                    <nav className="space-y-1 text-left text-xs font-semibold font-mono tracking-wide">
                        {teamSetupItems.map(renderNavItem)}
                    </nav>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <p className="px-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-mono text-left">
                        Admissions
                    </p>
                    <nav className="space-y-1 text-left text-xs font-semibold font-mono tracking-wide">
                        {admissionItems.map(renderNavItem)}
                    </nav>
                </div>
            </div>
            <LogoutPart currentUser={currentUser} />
        </aside>

    );
}

export default SchoolSidebar;
