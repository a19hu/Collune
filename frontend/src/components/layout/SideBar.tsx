import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Building2, ChevronDown, CircleHelp, FileText, Home, LogOut, Settings, ShoppingBag, Star, UserRound, Users } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/Logo.svg";
import { useAuth } from "../../contexts/AuthContext";
import { getBrandMe } from "../../lib/authApi";
import type { BrandProfileApi } from "../../types";

export type SidebarMode = "creator" | "brand";

const navByMode = {
  creator: [
    { label: "Dashboard", to: "/creator", icon: Home },
    { label: "Profile", to: "/creator/profile", icon: UserRound },
    { label: "Campaign Marketplace", to: "/creator/marketplace", icon: ShoppingBag, lockedWhenUnverified: true },
    { label: "Applied Campaigns", to: "/creator/applied-campaigns", icon: BadgeCheck, lockedWhenUnverified: true },
    { label: "Saved Campaigns", to: "/creator/saved-campaigns", icon: Star, lockedWhenUnverified: true },
  ],
  brand: [
    { label: "Dashboard", to: "/brand", icon: Home },
    { label: "Campaigns", to: "/brand/campaigns", icon: FileText, lockedWhenUnverified: true },
    { label: "Discover Creators", to: "/discover-creators", icon: Users, lockedWhenUnverified: true },
    { label: "Shortlists", to: "/brand/shortlists", icon: Star },
  ],
};

export function SideBar({ isVerified = false, mode = "creator" }: { isVerified?: boolean; mode?: SidebarMode }) {
  const navItems = navByMode[mode];
  const { currentUser, logout } = useAuth();
  const [brandProfile, setBrandProfile] = useState<BrandProfileApi | null>(null);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const brandMenuRef = useRef<HTMLDivElement | null>(null);
  const isBrand = mode === "brand";
  const brandName = brandProfile?.company_name || currentUser?.name || "Acme Labs";
  const brandInitials = useMemo(() => {
    const words = brandName.trim().split(/\s+/).filter(Boolean);
    return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "AL").toUpperCase();
  }, [brandName]);

  useEffect(() => {
    if (!isBrand) return;
    let mounted = true;
    getBrandMe()
      .then((brand) => {
        if (mounted) setBrandProfile(brand);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [isBrand]);

  useEffect(() => {
    if (!isBrandMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!brandMenuRef.current?.contains(event.target as Node)) {
        setIsBrandMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isBrandMenuOpen]);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] flex-col border-r border-[#eef1f6] bg-[#f5f7ff] lg:flex">
      <div className="px-16 pb-6 pt-6">
    <Link to='/'>
        <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
    </Link>

      </div>

      {isBrand ? (
        <div ref={brandMenuRef} className="relative px-4 pb-5">
          <button
            type="button"
            onClick={() => setIsBrandMenuOpen((open) => !open)}
            className="flex h-[58px] w-full items-center gap-3 rounded-lg border border-[#e1e6ef] bg-white px-3 text-left shadow-sm"
          >
            {brandProfile?.logo_url ? (
              <img src={brandProfile.logo_url} alt={brandName} className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#4b22ff] text-sm font-black text-white">
                {brandInitials}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-black text-black">{brandName}</span>
            <ChevronDown className={`h-5 w-5 text-[#657084] transition ${isBrandMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isBrandMenuOpen ? (
            <div className="absolute left-4 right-4 top-[68px] z-40 rounded-lg border border-[#e1e6ef] bg-white p-2 shadow-[0_12px_30px_rgba(20,30,60,0.14)]">
              <div className="border-b border-[#eef1f6] px-3 py-3">
                <p className="truncate text-sm font-black text-[#1d203a]">{brandName}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#657084]">{currentUser?.email || "Brand account"}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-2 flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-black text-[#d23b3b] hover:bg-[#fff1f1]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <nav className="grid gap-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const locked = !isVerified && item.lockedWhenUnverified;

          if (locked) {
            return (
              <button
                key={item.label}
                type="button"
                className="flex h-[46px] cursor-not-allowed items-center gap-3 rounded-lg px-4 text-left text-[15px] font-semibold text-[#9aa3b2] opacity-70"
                title="Available after verification"
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                <Building2 className="h-4 w-4 text-[#7c8798]" />
              </button>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === `/${mode}`}
              className={({ isActive }) =>
                `flex h-[46px] items-center gap-3 rounded-lg px-4 text-[15px] font-semibold transition ${
                   isActive
                    ? "bg-[#dfe7ff] text-[#2d30ff]"
                    : "text-[#657084] hover:bg-white hover:text-[#2d30ff]"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-1 h-4 w-4 text-[#64738e]" />
            <div>
              <h3 className="text-sm font-black text-[#1d203a]">Need Help?</h3>
              <p className="mt-2 text-xs font-medium leading-snug text-[#7a8496]">
                We're here to help you succeed.
              </p>
            </div>
          </div>
          <button className="mt-4 h-[62px] w-full rounded-lg border-2 border-[#64738e] text-sm font-black text-[#64738e]">
            Contact
            <br />
            Support
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SideBar;
