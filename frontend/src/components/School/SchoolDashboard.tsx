import { useAuth } from "@/src/contexts/AuthContext";
import { getClasses, getStaff, getStudents, getTeachers } from "@/src/lib/authApi";
import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { useEffect, useState } from "react";

const SchoolDashboard = () => {
    const { currentUser } = useAuth();
    const [counts, setCounts] = useState({
        students: 0,
        teachers: 0,
        staff: 0,
        classes: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadOverview = async () => {
            try {
                const [studentsRes, teachersRes, staffRes, classesRes] = await Promise.allSettled([
                    getStudents(),
                    getTeachers(),
                    getStaff(),
                    getClasses(),
                ]);

                if (!isMounted) return;
                setCounts({
                    students: studentsRes.status === "fulfilled" ? studentsRes.value.students.length : 0,
                    teachers: teachersRes.status === "fulfilled" ? teachersRes.value.teachers.length : 0,
                    staff: staffRes.status === "fulfilled" ? staffRes.value.staff.filter((item) => item.status).length : 0,
                    classes: classesRes.status === "fulfilled" ? classesRes.value.classes.length : 0,
                });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadOverview();

        return () => {
            isMounted = false;
        };
    }, []);

    const tiles = [
        { label: "Enrolled Students", value: counts.students, desc: "Active records", icon: GraduationCap, color: "text-indigo-600" },
        { label: "Class Instructors", value: counts.teachers, desc: "Teacher profiles", icon: BookOpen, color: "text-cyan-600" },
        { label: "Operational Staff", value: counts.staff, desc: "Active support team", icon: Users, color: "text-blue-600" },
        { label: "Class Formations", value: counts.classes, desc: "Configured classes", icon: Layers, color: "text-teal-600" },
    ];

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Active Campus Desk</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                    Welcome Back, {currentUser?.name?.split(" (")[0] || "Admin"}
                </h1>
                <p className="text-slate-500 text-xs">Manage student records, instructors, support staff, and academic setup.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {tiles.map((tile) => {
                    const Icon = tile.icon;
                    return (
                        <div key={tile.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{tile.label}</div>
                                    <div className={`text-xl font-extrabold ${tile.color} mt-1`}>{isLoading ? "..." : tile.value}</div>
                                </div>
                                <Icon className={`w-5 h-5 ${tile.color}`} />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2">{tile.desc}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-2">
                    Daily ERP Logs
                </h3>
                <div className="space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-400">Student Directory:</span>
                        <span className="text-emerald-600 font-bold">Connected to live student API</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-slate-400">Staff Records:</span>
                        <span className="text-slate-700">Teacher and support staff modules ready</span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                        <span className="text-slate-400">Exam Timetable:</span>
                        <span className="text-indigo-600 font-bold">Exam timetable route configured</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SchoolDashboard;
