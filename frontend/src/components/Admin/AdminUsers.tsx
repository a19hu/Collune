import { useEffect, useMemo, useState, type FormEvent } from "react";

import { createAdminUser, getAdminUsers } from "../../lib/authApi";
import type {
  AdminCreateUserPayload,
  AdminManagedUserItem,
  InternalUserRoleCode,
} from "../../types";
import { AdminPanel, AdminSectionHeader } from "./AdminUi";

const initialForm: AdminCreateUserPayload = {
  name: "",
  email: "",
  phone_no: "",
  password: "",
  role: "ADMIN",
  is_active: true,
};

function formatRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}

const ROLE_DETAILS = {
  SUPER_ADMIN: {
    label: "Super Admin",
    purpose: "Owner / Founder",
    description: "Full access, user management, billing, settings, delete, permissions, reports, API, and all modules.",
  },
  ADMIN: {
    label: "Admin",
    purpose: "Company Administrator",
    description: "Manage all modules except super-admin settings, create users, assign roles, and view reports.",
  },
  OPERATIONS_MANAGER: {
    label: "Operations Manager",
    purpose: "Daily Operations",
    description: "Manage projects, client assignments, approvals, reports, and day-to-day operations.",
  },
  SALES_MARKETING_MANAGER: {
    label: "Sales & Marketing Manager",
    purpose: "Sales & Marketing",
    description: "Handle CRM-style workflows, deals, campaigns, customer follow-up, and sales analytics.",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    purpose: "Project Delivery",
    description: "Create projects, assign work, track progress, approve delivery, and communicate with clients.",
  },
  ANALYTICS_MANAGER: {
    label: "Analytics Manager",
    purpose: "Reports & Insights",
    description: "Read-only dashboards, analytics exports, and insight access.",
  },
  TEAM_MEMBER: {
    label: "Team Member / Executive",
    purpose: "Employee",
    description: "Assigned project access, attendance, documents, and profile updates.",
  },
} satisfies Record<InternalUserRoleCode, { label: string; purpose: string; description: string }>;

const roleOptions = Object.entries(ROLE_DETAILS).map(([role, details]) => ({
  role: role as InternalUserRoleCode,
  ...details,
}));

export function AdminUsers() {
  const [users, setUsers] = useState<AdminManagedUserItem[]>([]);
  const [form, setForm] = useState<AdminCreateUserPayload>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedRoleTemplate = useMemo(
    () => roleOptions.find((template) => template.role === form.role) ?? null,
    [form.role],
  );

  useEffect(() => {
    let mounted = true;

    getAdminUsers()
      .then((userItems) => {
        if (!mounted) return;
        setUsers(userItems);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load admin user data.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function applyRoleTemplate(role: InternalUserRoleCode) {
    setForm((current) => ({
      ...current,
      role,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await createAdminUser({
        ...form,
        phone_no: form.phone_no?.trim() || "",
      });
      const refreshedUsers = await getAdminUsers();
      setUsers(refreshedUsers);
      setForm(initialForm);
      setSuccess(`User created successfully. Backend account role will appear as ADMIN; workspace role selected: ${formatRoleLabel(form.role)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <AdminSectionHeader
        title="Users"
      />
      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-black text-[#b42318]">{error}</p> : null}
      {success ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-[#067647]">{success}</p> : null}

      <form onSubmit={handleSubmit} className="mb-8">
        <AdminPanel className="p-6">
          <h3 className="text-lg font-black text-[#1d203a]">Create User</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-black text-[#465064]">
              Name
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="h-11 rounded-lg border border-[#d6def3] px-3 font-semibold text-[#1d203a]"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-[#465064]">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-11 rounded-lg border border-[#d6def3] px-3 font-semibold text-[#1d203a]"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-[#465064]">
              Phone
              <input
                value={form.phone_no}
                onChange={(event) => setForm((current) => ({ ...current, phone_no: event.target.value }))}
                className="h-11 rounded-lg border border-[#d6def3] px-3 font-semibold text-[#1d203a]"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-[#465064]">
              Password
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-11 rounded-lg border border-[#d6def3] px-3 font-semibold text-[#1d203a]"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:max-w-xs">
            <label className="grid gap-2 text-sm font-black text-[#465064]">
              Role
              <select
                value={form.role}
                onChange={(event) => applyRoleTemplate(event.target.value as InternalUserRoleCode)}
                className="h-11 rounded-lg border border-[#d6def3] bg-white px-3 font-semibold text-[#1d203a]"
              >
                {roleOptions.map((template) => (
                  <option key={template.role} value={template.role}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* <div className="mt-4 grid gap-4 md:max-w-xs">
            <label className="flex items-center gap-3 rounded-lg border border-[#d6def3] bg-[#f8faff] px-4 py-3 text-sm font-black text-[#1d203a]">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Active
            </label>
          </div> */}

          {selectedRoleTemplate ? (
            <div className="mt-5 rounded-2xl border border-[#dbe4fb] bg-[#f7f9ff] p-4">
              <p className="text-sm font-black text-[#1d203a]">{selectedRoleTemplate.label}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">{selectedRoleTemplate.purpose}</p>
              <p className="mt-2 text-sm font-semibold text-[#465064]">{selectedRoleTemplate.description}</p>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#657084]">Roles are now defined locally in the frontend.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2448bd] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#c6d1f1]"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </AdminPanel>
      </form>

      {isLoading ? <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">Loading users...</p> : null}
      {!isLoading ? (
        <div className="grid gap-4">
          {users.length ? (
            <AdminPanel className="overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[1100px]">
                  <div
                    className="grid border-b border-[#edf1fb] bg-[#f7f9ff] px-5 py-4 text-xs font-black uppercase text-[#657084]"
                    style={{ gridTemplateColumns: "1.2fr 0.95fr 1fr 0.85fr 0.85fr 2fr" }}
                  >
                    <span>User</span>
                    <span>Account Role</span>
                    <span>Phone</span>
                    <span>Status</span>
                    <span>Visibility</span>
                    <span>Permissions</span>
                  </div>
                  <div className="divide-y divide-[#edf1fb]">
                    {users.map((user) => (
                      (() => {
                        const permissions = user.permissions ?? [];
                        return (
                          <div
                            key={user.user_id}
                            className="grid items-start gap-3 px-5 py-4 text-sm text-[#334260]"
                            style={{ gridTemplateColumns: "1.2fr 0.95fr 1fr 0.85fr 0.85fr 2fr" }}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-black text-[#1d203a]">{user.name}</p>
                              <p className="truncate text-xs font-semibold text-[#7a8496]">{user.email}</p>
                            </div>
                            <span className="font-semibold">{formatRoleLabel(user.role)}</span>
                            <span className="font-semibold">{user.phone_no || "None"}</span>
                            <div className="grid gap-1 font-semibold">
                              <span>{user.is_active ? "Active" : "Inactive"}</span>
                              <span className="text-[#657084]">{user.verification_status}</span>
                            </div>
                            <span className="font-semibold">{user.is_profile_visible ? "Visible" : "Hidden"}</span>
                            <span className="font-semibold">
                              {permissions.length
                                ? `${permissions.length} assigned: ${permissions.map((permission) => permission.codename).join(", ")}`
                                : "No direct permissions"}
                            </span>
                          </div>
                        );
                      })()
                    ))}
                  </div>
                </div>
              </div>
            </AdminPanel>
          ) : (
            <AdminPanel className="p-5 text-sm font-black text-[#657084]">No users found.</AdminPanel>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default AdminUsers;
