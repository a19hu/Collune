import type { CreatorListItemApi } from "../types";

export const creatorSortOptions = [
  ["recommended", "Recommended"],
  ["relevance", "Most Relevant"],
  ["followers", "Highest Followers"],
  ["engagement", "Highest Engagement"],
  ["active", "Recently Active"],
  ["newest", "Recently Joined"],
] as const;

function relevance(creator: CreatorListItemApi, query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fields: [string, number][] = [
    [creator.display_name, 8], [creator.username || "", 8],
    [creator.category, 5],
    [[creator.city, creator.state, creator.country, ...(creator.languages || [])].join(" "), 3],
    [[creator.bio, creator.about, ...(creator.work_with || [])].join(" "), 1],
  ];
  return terms.reduce((score, term) => score + fields.reduce((total, [value, weight]) => {
    const normalized = value.toLowerCase();
    return total + (normalized === term ? weight * 3 : normalized.startsWith(term) ? weight * 2 : normalized.includes(term) ? weight : 0);
  }, 0), 0);
}

function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value?: string | null) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function compareMetric(left: number | null, right: number | null, ascending = false) {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  return ascending ? left - right : right - left;
}

export function sortCreators(creators: CreatorListItemApi[], sortBy: string, query = "") {
  const recommended = (creator: CreatorListItemApi) => relevance(creator, query) * 10
    + (creator.verified ? 20 : 0)
    + Math.min(numeric(creator.avg_eng_rate) || 0, 20)
    + Math.log10(1 + Math.max(creator.total_followers || 0, 0))
    + (creator.is_online ? 5 : 0);
  return [...creators].sort((left, right) => {
    let difference = 0;
    switch (sortBy) {
      case "relevance": difference = relevance(right, query) - relevance(left, query); break;
      case "followers": difference = compareMetric(numeric(left.total_followers), numeric(right.total_followers)); break;
      case "engagement": difference = compareMetric(numeric(left.avg_eng_rate), numeric(right.avg_eng_rate)); break;
      case "active": difference = Number(!!right.is_online) - Number(!!left.is_online) || compareMetric(dateValue(left.last_active_at), dateValue(right.last_active_at)); break;
      case "newest": difference = compareMetric(dateValue(left.created_at), dateValue(right.created_at)); break;
      default: difference = recommended(right) - recommended(left);
    }
    return difference || (sortBy === "relevance" ? recommended(right) - recommended(left) : 0)
      || left.display_name.localeCompare(right.display_name)
      || (left.creator_id || left.username || "").localeCompare(right.creator_id || right.username || "");
  });
}
