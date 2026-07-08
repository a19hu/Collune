import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminBrands() {
  return (
    <div>
      <AdminSectionHeader title="Brands" copy="Review brand registrations, company details, verification state, and account visibility." />
      <AdminTablePlaceholder
        columns={["Brand", "Industry", "Verification", "Campaigns"]}
        rows={[{ Brand: "No brands loaded", Industry: "Connect brand admin API", Verification: "-", Campaigns: "-" }]}
      />
    </div>
  );
}

export default AdminBrands;
