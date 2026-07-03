import type { ReactNode } from "react";
import { Instagram, MoreVertical, Plus, Youtube, type LucideIcon } from "lucide-react";

import type { ShortlistCreator, ShortlistItem, ShortlistStatus } from "./shortlistData";

const statusClasses: Record<ShortlistStatus, string> = {
  Draft: "bg-[#dce9ff] text-[#2f6df6]",
  Submitted: "bg-[#dce9ff] text-[#2f6df6]",
};

const platformClasses: Record<ShortlistCreator["platform"], string> = {
  Instagram: "bg-[#d62976] text-white",
  YouTube: "bg-[#ff0000] text-white",
  LinkedIn: "bg-[#116bc1] text-white",
};

export function ShortlistPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#dfe5ee] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: ShortlistStatus }) {
  return (
    <span className={`inline-flex h-8 items-center rounded-lg px-4 text-sm font-black ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

export function IconTile({ icon: Icon, className, size = "h-12 w-12" }: { icon: LucideIcon; className: string; size?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ${size} ${className}`}>
      <Icon className="h-6 w-6" />
    </span>
  );
}

export function PrimaryButton({ children, onClick, variant = "solid" }: { children: ReactNode; onClick?: () => void; variant?: "solid" | "outline" | "ghost" }) {
  const classes = {
    solid: "bg-[#173ca8] text-white shadow-[0_8px_14px_rgba(23,60,168,0.18)]",
    outline: "border-2 border-[#173ca8] bg-white text-[#173ca8]",
    ghost: "bg-transparent text-[#173ca8]",
  };

  return (
    <button type="button" onClick={onClick} className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-7 text-sm font-black ${classes[variant]}`}>
      {children}
    </button>
  );
}

export function NewShortlistCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button type="button" onClick={onCreate} className="text-left">
      <ShortlistPanel className="grid min-h-[296px] place-items-center p-8 text-center transition hover:border-[#6a75ff] hover:shadow-sm">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ebe5ff] text-[#6a75ff]">
            <Plus className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-xl font-black text-black">New Shortlist</h2>
          <p className="mx-auto mt-4 max-w-[290px] text-base font-medium leading-snug text-[#6d7688]">
            Start building a list of creators you'd like Collune to reach out to.
          </p>
          <span className="mt-7 inline-flex text-base font-black text-[#7b83ff]">Create Shortlist</span>
        </div>
      </ShortlistPanel>
    </button>
  );
}

export function ShortlistCard({ item, onOpen }: { key?: string; item: ShortlistItem; onOpen: (item: ShortlistItem) => void }) {
  return (
    <ShortlistPanel className="min-h-[296px] p-6 transition hover:border-[#6a75ff] hover:shadow-sm">
      <div className="flex items-start justify-between">
        <button type="button" onClick={() => onOpen(item)}>
          <IconTile icon={item.icon} className={item.iconClassName} />
        </button>
        <button type="button" onClick={() => onOpen(item)} className="text-[#677386]" aria-label={`${item.title} options`}>
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <button type="button" onClick={() => onOpen(item)} className="mt-7 block text-left">
        <h2 className="text-[22px] font-black leading-tight text-black">{item.title}</h2>
      </button>
      <p className="mt-4 text-base font-medium text-[#6d7688]">{item.creators.length} Creators</p>
      <div className="mt-5">
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-8 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[#6d7688]">{item.updatedAt}</span>
        <button type="button" onClick={() => onOpen(item)} className="inline-flex items-center gap-2 text-sm font-black text-[#7b83ff]">
          {item.status === "Draft" ? "Continue" : "View Shortlist"} -&gt;
        </button>
      </div>
    </ShortlistPanel>
  );
}

export function EditableInfoPanel({
  title,
  optional,
  value,
  editing,
  onEdit,
  onChange,
}: {
  title: string;
  optional?: boolean;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <ShortlistPanel className="min-h-[220px] p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-black text-[#333b4a]">
          {title} {optional ? <span className="text-[#98a1b1]">(Optional)</span> : null}
        </h2>
        <button type="button" onClick={onEdit} className="text-sm font-black text-[#7b83ff]">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-4 h-32 w-full resize-none rounded-lg border border-[#dfe5ee] px-4 py-3 text-[15px] font-medium leading-relaxed text-[#333b4a] outline-none focus:border-[#6a75ff] focus:ring-4 focus:ring-[#6a75ff]/10"
        />
      ) : (
        <p className="mt-4 text-[15px] font-medium leading-relaxed text-[#6d7688]">{value || "No notes added yet."}</p>
      )}
    </ShortlistPanel>
  );
}

export function PlatformIcon({ platform }: { key?: string; platform: ShortlistCreator["platform"] }) {
  return (
    <span className={`grid h-8 w-8 place-items-center rounded-lg ${platformClasses[platform]}`}>
      {platform === "Instagram" ? <Instagram className="h-4 w-4" /> : platform === "YouTube" ? <Youtube className="h-4 w-4" /> : <span className="text-sm font-black">in</span>}
    </span>
  );
}

export function CreatorCard({ creator, onRemove }: { key?: string; creator: ShortlistCreator; onRemove: (id: string) => void }) {
  return (
    <ShortlistPanel className="min-w-[220px] overflow-hidden">
      <div className="relative aspect-[1.08/1] bg-[#eef2f7]">
        <img src={creator.image} alt={creator.name} className="h-full w-full object-cover" />
        <span className="absolute left-4 top-4">
          <PlatformIcon platform={creator.platform} />
        </span>
        <button type="button" onClick={() => onRemove(creator.id)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#667085]" aria-label={`Remove ${creator.name}`}>
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-black leading-tight text-[#333b4a]">{creator.name}</h3>
        <p className="mt-1 text-sm font-medium text-[#6d7688]">{creator.category}</p>
        <p className="mt-4 text-sm font-medium text-[#6d7688]">
          {creator.followers} Followers{creator.engagement} Eng. Rate
        </p>
        <p className="mt-3 text-sm font-black text-[#7b83ff]">{creator.added}</p>
      </div>
    </ShortlistPanel>
  );
}

export function ActivityRow({ icon: Icon, color, title, time }: { key?: string; icon: LucideIcon; color: string; title: string; time: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className={`grid h-10 w-10 place-items-center rounded-full ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium text-[#333b4a]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#7d8797]">{time}</p>
      </div>
    </div>
  );
}
