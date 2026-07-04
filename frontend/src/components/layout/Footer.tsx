import { Link } from "react-router-dom";
import { ColluneLogo } from "./Navbar";

const footerLinks = [
  { label: "About Collune", href: "/about-collune" },
  { label: "For Creators", href: "/creative-services-terms" },
  { label: "For Brands", href: "/brand-services-terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];

const Footer = () => {
  return (
    <footer id="resources" className="bg-white px-6 py-16 text-[#31436d] md:px-10 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_auto]">
        <div>
          <ColluneLogo />
          <p className="mt-5 max-w-xs text-[15px] font-extrabold leading-tight text-[#6d7a9b]">
            Connecting brands and creators through trust, accountability, and
            meaningful collaboration.
          </p>
        </div>

        <nav className="flex flex-wrap items-start gap-7 pt-4 md:gap-14 md:pt-12" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-black text-[#31436d] transition hover:text-[#214bc0]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="md:col-span-2">
          <div className="flex flex-col gap-8 border-t border-[#dce3f4] pt-8 md:flex-row md:items-center md:justify-between">
            <small className="text-sm font-extrabold text-[#8a96ad]">
              © 2026 Collune. All Rights Reserved.
            </small>
            <div className="flex gap-7" aria-hidden="true">
              <span className="h-14 w-14 rounded-[13px] bg-[#dda0ff]" />
              <span className="h-14 w-14 rounded-[13px] bg-[#809dff]" />
              <span className="h-14 w-14 rounded-[13px] bg-[#303847]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
