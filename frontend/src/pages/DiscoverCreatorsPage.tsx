import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getCreatorsList, type CreatorProfileApi } from "../lib/authApi.ts";
import { Lock } from "lucide-react";
import { CreatorCard } from "../HtmlComponents/CreatorCard.tsx";

const categoryOptions = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Lifestyle",
];

const platformOptions = ["Instagram", "YouTube","Twitter", "Facebook"];


export const DiscoverCreatorsPage = () => {
  const { currentUser } = useAuth();
  const [creators, setCreators] = useState<CreatorProfileApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState(0);
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("All");
  const isLoggedIn = Boolean(currentUser);

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

  const locations = useMemo(() => Array.from(new Set(creators.map((creator) => creator.location).filter(Boolean))), [creators]);
  const filteredCreators = useMemo(() => {
    const text = query.trim().toLowerCase();
    const next = creators.filter((creator) => {
      const matchesText = !text || [
        creator.display_name,
        creator.user?.name,
        creator.category,
        creator.location,
        creator.bio,
        ...creator.languages,
        ...creator.collaboration_preferences,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(text));
      const matchesCategory = !selectedCategories.length || selectedCategories.includes(creator.category);
      const matchesPlatform = !selectedPlatforms.length || creator.social_accounts.some((account) => selectedPlatforms.includes(account.platform));
      const matchesFollowers = creator.audience_size >= minFollowers;
      const matchesLocation = !location || creator.location === location;
      return matchesText && matchesCategory && matchesPlatform && matchesFollowers && matchesLocation && gender;
    });

    return [...next].sort((a, b) => {
      if (sortBy === "followers") return b.audience_size - a.audience_size;
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.profile_completion || 0) - (a.profile_completion || 0);
    });
  }, [creators, gender, location, minFollowers, query, selectedCategories, selectedPlatforms, sortBy]);

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
    setGender("All");
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
              {isLoggedIn ? `${creators.length} creators found.` : `Showing ${Math.min(creators.length, 6)} of ${creators.length}+`}
            </p>
            {isLoggedIn ? (
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-[6px] border border-[#d8e2fb] bg-white px-3 text-sm font-bold text-[#65718a]">
                <option value="relevance">Sort by: Relevance</option>
                <option value="followers">Sort by: Followers</option>
                <option value="newest">Sort by: Newest</option>
              </select>
            ) : null}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(300px,170px)] lg:items-start">

          {error ? <p className="mt-8 rounded-[8px] bg-white p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
          <div className="mt-5 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">Loading creators...</p>
            ) : creators.length ? (
              creators.slice(0, isLoggedIn ? 24 : 6).map((creator, index) => (
                <CreatorCard creator={creator} index={index} />
              ))
            ) : (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">No creators match these filters.</p>
            )}
          </div>

        {isLoggedIn ? (
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
                  Search Categories...
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-[#65718a]">
                  {categoryOptions.map((category) => (
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
                <select value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 w-full rounded-[6px] border border-[#d8e2fb] px-3 text-sm font-bold text-[#65718a]">
                  <option value="">Search Location</option>
                  {locations.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#334260]">Gender</h3>
                <div className="grid grid-cols-3 gap-1">
                  {["All", "Male", "Female"].map((item) => (
                    <button key={item} type="button" onClick={() => setGender(item)} className={`h-9 rounded-[5px] border border-[#d8e2fb] text-sm font-bold ${gender === item ? "bg-[#dfe7ff] text-[#334260]" : "bg-white text-[#65718a]"}`}>
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
        {["Categories", "Platform", "Followers", "Location", "Gender"].map((label) => (
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