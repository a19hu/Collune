import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { ColluneLogo } from "./Navbar";

const footerLinks = [
  { label: "About Collune", href: "/about-collune" },
  { label: "For Creators", href: "/creative-services-terms" },
  { label: "For Brands", href: "/brand-services-terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];

function XIcon({ className }: { className?: string }) {
  return <span className={className}>X</span>;
}

const socialTiles = [
  { label: "Instagram", color: "bg-[#f77737]", href: "https://www.instagram.com/thecollune/", icon: Instagram },
  { label: "LinkedIn", color: "bg-[#0a66c2]", href: "https://www.linkedin.com/company/thecollune/", icon: Linkedin },
  { label: "X (Twitter)", color: "bg-[#111827]", href: "https://x.com/thecollune", icon: XIcon },
  { label: "YouTube", color: "bg-[#ff0000]", href: "https://www.youtube.com/@thecollune", icon: Youtube },
  { label: "Facebook", color: "bg-[#1877f2]", href: "https://www.facebook.com/thecollune", icon: Facebook },
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
            <div className="flex flex-wrap gap-4" aria-label="Social platforms">
              {socialTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <a
                    key={tile.label}
                    href={tile.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={tile.label}
                    className={`grid h-14 w-14 place-items-center rounded-[13px] ${tile.color} text-white transition hover:scale-105`}
                    title={tile.label}
                  >
                    <Icon className="text-lg font-black leading-none" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
