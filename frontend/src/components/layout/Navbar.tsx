import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/Logo.svg";

export function ColluneLogo() {
  return (
    <a href="/" aria-label="Collune home" className="flex items-center gap-2 text-[#214bc0]">
      <img src={logo} alt="Collune" className="h-[53px] w-[167px]" />
    </a>
  );
}

const navItems = [
  {
    label: "Creators",
    items: [
      { label: "Discover Creators", href: "/discover-creators" },
      { label: "Featured Creators", href: "/featured-creators" },
    ],
  },
  {
    label: "Brands",
    items: [{ label: "Success Stories", href: "/success-stories" }],
  },
  { label: "How it Works", href: "/#how-it-works" },
  {
    label: "Resources",
    items: [
      { label: "Blogs", href: "/blogs" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  { label: "About", href: "/#about" },
];

const Navbar = () => {
  return (
    <header className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-7xl -translate-x-1/2 md:top-5">
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <ColluneLogo />

        <nav className="hidden items-center gap-8 rounded-full border border-[#dce5fb] bg-white/85 px-11 py-4 shadow-[0_16px_34px_rgba(69,96,170,0.1)] backdrop-blur-xl lg:flex">
          {navItems.map((item) =>
            item.items ? (
              <div className="group relative" key={item.label}>
                <button type="button" className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#34466d] transition hover:text-[#214bc0]">
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-8 w-52 -translate-x-1/2 rounded-2xl border border-[#dce5fb] bg-white p-2 opacity-0 shadow-[0_18px_40px_rgba(45,66,140,0.14)] transition group-hover:visible group-hover:opacity-100">
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

        <Link to="/login" className="inline-flex min-h-10 items-center justify-center gap-2 justify-self-end rounded-full border border-[#dce5fb] bg-white/75 px-5 text-sm font-black text-[#2b55c7] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
          Log In
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
