import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type CreatorProfileApi = {
    id?: string;
    creator_id: string | null;
    display_name?: string;
    category?: string;
    profile_image?: string;
    verified?: boolean | string;
    username?: string;
}


export function CreatorCard({ creator, index,key }: { creator: CreatorProfileApi; index: number,key?:number}) {
  const [showPrivateToast, setShowPrivateToast] = useState(false);
  const imageUrl =  creator.profile_image || `https://i.pravatar.cc/640?img=${(index % 70) + 1}`;
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
        <img src={imageUrl} alt={creator.display_name} className="h-full w-full object-cover" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[9px] font-black text-[#7690ff]">
          <BadgeCheck className="h-3 w-3 fill-current" />
          {isVerified ? "verified" :  "pending"}
        </span>
        {/* <span className="absolute right-2.5 top-2.5 grid h-6 min-w-6 place-items-center rounded-full bg-white/85 px-1 text-xs font-black text-[#9aa6bc]">
          {creator.audience_size ? `${Math.round(creator.audience_size / 1000)}k` : "i"}
        </span> */}
      </div>
      <div className="px-4 py-3">
        <h3 className="inline text-lg font-black text-[#314064]">{creator.display_name}</h3>
        {username ? <p className="ml-1 inline text-xs font-extrabold text-[#7b8aaa]">@{username}</p> : null}
        <strong className="mt-1 block text-xs font-black text-[#3158ca]">{creator.category}</strong>
        <span className="block text-xs font-black text-[#8a96b1] mt-2">Worked with:</span>
        {/* <div className="mt-2 grid grid-cols-3 gap-2">
          {(chips.length ? chips : ["Creator"]).map((chip) => (
            <span key={chip} className="grid min-h-6 place-items-center rounded-full bg-[#eef3ff] px-2 text-center text-[10px] font-black text-[#60749e]">
              {chip}
            </span>
          ))}
        </div> */}
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
    </article>
  );
}
