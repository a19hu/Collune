import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BookOpenText, Building2, ExternalLink, HelpCircle, Info, Lock, Search, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getBrandsList, getCreatorsList } from "../lib/authApi";
import type { BrandProfileApi, CreatorProfileApi } from "../types";
import creator1 from "../assets/collune/creator-1.png";
import creator2 from "../assets/collune/creator-2.png";
import creator3 from "../assets/collune/creator-3.png";
import creator4 from "../assets/collune/creator-4.png";
import heroCreator1 from "../assets/collune/hero-creator-1.png";
import heroCreator2 from "../assets/collune/hero-creator-2.png";

const pageContent = {
  "discover-creators": {
    eyebrow: "Creator Network",
    title: "Discover Creators",
    copy: "Find verified creators by audience, category, content style, and collaboration fit.",
    icon: Search,
    cards: ["Audience-first search", "Verified creator profiles", "Shortlist by campaign goals"],
  },
  "featured-creators": {
    eyebrow: "Curated Talent",
    title: "Featured Creators",
    copy: "Explore a handpicked selection of creators trusted by brands for structured collaborations.",
    icon: BadgeCheck,
    cards: ["Verified work history", "Brand-safe profiles", "High-signal recommendations"],
  },
  "featured-brands": {
    eyebrow: "Brand Network",
    title: "Featured Brands",
    copy: "Explore verified brands that choose to keep their Collune profiles visible.",
    icon: Building2,
    cards: ["Verified company profiles", "Creator-ready partners", "Public visibility by choice"],
  },
  "success-stories": {
    eyebrow: "For Brands",
    title: "Success Stories",
    copy: "See how brands use Collune to build creator partnerships with clear outcomes and accountability.",
    icon: Trophy,
    cards: ["Campaign alignment", "On-time delivery", "Measurable collaboration impact"],
  },
  blogs: {
    eyebrow: "Resources",
    title: "Blogs",
    copy: "Read practical guidance on creator discovery, brand partnerships, and collaboration workflows.",
    icon: BookOpenText,
    cards: ["Creator marketing insights", "Brand playbooks", "Workflow best practices"],
  },
  faqs: {
    eyebrow: "Resources",
    title: "FAQs",
    copy: "Get answers about creator verification, payments, brand requests, and collaboration management.",
    icon: HelpCircle,
    cards: ["How verification works", "How payments are handled", "How brands and creators connect"],
  },
};

type PageKey = keyof typeof pageContent;

const fallbackImages = [creator1, heroCreator1, creator2, creator4, heroCreator2, creator3];
const categoryOptions = ["Politics", "Lifestyle", "Education", "Fashion", "Travel", "Food"];
const platformOptions = ["INSTAGRAM", "YOUTUBE", "X", "LINKEDIN"];

function creatorHandle(creator: CreatorProfileApi) {
  const account = creator.social_accounts.find((item) => item.handle || item.username);
  const handle = account?.handle || account?.username || creator.user?.username || "";
  return handle ? `@${handle.replace(/^@/, "")}` : "";
}

function creatorChips(creator: CreatorProfileApi) {
  const platforms = creator.social_accounts.map((account) => account.platform).filter(Boolean);
  const preferences = creator.collaboration_preferences.filter(Boolean);
  return [...platforms, ...preferences, ...creator.languages].slice(0, 3);
}

