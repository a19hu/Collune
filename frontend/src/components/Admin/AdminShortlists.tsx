import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminShortlists() {
  return (
    <div>
      <AdminSectionHeader title="Shortlists" copy="Track brand shortlists, selected creators, submission status, and moderation needs." />
      <AdminTablePlaceholder
        columns={["Shortlist", "Brand", "Status", "Creators"]}
        rows={[{ Shortlist: "No shortlists loaded", Brand: "Connect shortlist admin API", Status: "-", Creators: "-" }]}
      />
    </div>
  );
}

export default AdminShortlists;
