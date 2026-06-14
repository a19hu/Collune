import { Building2, CircleHelp, FileText, Home, Settings, ShoppingBag, UserRound, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/Logo.svg";

export type SidebarMode = "creator" | "brand";

const navByMode = {
  creator: [
    { label: "Dashboard", to: "/creator", icon: Home },
    { label: "Profile", to: "/creator/profile", icon: UserRound },
    { label: "Campaign Marketplace", to: "/creator/marketplace", icon: ShoppingBag, lockedWhenUnverified: true },
    { label: "Settings", to: "/creator/settings", icon: Settings },
  ],
  brand: [
    { label: "Dashboard", to: "/brand", icon: Home },
    { label: "Campaigns", to: "/brand/campaigns", icon: FileText, lockedWhenUnverified: true },
    { label: "Discover Creators", to: "/discover-creators", icon: Users, lockedWhenUnverified: true },
    { label: "Shortlists", to: "/brand/Shortlists", icon: Building2 },
    { label: "Settings", to: "/brand/settings", icon: Settings },
  ],
};

export function SideBar({ isVerified = false, mode = "creator" }: { isVerified?: boolean; mode?: SidebarMode }) {
  const navItems = navByMode[mode];
  console.log(window.location.pathname)

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] flex-col border-r border-[#eef1f6] bg-[#f5f7ff] lg:flex">
      <div className="px-16 pb-10 pt-6">
        <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
      </div>

      <nav className="grid gap-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const locked = item.lockedWhenUnverified && !isVerified;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={
                `flex h-[46px] items-center gap-3 rounded-lg px-4 text-[15px] font-semibold transition ${
                   window.location.pathname == item.to
                    ? "bg-[#dfe7ff] text-[#2d30ff]"
                    : "text-[#657084] hover:bg-white hover:text-[#2d30ff]"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {locked ? <Building2 className="h-4 w-4 text-[#7c8798]" /> : null}
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
