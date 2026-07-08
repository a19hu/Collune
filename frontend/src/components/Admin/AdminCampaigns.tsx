import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminCampaigns() {
  return (
    <div>
      <AdminSectionHeader title="Campaigns" copy="Monitor campaign submissions, status, applications, and brand activity." />
      <AdminTablePlaceholder
        columns={["Campaign", "Brand", "Recommended", "Applications"]}
        rows={[{ Campaign: "No campaigns loaded", Brand: "Connect campaign admin API", Recommended: "-", Applications: "-" }]}
      />
    </div>
  );
}

export default AdminCampaigns;
