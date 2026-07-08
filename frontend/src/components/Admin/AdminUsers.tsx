import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminUsers() {
  return (
    <div>
      <AdminSectionHeader title="Users" copy="Manage all platform accounts across admin, creator, and brand roles." />
      <AdminTablePlaceholder
        columns={["Name", "Email", "Role", "Status"]}
        rows={[{ Name: "No users loaded", Email: "Connect admin users API", Role: "-", Status: "-" }]}
      />
    </div>
  );
}

export default AdminUsers;