function DiscoverCreatorCard({ creator, index }: { creator: CreatorProfileApi; index: number; key?: string }) {
  const image = creator.profile_image_url || fallbackImages[index % fallbackImages.length];
  const name = creator.display_name || creator.user?.name || "Creator";
  const handle = creatorHandle(creator);
  const chips = creatorChips(creator);

  return (
    <Link to={`/creators/${creator.creator_id}`} className="overflow-hidden rounded-[10px] bg-white text-left shadow-[0_10px_24px_rgba(40,67,140,0.08)] transition hover:-translate-y-1">
      <div className="relative aspect-[1.9] overflow-hidden">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        <span className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#7f91ff]">
          <BadgeCheck className="h-3 w-3 fill-current" />
          Verified
        </span>
        <span className="absolute right-5 top-5 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-[#64728c]">
          <Info className="h-3 w-3" />
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-xl font-black text-[#334260]">{name}</h3>
          {handle ? <span className="text-sm font-bold text-[#65718a]">{handle}</span> : null}
        </div>
        <strong className="mt-1 block text-base font-black text-[#7288ff]">{creator.category || "Creator"}</strong>
        <span className="mt-2 block text-sm font-bold text-[#65718a]">Worked with:</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(chips.length ? chips : ["Creator"]).map((chip) => (
            <span key={chip} className="grid min-h-6 place-items-center rounded-full bg-[#dfe7ff] px-2 text-center text-[11px] font-bold text-[#334260]">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Link>
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

function FeaturedBrandCard({ brand }: { brand: BrandProfileApi; key?: string }) {
  const initials = brand.company_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "B";

  return (
    <article className="rounded-[10px] bg-white p-6 text-left shadow-[0_10px_24px_rgba(40,67,140,0.08)]">
      <div className="flex items-start gap-4">
        {brand.logo_url ? (
          <img src={brand.logo_url} alt={brand.company_name} className="h-14 w-14 rounded-[8px] object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-[8px] bg-[#dfe7ff] text-lg font-black text-[#1438c8]">{initials}</span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-black text-[#334260]">{brand.company_name}</h2>
          <p className="mt-1 text-sm font-bold text-[#7288ff]">{brand.industry || "Brand"}</p>
        </div>
        <BadgeCheck className="h-5 w-5 shrink-0 fill-[#7288ff] text-[#7288ff]" />
      </div>
      <div className="mt-5 grid gap-2 text-sm font-bold text-[#65718a]">
        <span>{brand.company_size || "Company size not added"}</span>
        {brand.website ? (
          <a href={brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#1438c8]">
            Website <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span>Website not added</span>
        )}
      </div>
    </article>
  );
}

function FeaturedBrandsPage() {
  const { currentUser } = useAuth();
  const [brands, setBrands] = useState<BrandProfileApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(currentUser);

  useEffect(() => {
    let mounted = true;
    if (!isLoggedIn) {
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    getBrandsList()
      .then((data) => {
        if (mounted) setBrands(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load brands.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-36 text-[#17327c]">
      <section className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(36px,4vw,44px)] font-black leading-none text-[#1438c8]">Featured Brands</h1>
          <p className="mt-3 text-base font-bold leading-tight text-[#65718a]">
            Verified brands that have chosen to make their Collune profile visible to the platform.
          </p>
        </div>

        {error ? <p className="mt-8 rounded-[8px] bg-white p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {!isLoggedIn ? (
            <div className="col-span-full rounded-[10px] bg-white p-8 text-center shadow-[0_10px_24px_rgba(40,67,140,0.08)]">
              <h2 className="text-xl font-black text-[#334260]">Verified member access only</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-bold text-[#65718a]">
                Brand profiles and platform member information are available only after signing in as a verified Collune member.
              </p>
              <Link to="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[6px] bg-[#1438c8] px-6 text-sm font-black text-white">
                Sign in
              </Link>
            </div>
          ) : isLoading ? (
            <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">Loading brands...</p>
          ) : brands.length ? (
            brands.map((brand) => <FeaturedBrandCard key={brand.brand_id} brand={brand} />)
          ) : (
            <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">No brands are visible yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function DiscoverCreatorsPage() {
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
      const handle = creatorHandle(creator).toLowerCase();
      const matchesText = !text || [
        creator.display_name,
        creator.user?.name,
        creator.category,
        creator.location,
        handle,
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
    <main className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-36 text-[#17327c]">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,480px)] lg:items-end">
            <div>
              <h1 className="text-[clamp(36px,4vw,44px)] font-black leading-none text-[#1438c8]">Discover Creators</h1>
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

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
            <p className="text-base font-bold text-[#65718a]">
              {isLoggedIn ? `${filteredCreators.length} creators found.` : `Showing ${Math.min(filteredCreators.length, 24)} of 250+`}
            </p>
            {isLoggedIn ? (
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-[6px] border border-[#d8e2fb] bg-white px-3 text-sm font-bold text-[#65718a]">
                <option value="relevance">Sort by: Relevance</option>
                <option value="followers">Sort by: Followers</option>
                <option value="newest">Sort by: Newest</option>
              </select>
            ) : null}
          </div>

          {error ? <p className="mt-8 rounded-[8px] bg-white p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
          <div className="mt-5 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">Loading creators...</p>
            ) : filteredCreators.length ? (
              filteredCreators.slice(0, isLoggedIn ? 24 : 6).map((creator, index) => (
                <DiscoverCreatorCard key={creator.creator_id} creator={creator} index={index} />
              ))
            ) : (
              <p className="col-span-full py-10 text-center text-sm font-black text-[#65718a]">No creators match these filters.</p>
            )}
          </div>
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
              <button type="button" className="mt-10 h-12 rounded-[6px] bg-[#1438c8] text-sm font-black text-white">
                Apply Filters
              </button>
              <button type="button" onClick={clearFilters} className="h-11 rounded-[6px] border border-[#d8e2fb] bg-white text-sm font-black text-[#1438c8]">
                Cancel
              </button>
            </div>
          </aside>
        ) : (
          <LockedFilters />
        )}
      </section>
    </main>
  );
}

const ColluneInfoPage = ({ page }: { page: PageKey }) => {
  if (page === "discover-creators" || page === "featured-creators") {
    return <DiscoverCreatorsPage />;
  }
  if (page === "featured-brands") {
    return <FeaturedBrandsPage />;
  }

  const content = pageContent[page];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-36 text-[#17327c]">
      <section className="mx-auto max-w-6xl text-center">
        <div className="inline-flex min-h-7 items-center justify-center gap-2 rounded-full border border-[#dae3ff] bg-white/70 px-8 text-[12px] font-black uppercase text-[#2a54cf]">
          <span className="h-2 w-2 rounded-full bg-[#8195ff]" />
          {content.eyebrow}
        </div>

        <div className="mx-auto mt-10 grid h-24 w-24 place-items-center rounded-full bg-white text-[#8794ff] shadow-[0_18px_40px_rgba(45,66,140,0.12)]">
          <Icon className="h-11 w-11" />
        </div>

        <h1 className="mx-auto mt-8 max-w-3xl text-[clamp(48px,7vw,82px)] font-black leading-none tracking-normal text-[#153fb8]">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-extrabold leading-snug text-[#4e5c77]">
          {content.copy}
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {content.cards.map((card) => (
            <article key={card} className="rounded-lg border border-[#edf1fb] bg-white p-7 text-left shadow-[0_14px_30px_rgba(35,58,124,0.08)]">
              <Sparkles className="mb-5 h-7 w-7 text-[#8794ff]" />
              <h2 className="text-xl font-black text-[#334260]">{card}</h2>
              <p className="mt-3 text-sm font-extrabold leading-snug text-[#758097]">
                Built to keep collaborations clear, trusted, and easy to move forward.
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#174bd2] px-7 text-sm font-black text-white shadow-[0_14px_24px_rgba(27,71,207,0.22)] transition hover:-translate-y-0.5"
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ColluneInfoPage;
