import facebookIcon from "../../assets/icons8-facebook.svg";
import instagramIcon from "../../assets/icons8-instagram.svg";
import linkedinIcon from "../../assets/icons8-linkedin.svg";
import xIcon from "../../assets/icons8-x.svg";
import youtubeIcon from "../../assets/icons8-youtube.svg";

const iconSources: Record<string, string> = {
  INSTAGRAM: instagramIcon,
  YOUTUBE: youtubeIcon,
  FACEBOOK: facebookIcon,
  LINKEDIN: linkedinIcon,
  X: xIcon,
  TWITTER: xIcon,
};

function normalizePlatform(platform: string) {
  return platform.trim().toUpperCase().replace(/\s*\/?\s*TWITTER/g, "").replace(/\s+/g, "");
}

export function SocialPlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  const source = iconSources[normalizePlatform(platform)];
  return source ? <img src={source} alt="" aria-hidden="true" className={`object-contain ${className}`} /> : null;
}
