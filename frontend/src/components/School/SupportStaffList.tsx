import { getStaff, type StaffApi } from "@/src/lib/authApi";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SupportStaffList = () => {
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffApi[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadStaff = async () => {
            try {
                const response = await getStaff();
                if (isMounted) setStaff(response.staff);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadStaff();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredStaff = staff.filter((staffMember) => {
        const value = `${staffMember.user.name} ${staffMember.user.email} ${staffMember.employee_id} ${staffMember.department} ${staffMember.designation}`.toLowerCase();
        return value.includes(search.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Staff Directory</h1>
                <p className="text-slate-500 text-xs">Manage non-teaching staff, departments, and operational contacts.</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, employee ID, department, or designation..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                <th className="p-4">Staff Member</th>
                                <th className="p-4">Employee ID</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Designation</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-4 text-slate-400">Loading support staff...</td></tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-slate-400">No support staff found.</td></tr>
                            ) : filteredStaff.map((staffMember) => (
                                <tr key={staffMember.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-4">
                                        <div className="font-extrabold text-slate-900">{staffMember.user.name || staffMember.user.username}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{staffMember.user.email}</div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-indigo-600">{staffMember.employee_id}</td>
                                    <td className="p-4">{staffMember.department || "Administration"}</td>
                                    <td className="p-4">{staffMember.designation || "Staff"}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${staffMember.status ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                            {staffMember.status ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => navigate(`/admin/staff/${staffMember.id}`)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                                        >
                                            Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SupportStaffList;
