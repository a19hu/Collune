import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/Logo.svg";

export function ColluneLogo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} aria-label="Collune home" className="flex items-center gap-2 text-[#214bc0]">
      <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
    </Link>
  );
}

const navItems = [
  {
    label: "Creators",
    items: [
      { label: "Discover Creators", href: "/discover-creators" },
      { label: "Featured Creators", href: "/#featured-creators" },
    ],
  },
  {
    label: "Brands",
    items: [
      { label: "Success Stories", href: "/success-stories" },
    ],
  },
  { label: "How it Works", href: "/#how-it-works" },
  {
    label: "Resources",
    items: [
      { label: "Blogs", href: "/blogs" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  { label: "About", href: "/about-collune" },
];

const Navbar = () => {
  const location = useLocation();
  const { currentUser, isAuthLoading, logout } = useAuth();
  const dashboardPath = currentUser?.role === "Brand" ? "/brand" : currentUser?.role === "Creator" ? "/creator" : "/admin";
  const userInitial = currentUser?.name?.trim().charAt(0).toUpperCase() || currentUser?.email?.trim().charAt(0).toUpperCase() || "U";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-7xl -translate-x-1/2 md:top-5">
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <ColluneLogo to={'/#top'} />

        <nav className="hidden items-center gap-8 rounded-full border border-[#dce5fb] bg-white/85 px-11 py-4 shadow-[0_16px_34px_rgba(69,96,170,0.1)] backdrop-blur-xl lg:flex">
          {navItems.map((item) =>
            item.items ? (
              <div className="group relative py-2" key={item.label}>
                <button type="button" className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#34466d] transition hover:text-[#214bc0]">
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-full w-52 -translate-x-1/2 rounded-2xl border border-[#dce5fb] bg-white p-2 opacity-0 shadow-[0_18px_40px_rgba(45,66,140,0.14)] transition group-hover:visible group-hover:opacity-100">
                  {item.items.map((subItem) => (
                    <Link key={subItem.label} to={subItem.href} className="block rounded-xl px-4 py-3 text-sm font-black text-[#34466d] transition hover:bg-[#eef3ff] hover:text-[#214bc0]">
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.label} to={item.href} className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#34466d] transition hover:text-[#214bc0]">
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {isAuthLoading ? (
          <span className="h-11 w-32 justify-self-end rounded-full border border-[#dce5fb] bg-white/60" />
        ) : currentUser ? (
          <div className="flex items-center justify-self-end gap-2">
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((current) => !current)}
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full bg-white/75 px-3 text-sm font-black text-[#2449bd] backdrop-blur transition hover:bg-white"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1438c8] text-white">
                  {userInitial}
                </span>
                <span className="hidden max-w-[150px] truncate sm:inline">{currentUser.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`${isUserMenuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"} absolute right-0 top-12 w-56 rounded-2xl border border-[#dce5fb] bg-white p-2 shadow-[0_18px_40px_rgba(45,66,140,0.14)] transition`}
              >
                <Link
                  to={dashboardPath}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-black text-[#34466d] transition hover:bg-[#eef3ff] hover:text-[#214bc0]"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    void logout();
                  }}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-black text-[#b42318] transition hover:bg-[#fff0f0]"
                >
                  Sign out
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dce5fb] bg-white/80 text-[#2449bd] shadow-sm backdrop-blur transition hover:bg-white lg:hidden"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-self-end gap-2">
            <Link to="/login" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#dce5fb] bg-white/75 px-5 text-sm font-black text-[#2b55c7] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
              Log In
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dce5fb] bg-white/80 text-[#2449bd] shadow-sm backdrop-blur transition hover:bg-white lg:hidden"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      <div
        id="mobile-navigation"
        className={`${isMobileMenuOpen ? "pointer-events-auto visible mt-3 translate-y-0 opacity-100" : "pointer-events-none invisible mt-1 -translate-y-2 opacity-0"} rounded-[28px] border border-[#dce5fb] bg-white/95 p-4 shadow-[0_18px_40px_rgba(45,66,140,0.14)] backdrop-blur-xl transition duration-200 lg:hidden`}
      >
        <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
          {navItems.map((item) =>
            item.items ? (
              <div key={item.label} className="rounded-2xl border border-[#e8eefc] bg-[#f8faff] px-4 py-3">
                <p className="text-sm font-black text-[#17327c]">{item.label}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.label}
                      to={subItem.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-[#34466d] transition hover:bg-[#eef3ff] hover:text-[#214bc0]"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-[#e8eefc] px-4 py-3 text-sm font-black text-[#17327c] transition hover:bg-[#eef3ff] hover:text-[#214bc0]"
              >
                {item.label}
              </Link>
            ),
          )}

          {currentUser ? (
            <div className="mt-2 flex flex-col gap-2 border-t border-[#e8eefc] pt-3">
              <Link
                to={dashboardPath}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl bg-[#1438c8] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#102fa8]"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  void logout();
                }}
                className="rounded-2xl border border-[#ffd8d5] px-4 py-3 text-sm font-black text-[#b42318] transition hover:bg-[#fff0f0]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1438c8] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102fa8]"
            >
              Log In
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
