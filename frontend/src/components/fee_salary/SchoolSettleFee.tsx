import { DollarSign, ReceiptText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SchoolSettleFee = () => {
    const navigate = useNavigate();
    const links = [
        { label: "Student Fees", desc: "View student fee accounts and balances", route: "/admin/fees/students", icon: DollarSign },
        { label: "Teacher Salary", desc: "View teacher salary payment records", route: "/admin/fees/teachers", icon: ReceiptText },
        { label: "Staff Salary", desc: "View staff salary payment records", route: "/admin/fees/staff", icon: Users },
    ];

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Desk</h1>
                <p className="text-slate-500 text-xs">Open student fees, teacher salary, or staff salary modules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <button
                            key={link.route}
                            onClick={() => navigate(link.route)}
                            className="bg-white border border-slate-200 rounded-2xl p-5 text-left shadow-sm hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                        >
                            <Icon className="w-5 h-5 text-indigo-600" />
                            <div className="font-black text-slate-900 mt-3">{link.label}</div>
                            <div className="text-xs text-slate-500 mt-1">{link.desc}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default SchoolSettleFee;
