import { ArrowRight, MoreVertical, Star, Users } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";
export type BrandCardItem = {
    id: string;
    name: string;
    status: string;
    applications_received_count?: number;
    recommended_creators_count?: number;
    creators_count?: number;
    updated_at?: string;
}

const statusClasses: Record<string, string> = {
    Draft: "bg-[#dce9ff] text-[#2f6df6]",
    Submitted: "bg-[#dce9ff] text-[#2f6df6]",
};

const campaignIconStyles = [
    "bg-[#ebe5ff] text-[#6a75ff]",
    "bg-[#ffe1e5] text-[#ef4444]",
    "bg-[#fff0bc] text-[#d78a00]",
];

export function formatUpdatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Updated recently";

    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 7) return `Updated ${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "Updated 1 week ago" : `Updated ${weeks} weeks ago`;
}


export const BrandCard = ({
    item,
    index,
    shortlist = false,
    listvisible = false,
    onEdit,
    onDelete,
}: {
    item: BrandCardItem,
    index: number,
    shortlist?: boolean,
    listvisible?: boolean,
    onEdit?: (item: BrandCardItem) => void,
    onDelete?: (item: BrandCardItem) => void,
}) => {

    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isMenuOpen) return;
        const closeMenu = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
        };
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, [isMenuOpen]);

    return (
        <>
            <Panel className="min-h-[294px] p-6">
                <div className="flex items-start justify-between">
                    <span className={`grid h-12 w-12 place-items-center rounded-full ${campaignIconStyles[index % campaignIconStyles.length]}`}>
                        {/* <Icon className="h-6 w-6" /> */}
                    </span>
                    {!shortlist ? (
                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsMenuOpen((open) => !open);
                                }}
                                className="grid h-9 w-9 place-items-center rounded-lg text-[#657084] hover:bg-[#f3f6fa]"
                                aria-label={`${item.name} options`}
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>
                            {isMenuOpen ? (
                                <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-lg border border-[#dfe5ee] bg-white py-1 text-sm font-black text-[#303948] shadow-[0_18px_36px_rgba(32,42,70,0.14)]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onEdit?.(item);
                                        }}
                                        className="block w-full px-4 py-2 text-left hover:bg-[#f5f7fb]"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onDelete?.(item);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-[#d23b3b] hover:bg-[#fff1f1]"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <h3 className="mt-7 min-h-[58px] text-[21px] font-black leading-snug text-black">{item.name}</h3>
                {
                    shortlist ?
                        <>
                            <p className="mt-4 text-base font-medium text-[#657084]">{item.creators_count} Creators</p>
                            <div className="mt-5">
                                <StatusPill label={item.status} />
                            </div>
                        </>
                        :
                        <>
                            <div className="mt-3">
                                <StatusPill label={item.status} />
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-4 text-base text-[#657084]">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-[#4b22ff]" />
                                    <div>
                                        <strong className="block text-base font-medium text-[#657084]">{item.applications_received_count}</strong>
                                        <span>Applications</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Star className="h-5 w-5 text-[#ff9f00]" />
                                    <div>
                                        <strong className="block text-base font-medium text-[#657084]">{item.recommended_creators_count}</strong>
                                        <span>Recommended</span>
                                    </div>
                                </div>

                            </div>
                        </>
                }
                {
                    listvisible ?
                        <div className="mt-5 flex items-center justify-between border-t border-[#e4ebf4] pt-5">
                            <span className="text-sm font-medium text-[#63728a]">{formatUpdatedAt(item.updated_at)}</span>
                            <button type="button" onClick={() => shortlist ? navigate(`/brand/shortlists/${item.id}`):navigate(`/brand/campaigns/${item.id}`)} className="inline-flex items-center gap-2 text-sm font-black text-[#2f16ff]">
                                View {shortlist ? "Shortlist":"Campaign"} <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                        :
                        <button type="button"
                            onClick={() => shortlist ? navigate(`/brand/shortlists/${item.id}`):navigate(`/brand/campaigns/${item.id}`)}
                            className="mt-5 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
                            View {shortlist ? "Shortlist":"Campaign"} <ArrowRight className="h-4 w-4" />
                        </button>
                }
            </Panel>


        </>
    )
}



export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-xl border border-[#dfe5ee] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
            {children}
        </section>
    );
}

export function StatusPill({ label }: { label: string }) {
    return (
        <span className={`inline-flex h-7 w-max items-center rounded-lg px-4 text-sm font-black ${statusClasses[label] || "bg-[#dce9ff] text-[#2f6df6]"}`}>
            {label}
        </span>
    );
}
