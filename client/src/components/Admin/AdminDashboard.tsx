import { BadgeCheck, Building2, FileText, ListChecks, Users } from "lucide-react";
import { AdminMetricCard, AdminPanel, AdminSectionHeader } from "./AdminUi";

export function AdminDashboard() {
  return (
    <div>
      <AdminSectionHeader title="Admin Dashboard" copy="Overview of Collune users, verification queues, campaigns, and shortlists." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard icon={Users} label="Users" value="0" copy="All platform accounts" />
        <AdminMetricCard icon={BadgeCheck} label="Creators" value="0" copy="Creator profiles" />
        <AdminMetricCard icon={Building2} label="Brands" value="0" copy="Brand profiles" />
        <AdminMetricCard icon={FileText} label="Campaigns" value="0" copy="Campaign records" />
        <AdminMetricCard icon={ListChecks} label="Shortlists" value="0" copy="Brand shortlists" />
      </div>
      <AdminPanel className="mt-8 p-7">
        <h3 className="text-xl font-black text-[#1d203a]">Review Queue</h3>
        <p className="mt-2 text-sm font-medium text-[#657084]">Verification and moderation queues will appear here once admin APIs are connected.</p>
      </AdminPanel>
    </div>
  );
}

export default AdminDashboard;
