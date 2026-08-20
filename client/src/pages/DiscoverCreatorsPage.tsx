import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getBrandSavedCreators, getCreatorsList, removeBrandSavedCreator, saveBrandCreator } from "../lib/authApi.ts";
import type { CreatorListItemApi } from "../types.ts";
import { Lock } from "lucide-react";
import { CreatorCard } from "../HtmlComponents/CreatorCard.tsx";
import { showProjectToast } from "../HtmlComponents/HtmlRoster.tsx";

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
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState(0);
  const [location, setLocation] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [savedCreatorIds, setSavedCreatorIds] = useState<string[]>([]);
  const [savingCreatorId, setSavingCreatorId] = useState("");
  const isBrand = currentUser?.role === "Brand";

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

  useEffect(() => {
    if (!isBrand) return;

    let mounted = true;
    getBrandSavedCreators()
      .then((data) => {
        if (!mounted) return;
        setSavedCreatorIds(data.creators.map((item) => item.creator.id));
      })
      .catch(() => {
        if (mounted) setSavedCreatorIds([]);
      });

    return () => {
      mounted = false;
    };
  }, [isBrand]);

  const toggleSavedCreator = async (creator: CreatorListItemApi) => {
    if (!isBrand || !creator.creator_id || savingCreatorId) return;

    const creatorId = creator.creator_id;
    setSavingCreatorId(creatorId);
    try {
      if (savedCreatorIds.includes(creatorId)) {
        await removeBrandSavedCreator(creatorId);
        setSavedCreatorIds((items) => items.filter((item) => item !== creatorId));
        showProjectToast("info", "Creator removed", "The creator has been removed from your saved list.");
      } else {
        await saveBrandCreator(creatorId);
        setSavedCreatorIds((items) => [...items, creatorId]);
        showProjectToast("success", "Creator saved", "The creator has been added to your saved list.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update saved creator.";
      setError(message);
      showProjectToast("error", "Save action failed", message);
    } finally {
      setSavingCreatorId("");
    }
  };

  const locations = useMemo(() => Array.from(new Set(creators.map((creator) => creator.location).filter(Boolean))), [creators]);
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
  const visibleLocationOptions = useMemo(() => {
    const text = locationQuery.trim().toLowerCase();
    return locations.filter((item) => !text || item.toLowerCase().includes(text));
  }, [locationQuery, locations]);
  const filteredCreators = useMemo(() => {
    const text = query.trim().toLowerCase();
    const next = creators.filter((creator) => {
      const platformData = creator.platform_data ?? [];
      const workWith = creator.work_with ?? [];
      const matchesText = !text || [
        creator.display_name,
        creator.username,
        creator.category,
        creator.location,
        ...workWith,
        ...platformData.map((account) => account.name),
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(text));

      if (!isBrand) return matchesText;

      const matchesCategory = !selectedCategories.length || selectedCategories.some((category) => categoryMatchesFilter(category, creator.category));
      const matchesPlatform = !selectedPlatforms.length || platformData.some((account) =>
        selectedPlatforms.some((platform) => platformMatchesFilter(platform, account.name)),
      );
      const matchesFollowers = (creator.total_followers || 0) >= minFollowers;
      const matchesLocation = !location || creator.location === location;
      return matchesText && matchesCategory && matchesPlatform && matchesFollowers && matchesLocation;
    });

    return [...next].sort((a, b) => {
      if (!isBrand) return 0;
      if (sortBy === "followers") return (b.total_followers || 0) - (a.total_followers || 0);
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return (b.total_followers || 0) - (a.total_followers || 0);
    });
  }, [creators, isBrand, location, minFollowers, query, selectedCategories, selectedPlatforms, sortBy]);
  const visibleCreators = isBrand ? filteredCreators : filteredCreators.slice(0, 12);

  function toggleValue(value: string, setter: (value: string[]) => void, current: string[]) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function clearFilters() {
    setQuery("");
    setSortBy("relevance");
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setMinFollowers(0);
    setLocation("");
    setCategoryQuery("");
    setLocationQuery("");
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
                placeholder="Search creators by name, handle or keywords..."
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
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-[6px] border border-[#d8e2fb] bg-white px-3 text-sm font-bold text-[#65718a]">
                <option value="relevance">Sort by: Relevance</option>
                <option value="followers">Sort by: Followers</option>
                <option value="newest">Sort by: Newest</option>
              </select>
            ) : null}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(300px,170px)] lg:items-start">

          {error ? <p className="mt-8 rounded-[8px] bg-white p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
          <div className="mt-5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">Loading creators...</p>
            ) : visibleCreators.length ? (
              visibleCreators.map((creator, index) => (
                <CreatorCard
                  key={creator.creator_id || creator.username || `${creator.display_name}-${index}`}
                  creator={creator}
                  index={index}
                  isBrand={isBrand}
                  isSaved={Boolean(creator.creator_id && savedCreatorIds.includes(creator.creator_id))}
                  // isSaving={savingCreatorId === creator.creator_id}
                  onToggleSaved={toggleSavedCreator}
                />
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
                      <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleValue(category, setSelectedCategories, selectedCategories)} className="accent-[#7288ff]" />
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
                <label className="mb-3 flex h-9 items-center gap-2 rounded-[6px] border border-[#d8e2fb] px-3 text-xs font-bold text-[#65718a]">
                  <Search className="h-4 w-4" />
                  <input
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="Search Location..."
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9aa7c4]"
                  />
                </label>
                <div className="grid max-h-36 gap-2 overflow-y-auto text-sm font-semibold text-[#65718a]">
                  <button type="button" onClick={() => setLocation("")} className={`rounded-[5px] border border-[#d8e2fb] px-3 py-2 text-left ${!location ? "bg-[#dfe7ff] text-[#334260]" : "bg-white"}`}>
                    All locations
                  </button>
                  {visibleLocationOptions.map((item) => (
                    <button key={item} type="button" onClick={() => setLocation(item)} className={`rounded-[5px] border border-[#d8e2fb] px-3 py-2 text-left ${location === item ? "bg-[#dfe7ff] text-[#334260]" : "bg-white"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
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
        {["Categories", "Platform", "Followers", "Location"].map((label) => (
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
