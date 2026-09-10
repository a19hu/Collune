import { Link } from "react-router-dom";
import type { CreatorListItemApi } from "../../types";

function numberLabel(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "Not provided";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}` : "Not provided";
}

function dateLabel(value?: string | null) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not provided";
}

const rows: { label: string; value: (creator: CreatorListItemApi) => string }[] = [
  { label: "Category", value: (creator) => creator.category || "Not provided" },
  { label: "Verification", value: (creator) => creator.verified ? "Verified" : "Not verified" },
  { label: "Total followers", value: (creator) => numberLabel(creator.total_followers) },
  { label: "Average engagement", value: (creator) => numberLabel(creator.avg_eng_rate, "%") },
  { label: "Platforms / followers", value: (creator) => creator.platform_data?.map((platform) => `${platform.name}: ${numberLabel(platform.followers)}`).join("\n") || "Not provided" },
  { label: "Location", value: (creator) => [creator.city, creator.state, creator.country].filter(Boolean).join(", ") || creator.location || "Not provided" },
  { label: "Languages", value: (creator) => creator.languages?.join(", ") || "Not provided" },
  { label: "Works with", value: (creator) => creator.work_with?.join(", ") || "Not provided" },
  { label: "Last active", value: (creator) => creator.is_online ? "Online now" : dateLabel(creator.last_active_at) },
  { label: "Joined", value: (creator) => dateLabel(creator.created_at) },
];

export function CreatorComparison({ creators, onRemove }: { creators: CreatorListItemApi[]; onRemove: (creatorId: string) => void }) {
  return (
    <div role="region" aria-label="Creator comparison table" tabIndex={0} className="mt-4 max-h-[65vh] overflow-auto rounded-xl border border-[#d8e2fb] bg-white focus-visible:outline-2 focus-visible:outline-[#1438c8]">
      <table className="w-full border-separate border-spacing-0 text-left text-sm text-[#334260]">
        <caption className="sr-only">Side-by-side comparison of {creators.length} creators. Scroll horizontally to view all creators.</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-30 min-w-40 border-b border-r border-[#d8e2fb] bg-[#eef2ff] p-4">Compare creators</th>
            {creators.map((creator) => (
              <th key={creator.creator_id} scope="col" className="sticky top-0 z-20 min-w-52 max-w-64 border-b border-r border-[#d8e2fb] bg-[#eef2ff] p-4 align-top">
                <Link to={`/creators/${creator.creator_id}`} className="font-black text-[#1438c8] hover:underline">{creator.display_name}</Link>
                {creator.username ? <p className="mt-1 break-words text-xs font-medium">@{creator.username.replace(/^@/, "")}</p> : null}
                <button type="button" aria-label={`Remove ${creator.display_name} from comparison`} onClick={() => onRemove(creator.creator_id!)} className="mt-3 rounded border border-[#d8e2fb] bg-white px-2 py-1 text-xs font-bold hover:bg-[#e0e7ff]">Remove</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="sticky left-0 z-10 border-b border-r border-[#d8e2fb] bg-[#f5f7ff] p-4 font-bold">{row.label}</th>
              {creators.map((creator) => <td key={creator.creator_id} className="whitespace-pre-line break-words border-b border-r border-[#d8e2fb] p-4 align-top">{row.value(creator)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
