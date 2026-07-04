import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpDown, Check, Edit3, MoreVertical, Plus, Search, Send } from "lucide-react";

import {
  ActivityRow,
  CreatorCard,
  EditableInfoPanel,
  IconTile,
  PlatformIcon,
  PrimaryButton,
  ShortlistPanel,
  StatusBadge,
} from "./ShortlistUi";
import type { ShortlistItem } from "./shortlistData";
import { useNavigate } from "react-router-dom";

export function ShortlistDetail({
  shortlist,
  search,
  isPurposeEditing,
  isNotesEditing,
  isOrderReversed,
  onBack,
  onDiscover,
  onSearch,
  onEditPurpose,
  onEditNotes,
  onPurposeChange,
  onNotesChange,
  onSave,
  onSubmit,
  onToggleOrder,
  onRemoveCreator,
}: {
  shortlist: ShortlistItem;
  search: string;
  isPurposeEditing: boolean;
  isNotesEditing: boolean;
  isOrderReversed: boolean;
  onBack: () => void;
  onDiscover: () => void;
  onSearch: (value: string) => void;
  onEditPurpose: () => void;
  onEditNotes: () => void;
  onPurposeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onSubmit: () => void;
  onToggleOrder: () => void;
  onRemoveCreator: (id: string) => void;
}) {
  const navigate = useNavigate()
  const visibleCreators = shortlist.creators
    .filter((creator) => `${creator.name} ${creator.category}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => isOrderReversed ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  const activityItems = [
    {
      icon: Check,
      color: "bg-[#dbeafe] text-[#2f6df6]",
      title: "Shortlist created",
      time: shortlist.createdAt,
    },
    {
      icon: Edit3,
      color: "bg-[#fff0dd] text-[#e67600]",
      title: "Shortlist updated",
      time: shortlist.updatedAt,
    },
    ...(shortlist.status === "Submitted"
      ? [{
        icon: Send,
        color: "bg-[#ccf8e0] text-[#009b67]",
        title: "You submitted this shortlist to Collune",
        time: shortlist.updatedAt,
      }]
      : []),
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-6">
          <IconTile icon={shortlist.icon} className={shortlist.iconClassName} size="h-20 w-20" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-[34px] font-black leading-tight tracking-normal text-[#333b4a]">{shortlist.title}</h1>
              <StatusBadge status={shortlist.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-medium text-[#657084]">
              <span>{shortlist.creators.length} Creators</span>
              <span>•</span>
              <span>Created on {shortlist.createdAt}</span>
              <span>•</span>
              <span>{shortlist.updatedAt}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/brand/shortlists/${shortlist.id}/edit`)}
                type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-5 text-sm font-black text-[#303948]">
                <Edit3 className="h-4 w-4" />
                Edit Shortlist
              </button>
            </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <EditableInfoPanel
          title="Purpose"
          value={shortlist.purpose}
          editing={isPurposeEditing}
          onEdit={onEditPurpose}
          onChange={onPurposeChange}
        />
        <EditableInfoPanel
          title="Notes for Collune"
          optional
          value={shortlist.notes}
          editing={isNotesEditing}
          onEdit={onEditNotes}
          onChange={onNotesChange}
        />
        <ShortlistPanel className="min-h-[220px] p-6">
          <h2 className="text-lg font-black text-[#333b4a]">Status</h2>
          <p className="mt-5 text-[15px] font-medium leading-relaxed text-[#6d7688]">
            This shortlist is in {shortlist.status.toLowerCase()} mode. Add creators and submit to Collune when you're ready.
          </p>
          {
            shortlist.status === "Submitted" ?
            <button type="button" disabled className="mt-5 h-12 w-full rounded-lg bg-[#173ca8] text-sm font-black text-white">
            Submitted
          </button> :
            <button type="button" onClick={onSubmit} className="mt-5 h-12 w-full rounded-lg bg-[#173ca8] text-sm font-black text-white">
            Submit to Collune
          </button>
          }
          
          {/* <button type="button" onClick={onSave} className="mt-4 w-full text-sm font-black text-[#173ca8]">
            Save Changes
          </button> */}
        </ShortlistPanel>
      </div>

      <ShortlistPanel className="grid gap-6 p-6 md:grid-cols-5">
        <SummaryField label="Target Platforms">
          <div className="flex gap-2">
            {shortlist.platforms.map((platform) => <PlatformIcon key={platform} platform={platform} />)}
          </div>
        </SummaryField>
        <SummaryField label="Categories">{shortlist.categories}</SummaryField>
        <SummaryField label="Audience">{shortlist.audience}</SummaryField>
        <SummaryField label="Budget Range">{shortlist.budgetRange}</SummaryField>
        <SummaryField label="Campaign Timeline">{shortlist.timeline}</SummaryField>
      </ShortlistPanel>

      <section>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-black tracking-normal text-[#333b4a]">Creators in this Shortlist ({shortlist.creators.length})</h2>
            <p className="mt-6 text-base font-medium text-[#6d7688]">These are the creators you've added to this shortlist.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8797]" />
              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search creators..."
                className="h-10 w-[260px] rounded-lg border border-[#dfe5ee] pl-11 pr-4 text-sm font-medium outline-none focus:border-[#6a75ff] focus:ring-4 focus:ring-[#6a75ff]/10"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {visibleCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
          {visibleCreators.length === 0 ? (
            <ShortlistPanel className="grid min-h-[260px] place-items-center p-8 text-center xl:col-span-2">
              <div>
                <Search className="mx-auto h-8 w-8 text-[#7b83ff]" />
                <h3 className="mt-4 text-lg font-black text-[#333b4a]">No creators found</h3>
                <p className="mt-2 text-sm font-medium text-[#6d7688]">Try a different search or discover more creators.</p>
                <button type="button" onClick={onDiscover} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#173ca8] px-5 text-sm font-black text-white">
                  <Plus className="h-4 w-4" />
                  Add Creators
                </button>
              </div>
            </ShortlistPanel>
          ) : null}
        </div>
      </section>

      <section className="pb-8">
        <h2 className="text-[26px] font-black tracking-normal text-[#333b4a]">Activity</h2>
        <div className="mt-7 grid gap-5">
          {activityItems.map((item) => <ActivityRow key={item.title} {...item} />)}
        </div>
      </section>
    </div>
  );
}

function SummaryField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-black text-[#747f91]">{label}</p>
      <div className="mt-4 text-base font-medium text-[#333b4a]">{children}</div>
    </div>
  );
}