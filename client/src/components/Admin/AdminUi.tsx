import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#dfe5ee] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
      {children}
    </section>
  );
}

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  copy,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  copy: string;
}) {
  return (
    <AdminPanel className="min-h-[190px] p-6">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#e8eeff] text-[#3158ca]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-5 text-sm font-black text-[#657084]">{label}</p>
      <strong className="mt-2 block text-[34px] font-black leading-none text-[#1d203a]">{value}</strong>
      <p className="mt-3 text-sm font-medium leading-snug text-[#7a8496]">{copy}</p>
    </AdminPanel>
  );
}

export function AdminSectionHeader({ title, copy }: { title: string; copy?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[26px] font-black tracking-normal text-[#1d203a]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#657084]">{copy}</p>
    </div>
  );
}

export function AdminTablePlaceholder({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, string>>;
}) {
  const gridTemplateColumns = `repeat(${columns.length}, minmax(180px, 1fr))`;

  return (
    <AdminPanel className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid border-b border-[#edf1fb] bg-[#f7f9ff] px-5 py-4 text-xs font-black uppercase text-[#657084]" style={{ gridTemplateColumns }}>
            {columns.map((column) => <span key={column} className="pr-4">{column}</span>)}
          </div>
          <div className="divide-y divide-[#edf1fb]">
            {rows.map((row, index) => (
              <div key={index} className="grid px-5 py-4 text-sm font-semibold text-[#334260]" style={{ gridTemplateColumns }}>
                {columns.map((column) => <span key={column} className="pr-4">{row[column] || "-"}</span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}
