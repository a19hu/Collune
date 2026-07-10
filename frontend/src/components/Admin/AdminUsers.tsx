import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";

import { createAdminUser, getAdminPermissions, getAdminUsers } from "../../lib/authApi";
import type { AdminCreateUserPayload, AdminManagedUserItem, AdminPermissionItem } from "../../types";
import { AdminPanel, AdminSectionHeader } from "./AdminUi";

const initialForm: AdminCreateUserPayload = {
  name: "",
  email: "",
  phone_no: "",
  password: "",
  role: "ADMIN",
  permissions: [],
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminManagedUserItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([]);
  const [form, setForm] = useState<AdminCreateUserPayload>(initialForm);
  const [availableSelection, setAvailableSelection] = useState<number[]>([]);
  const [chosenSelection, setChosenSelection] = useState<number[]>([]);
  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const deferredAvailableFilter = useDeferredValue(availableFilter);
  const deferredChosenFilter = useDeferredValue(chosenFilter);

  useEffect(() => {
    let mounted = true;

    Promise.all([getAdminUsers(), getAdminPermissions()])
      .then(([userItems, permissionItems]) => {
        if (!mounted) return;
        setUsers(userItems);
        setPermissions(permissionItems);
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

  const selectedIds = useMemo(() => new Set(form.permissions), [form.permissions]);
  const availablePermissions = useMemo(() => {
    return permissions.filter((permission) => {
      if (selectedIds.has(permission.id)) return false;
      if (!deferredAvailableFilter.trim()) return true;
      const haystack = `${permission.app_label} ${permission.model} ${permission.name} ${permission.codename}`.toLowerCase();
      return haystack.includes(deferredAvailableFilter.trim().toLowerCase());
    });
  }, [permissions, selectedIds, deferredAvailableFilter]);
  const chosenPermissions = useMemo(() => {
    return permissions.filter((permission) => {
      if (!selectedIds.has(permission.id)) return false;
      if (!deferredChosenFilter.trim()) return true;
      const haystack = `${permission.app_label} ${permission.model} ${permission.name} ${permission.codename}`.toLowerCase();
      return haystack.includes(deferredChosenFilter.trim().toLowerCase());
    });
  }, [permissions, selectedIds, deferredChosenFilter]);

  function moveToChosen() {
    if (!availableSelection.length) return;
    setForm((current) => ({
      ...current,
      permissions: Array.from(new Set([...current.permissions, ...availableSelection])),
    }));
    setAvailableSelection([]);
  }

  function moveToAvailable() {
    if (!chosenSelection.length) return;
    const removeIds = new Set(chosenSelection);
    setForm((current) => ({
      ...current,
      permissions: current.permissions.filter((id) => !removeIds.has(id)),
    }));
    setChosenSelection([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const user = await createAdminUser({
        ...form,
        phone_no: form.phone_no?.trim() || "",
      });
      setUsers((current) => [user, ...current]);
      setForm(initialForm);
      setAvailableSelection([]);
      setChosenSelection([]);
      setAvailableFilter("");
      setChosenFilter("");
      setSuccess("User created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <AdminSectionHeader title="Users" copy="Create internal users, assign the admin role, and attach Django permissions for feature access." />
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
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminCreateUserPayload["role"] }))}
                className="h-11 rounded-lg border border-[#d6def3] bg-white px-3 font-semibold text-[#1d203a]"
              >
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-black text-[#1d203a]">Available user permissions</p>
                <input
                  value={availableFilter}
                  onChange={(event) => setAvailableFilter(event.target.value)}
                  placeholder="Filter"
                  className="mt-2 h-10 w-full rounded-lg border border-[#d6def3] px-3 text-sm font-semibold text-[#1d203a]"
                />
              </div>
              <select
                multiple
                size={14}
                value={availableSelection.map(String)}
                onChange={(event) =>
                  setAvailableSelection(Array.from(event.currentTarget.selectedOptions, (option: HTMLOptionElement) => Number(option.value)))
                }
                className="min-h-[320px] rounded-xl border border-[#d6def3] bg-white p-3 text-sm font-semibold text-[#243a73]"
              >
                {availablePermissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.app_label} | {permission.model} | {permission.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={moveToChosen}
                className="rounded-lg border border-[#cdd8f2] bg-white px-4 py-2 text-sm font-black text-[#2448bd]"
              >
                Choose
              </button>
              <button
                type="button"
                onClick={moveToAvailable}
                className="rounded-lg border border-[#cdd8f2] bg-white px-4 py-2 text-sm font-black text-[#2448bd]"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <p className="text-sm font-black text-[#1d203a]">Chosen user permissions</p>
                <input
                  value={chosenFilter}
                  onChange={(event) => setChosenFilter(event.target.value)}
                  placeholder="Filter"
                  className="mt-2 h-10 w-full rounded-lg border border-[#d6def3] px-3 text-sm font-semibold text-[#1d203a]"
                />
              </div>
              <select
                multiple
                size={14}
                value={chosenSelection.map(String)}
                onChange={(event) =>
                  setChosenSelection(Array.from(event.currentTarget.selectedOptions, (option: HTMLOptionElement) => Number(option.value)))
                }
                className="min-h-[320px] rounded-xl border border-[#d6def3] bg-white p-3 text-sm font-semibold text-[#243a73]"
              >
                {chosenPermissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.app_label} | {permission.model} | {permission.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#657084]">
              Selected permissions: <span className="font-black text-[#1d203a]">{form.permissions.length}</span>
            </p>
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
        <AdminPanel className="overflow-hidden">
          <div className="grid border-b border-[#edf1fb] bg-[#f7f9ff] px-5 py-4 text-xs font-black uppercase text-[#657084]" style={{ gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 1.6fr" }}>
            <span>User</span>
            <span>Role</span>
            <span>Visibility</span>
            <span>Status</span>
            <span>Permissions</span>
          </div>
          <div className="divide-y divide-[#edf1fb]">
            {users.length ? users.map((user) => (
              <div key={user.user_id} className="grid gap-3 px-5 py-4 text-sm text-[#334260]" style={{ gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 1.6fr" }}>
                <div className="min-w-0">
                  <p className="truncate font-black text-[#1d203a]">{user.name}</p>
                  <p className="truncate text-xs font-semibold text-[#7a8496]">{user.email}</p>
                </div>
                <span className="font-semibold">{user.role}</span>
                <span className="font-semibold">{user.is_profile_visible ? "Visible" : "Hidden"}</span>
                <span className="font-semibold">{user.verification_status}</span>
                <span className="truncate font-semibold">
                  {user.permissions.length
                    ? `${user.permissions.length} assigned: ${user.permissions.slice(0, 3).map((permission) => permission.codename).join(", ")}${user.permissions.length > 3 ? "..." : ""}`
                    : "No direct permissions"}
                </span>
              </div>
            )) : (
              <div className="px-5 py-4 text-sm font-black text-[#657084]">No users found.</div>
            )}
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}

export default AdminUsers;
