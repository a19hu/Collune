import { Search } from "lucide-react";
import { creatorSortOptions, sortCreators } from "../lib/creatorSorting";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getCreatorsList } from "../lib/authApi.ts";
import type { CreatorListItemApi } from "../types.ts";
import { Lock } from "lucide-react";
import { CreatorCard } from "../HtmlComponents/CreatorCard.tsx";
import { CreatorComparison } from "../components/Shared/CreatorComparison";

const baseCategoryOptions = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Lifestyle",
  "Education",
  "Politics",
];

const platformOptions = ["Instagram", "YouTube", "Twitter", "Facebook"];
const platformValueMap: Record<string, string[]> = {
  Instagram: ["INSTAGRAM", "INSTA"],
  YouTube: ["YOUTUBE", "YT"],
  Twitter: ["X", "TWITTER", "X TWITTER"],
  Facebook: ["FACEBOOK", "FB"],
};

function normalizePlatform(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function platformMatchesFilter(filterValue: string, platformName?: string) {
  const normalizedFilter = normalizePlatform(filterValue);
  const normalizedPlatform = normalizePlatform(platformName);
  const allowedValues = platformValueMap[filterValue] || [normalizedFilter];

  return allowedValues.some((value) => normalizedPlatform === normalizePlatform(value));
}

function normalizeCategory(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function categoryMatchesFilter(filterValue: string, creatorCategory?: string) {
  const normalizedFilter = normalizeCategory(filterValue);
  const normalizedCreatorCategory = normalizeCategory(creatorCategory);

  if (!normalizedFilter || !normalizedCreatorCategory) return false;
  if (normalizedFilter === normalizedCreatorCategory) return true;

  const aliasMap: Record<string, string[]> = {
    politics: ["politics", "political", "political commentary", "government", "public affairs"],
    education: ["education", "educational", "learning", "edtech"],
    fitness: ["fitness", "health", "wellness"],
    food: ["food", "cooking"],
    travel: ["travel", "tourism"],
    beauty: ["beauty", "skincare", "makeup"],
    fashion: ["fashion", "style"],
    lifestyle: ["lifestyle", "daily life"],
  };

  const aliases = aliasMap[normalizedFilter] || [normalizedFilter];
  return aliases.some((alias) => normalizedCreatorCategory.includes(alias));
}

export const DiscoverCreatorsPage = () => {
  const { currentUser } = useAuth();
  const [creators, setCreators] = useState<CreatorListItemApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState(0);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const isBrand = currentUser?.role === "Brand";
  const comparedCreators = useMemo(() => comparisonIds.flatMap((creatorId) => {
    const creator = creators.find((item) => item.creator_id === creatorId);
    return creator ? [creator] : [];
  }), [comparisonIds, creators]);

  function toggleComparison(creatorId: string) {
    setComparisonIds((current) => current.includes(creatorId)
      ? current.filter((item) => item !== creatorId)
      : current.length < 5 ? [...current, creatorId] : current);
  }

  useEffect(() => {
    setComparisonIds([]);
    setShowComparison(false);
  }, [currentUser?.user_id]);

  useEffect(() => {
    let mounted = true;

    getCreatorsList()
      .then((data) => {
        if (mounted) setCreators(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load creators.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const unique = (values: (string | undefined)[]) => Array.from(new Map(values
      .map((value) => value?.trim() || "")
      .filter(Boolean)
      .map((value) => [value.toLowerCase(), value])).values()).sort((first, second) => first.localeCompare(second));
    return {
      countries: unique(creators.map((creator) => creator.country)),
      states: unique(creators.filter((creator) => !country || creator.country?.toLowerCase() === country.toLowerCase()).map((creator) => creator.state)),
      cities: unique(creators.filter((creator) =>
        (!country || creator.country?.toLowerCase() === country.toLowerCase()) && (!state || creator.state?.toLowerCase() === state.toLowerCase()),
      ).map((creator) => creator.city)),
      languages: unique(creators.flatMap((creator) => creator.languages || [])),
    };
  }, [creators, country, state]);
  const categoryOptions = useMemo(() => {
    const creatorCategories = creators
      .map((creator) => creator.category)
      .filter(Boolean) as string[];

    const merged = [...baseCategoryOptions, ...creatorCategories];
    const unique = merged.filter((category, index) => index === merged.findIndex((item) => normalizeCategory(item) === normalizeCategory(category)));

    return unique.sort((first, second) => first.localeCompare(second));
  }, [creators]);

  const visibleCategoryOptions = useMemo(() => {
    const text = categoryQuery.trim().toLowerCase();
    return categoryOptions.filter((category) => !text || category.toLowerCase().includes(text));
  }, [categoryOptions, categoryQuery]);
  const filteredCreators = useMemo(() => {
    const text = query.trim().toLowerCase();
    const next = creators.filter((creator) => {
      const platformData = creator.platform_data ?? [];
      const workWith = creator.work_with ?? [];
      const searchable = [
        creator.display_name,
        creator.username,
        creator.category,
        creator.location,
        creator.city,
        creator.state,
        creator.country,
        creator.bio,
        creator.about,
        ...(creator.languages || []),
        ...workWith,
        ...platformData.map((account) => account.name),
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesText = !text || text.split(/\s+/).every((term) => searchable.includes(term));

      if (!isBrand) return matchesText;

      const matchesCategory = !selectedCategories.length || selectedCategories.some((category) => categoryMatchesFilter(category, creator.category));
      const matchesPlatform = !selectedPlatforms.length || platformData.some((account) =>
        selectedPlatforms.some((platform) => platformMatchesFilter(platform, account.name)),
      );
      const matchesFollowers = (creator.total_followers || 0) >= minFollowers;
      const matchesLocation = (!country || creator.country?.toLowerCase() === country.toLowerCase())
        && (!state || creator.state?.toLowerCase() === state.toLowerCase())
        && (!city || creator.city?.toLowerCase() === city.toLowerCase());
      const matchesLanguage = !language || creator.languages?.some((value) => value.toLowerCase() === language.toLowerCase());
      return matchesText && matchesCategory && matchesPlatform && matchesFollowers && matchesLocation && matchesLanguage;
    });

    return isBrand ? sortCreators(next, sortBy, query) : next;
  }, [creators, isBrand, country, state, city, language, minFollowers, query, selectedCategories, selectedPlatforms, sortBy]);
  const visibleCreators = isBrand ? filteredCreators : filteredCreators.slice(0, 12);

  function toggleValue(value: string, setter: (value: string[]) => void, current: string[]) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function clearFilters() {
    setQuery("");
    setSortBy("recommended");
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setMinFollowers(0);
    setCountry("");
    setState("");
    setCity("");
    setLanguage("");
    setCategoryQuery("");
  }


    return (
        <>
        <main className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-47 text-[#17327c]">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-row-[1fr_300px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,480px)] lg:items-end justify-">
            <div>
              <h2 className="text-[clamp(30px,1vw,40px)] font-black leading-none text-[#1438c8]">Discover Creators</h2>
              <p className="mt-3 max-w-md text-base font-bold leading-tight text-[#65718a]">
                Explore verified creators across different categories. Find the perfect match for your brand.
              </p>
            </div>
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#cfdaff]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search creators by name, username, category, city, state, language or keyword"
                placeholder="Search name, city, language or keywords..."
                className="h-13 w-full rounded-[10px] border border-[#d8e2fb] bg-white px-14 text-sm font-bold text-[#334260] outline-none placeholder:text-[#cfdaff]"
              />
            </label>
          </div>
        <div>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
            <p className="text-base font-bold text-[#65718a]">
              {isBrand ? `${filteredCreators.length} of ${creators.length} creators found.` : `Showing ${visibleCreators.length} of ${filteredCreators.length} creators`}
            </p>
            {isBrand ? (
              <select aria-label="Sort creators" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-[6px] border border-[#d8e2fb] bg-white px-3 text-sm font-bold text-[#65718a]">
                {creatorSortOptions.map(([value, label]) => <option key={value} value={value}>Sort by: {label}</option>)}
              </select>
            ) : null}
          </div>
          {isBrand ? (
            <section aria-label="Compare creators" className="mt-5 min-w-0 rounded-xl border border-[#d8e2fb] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p aria-live="polite" className="text-sm font-bold text-[#334260]">Compare creators ({comparedCreators.length}/5) · Select 2–5 creators</p>
                <div className="flex gap-3">
                  <button type="button" disabled={!comparisonIds.length} onClick={() => { setComparisonIds([]); setShowComparison(false); }} className="text-sm font-bold text-[#65718a] disabled:opacity-40">Clear selection</button>
                  <button type="button" aria-expanded={showComparison && comparedCreators.length >= 2} aria-controls="creator-comparison" disabled={comparedCreators.length < 2} onClick={() => setShowComparison((current) => !current)} className="rounded-lg bg-[#1438c8] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{showComparison && comparedCreators.length >= 2 ? "Hide comparison" : "Compare selected"}</button>
                </div>
              </div>
              {comparedCreators.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comparedCreators.map((creator) => <button key={creator.creator_id} type="button" aria-label={`Remove ${creator.display_name} from comparison`} onClick={() => toggleComparison(creator.creator_id!)} className="rounded-full bg-[#eef2ff] px-3 py-1 text-sm font-semibold text-[#334260]">{creator.display_name} ×</button>)}
                </div>
              ) : null}
              <div id="creator-comparison">
                {showComparison && comparedCreators.length >= 2 ? <CreatorComparison creators={comparedCreators} onRemove={toggleComparison} /> : null}
              </div>
            </section>
          ) : null}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(300px,170px)] lg:items-start">

          {error ? <p className="mt-8 rounded-[8px] bg-white p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
          <div className="mt-5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">Loading creators...</p>
            ) : visibleCreators.length ? (
              visibleCreators.map((creator, index) => (
                <div key={creator.creator_id || creator.username || `${creator.display_name}-${index}`} className="min-w-0">
                <CreatorCard
                  key={creator.creator_id || creator.username || `${creator.display_name}-${index}`}
                  creator={creator}
                  index={index}
                  isBrand={isBrand}
                />
                {isBrand ? (
                  <label className="mt-2 flex items-center gap-2 rounded-lg border border-[#d8e2fb] bg-white px-3 py-2 text-sm font-bold text-[#334260]">
                    <input type="checkbox" checked={!!creator.creator_id && comparisonIds.includes(creator.creator_id)} disabled={!creator.creator_id || (comparisonIds.length >= 5 && !comparisonIds.includes(creator.creator_id))} onChange={() => creator.creator_id && toggleComparison(creator.creator_id)} aria-label={`Compare ${creator.display_name}`} className="accent-[#1438c8]" />
                    {!creator.creator_id ? "Private profile" : comparisonIds.length >= 5 && !comparisonIds.includes(creator.creator_id) ? "Comparison limit reached" : "Add to comparison"}
                  </label>
                ) : null}
                </div>
              ))
            ) : (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">No creators match these filters.</p>
            )}
            </div>
          </div>

        {isBrand ? (
          <aside className="rounded-[14px] border border-[#d8e2fb] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#334260]">Filters</h2>
              <button type="button" onClick={clearFilters} className="text-sm font-bold text-[#7288ff]">Clear all</button>
            </div>
            <div className="mt-7 grid gap-7">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#334260]">Categories</h3>
                <label className="mb-3 flex h-9 items-center gap-2 rounded-[6px] border border-[#d8e2fb] px-3 text-xs font-bold text-[#65718a]">
                  <Search className="h-4 w-4" />
                  <input
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Search Categories..."
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9aa7c4]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-[#65718a]">
                  {visibleCategoryOptions.map((category) => (
                    <label key={category} className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => { toggleValue(category, setSelectedCategories, selectedCategories); }} className="accent-[#7288ff]" />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#334260]">Platform</h3>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-[#65718a]">
                  {platformOptions.map((platform) => (
                    <label key={platform} className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => toggleValue(platform, setSelectedPlatforms, selectedPlatforms)} className="accent-[#7288ff]" />
                      {platform.charAt(0) + platform.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#334260]">Followers</h3>
                <input type="range" min="0" max="1000000" step="1000" value={minFollowers} onChange={(event) => setMinFollowers(Number(event.target.value))} className="w-full accent-[#7288ff]" />
                <div className="mt-2 flex justify-between text-xs font-bold text-[#65718a]">
                  <span className="rounded border border-[#d8e2fb] px-2 py-1">1K</span>
                  <span className="rounded border border-[#d8e2fb] px-2 py-1">1M+</span>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#334260]">Location</h3>
                <div className="grid gap-3">
                  <FilterSelect label="Country" value={country} options={filterOptions.countries} onChange={(value) => { setCountry(value); setState(""); setCity(""); }} />
                  <FilterSelect label="State" value={state} options={filterOptions.states} onChange={(value) => { setState(value); setCity(""); }} />
                  <FilterSelect label="City" value={city} options={filterOptions.cities} onChange={setCity} />
                </div>
              </div>
              <FilterSelect label="Language" value={language} options={filterOptions.languages} onChange={setLanguage} />
            </div>
          </aside>
        ) : (
          <LockedFilters />
        )}
        </div>
        </div>

      </section>
    </main>
        </>
    )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#334260]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-[#d8e2fb] bg-white px-3 text-[#65718a]">
        <option value="">All {label.toLowerCase()} options</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function LockedFilters() {
  return (
    <aside className="rounded-[14px] border border-[#d8e2fb] bg-white p-6">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dce5ff] text-[#7488ff]">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-center text-base font-black text-[#25304a]">Unlock all filters</h2>
      <p className="mx-auto mt-2 max-w-[230px] text-center text-sm font-semibold leading-tight text-[#65718a]">
        Sign in to access advanced search filters and find the right creators faster.
      </p>
      <Link to="/login" className="mt-6 grid h-11 place-items-center rounded-[8px] bg-[#1438c8] text-sm font-black text-white">
        Sign in to continue
      </Link>
      <div className="mt-8 grid gap-4 text-sm font-bold text-[#25304a]">
        {["Categories", "Platform", "Followers", "Location", "Language"].map((label) => (
          <div key={label} className="flex items-center justify-between">
            <span>{label}</span>
            <Lock className="h-4 w-4" />
          </div>
        ))}
      </div>
      <p className="mt-16 text-center text-sm font-semibold leading-tight text-[#65718a]">
        Creating and account is free and only takes a minute.
      </p>
    </aside>
  );
}
