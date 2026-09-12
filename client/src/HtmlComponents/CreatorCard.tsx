import { ArrowRight, BadgeCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { CreatorListItemApi } from "../types";

type CreatorProfileApi = Omit<Partial<CreatorListItemApi>, "verified"> & {
    id?: string;
    creator_id: string | null;
    display_name?: string;
    category?: string;
    profile_image?: string | null;
    verified?: boolean | string;
    username?: string;
}


export function CreatorCard({
  creator,
  index,
  isBrand,
}: {
  creator: CreatorProfileApi;
  index: number;
  key?: string | number;
  isBrand?: boolean;
}) {
  const [showPrivateToast, setShowPrivateToast] = useState(false);
  const imageUrl = creator.profile_image;
  const username = creator.username ;
  const isVerified = creator.verified === true || creator.verified === "VERIFIED";
  const isPrivate = !creator.creator_id;

  useEffect(() => {
    if (!showPrivateToast) return;
    const timer = window.setTimeout(() => setShowPrivateToast(false), 2600);
    return () => window.clearTimeout(timer);
  }, [showPrivateToast]);

  return (
    <article className="relative overflow-hidden rounded-lg border border-[#e0e7fb] bg-white text-left shadow-[0_14px_32px_rgba(41,64,132,0.09)]">
      {showPrivateToast ? (
        <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border border-[#ffd8d8] bg-white px-4 py-3 text-center text-xs font-black text-[#b42318] shadow-[0_12px_24px_rgba(41,64,132,0.14)]">
          This profile is private.
        </div>
      ) : null}
      <div className="relative aspect-[1.55] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={creator.display_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#eef3ff_0%,#f7f9ff_45%,#ebe7ff_100%)] text-[#93a3d8]">
            <div className="flex flex-col items-center gap-3">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-white/80 shadow-[0_10px_24px_rgba(93,114,191,0.12)]">
                <UserRound className="h-10 w-10" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a99c2]">
                {isVerified ? "Creator" : "Pending Profile"}
              </span>
            </div>
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[9px] font-black text-[#7690ff] backdrop-blur-sm">
          {isVerified ? <BadgeCheck className="h-3 w-3" /> : null}
          {isVerified ? "verified" :  "pending"}
        </span>
      </div>
      <div className="px-4 py-3">
        <h3 className="inline text-lg font-black text-[#314064]">{creator.display_name}</h3>
        {username ? <p className="ml-1 inline text-xs font-extrabold text-[#7b8aaa]">@{username}</p> : null}
        <strong className="mt-1 block text-xs font-black text-[#3158ca]">{creator.category}</strong>
      </div>
      {isPrivate ? (
        <button
          type="button"
          onClick={() => setShowPrivateToast(true)}
          className="flex min-h-10 w-full items-center justify-center gap-1 border-t border-[#edf1fb] text-[13px] font-black text-[#3356c5]"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Link to={`/creator_profile/${creator.creator_id}`} className="flex min-h-10 items-center justify-center gap-1 border-t border-[#edf1fb] text-[13px] font-black text-[#3356c5]">
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
      {isBrand ? (
        <div className="grid gap-2 border-t border-[#edf1fb] p-3 text-xs font-bold text-[#3356c5]">
          {isPrivate ? <button type="button" disabled className="rounded border border-[#d8e2fb] p-2 opacity-40">Message</button> : <Link to={`/brand/chat?creatorId=${creator.creator_id}`} className="rounded border border-[#d8e2fb] p-2 text-center text-[13px]">Message</Link>}
        </div>
      ) : null}
    </article>
  );
}
