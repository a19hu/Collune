import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminCreators() {
  return (
    <div>
      <AdminSectionHeader title="Creators" copy="Review creator profiles, verification status, visibility, and social account readiness." />
      <AdminTablePlaceholder
        columns={["Creator", "Category", "Verification", "Visibility"]}
        rows={[{ Creator: "No creators loaded", Category: "Connect creator admin API", Verification: "-", Visibility: "-" }]}
      />
    </div>
  );
}

export default AdminCreators;
