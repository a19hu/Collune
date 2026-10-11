import { ArrowRight, MoreVertical, Star, Users } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
export type CampaignBrand = {
  brand_id: string;
  company_name: string;
  logo_url: string | null;
};
export type BrandCardItem = {
  id: string;
  name: string;
  status: string;
  cover_image?: string | null;
  objective?: string;
  applications_received_count?: number;
  recommended_creators_count?: number;
  creators_count?: number;
  updated_at?: string;
};

const statusClasses: Record<string, string> = {
  Draft: 'bg-[#dce9ff] text-[#2f6df6]',
  Submitted: 'bg-[#dce9ff] text-[#2f6df6]',
};

export function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';

  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000)
  );
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'Updated 1 week ago' : `Updated ${weeks} weeks ago`;
}

export const BrandCard = ({
  item,
  index,
  shortlist = false,
  listvisible = false,
  onEdit,
  onDelete,
  brand,
}: {
  item: BrandCardItem;
  index: number;
  shortlist?: boolean;
  listvisible?: boolean;
  onEdit?: (item: BrandCardItem) => void;
  onDelete?: (item: BrandCardItem) => void;
  brand?: CampaignBrand;
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isObjectiveExpanded, setIsObjectiveExpanded] = useState(false);

  const objective = item?.objective?.trim() || '';
  const isLongObjective = objective.length > 300;
  const displayedObjective = isLongObjective
    ? objective.slice(0, 300).trimEnd() + '...'
    : objective;

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node))
        setIsMenuOpen(false);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [isMenuOpen]);

  return (
    <>
      <Panel className="group min-w-0 w-[450px] overflow-hidden rounded-2xl border border-[#e4e9f2] bg-white p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(24,39,75,0.10)]">
        {/* Cover Image */}
        <div className="relative h-[170px] w-full overflow-hidden bg-[#f1f4fa]">
          {item?.cover_image ? (
            <img
              src={item.cover_image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-violet-100">
              <span className="text-3xl font-bold text-indigo-200">
                {item.name?.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradient for overlay readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/20" />

          {/* Floating brand and options */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <Link
              to={`/brands/${brand?.brand_id}`}
              className="inline-flex max-w-[75%] items-center gap-2 rounded-xl border bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md"
            >
              {brand?.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand?.company_name}
                  className="h-7 w-7 shrink-0 rounded-md object-contain"
                />
              ) : null}

              <span className="truncate text-sm font-semibold text-[#263246]">
                {brand?.company_name}
              </span>
            </Link>

            {(!shortlist || onEdit || onDelete) && (
              <div ref={menuRef} className="relative z-20">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsMenuOpen((open) => !open);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 text-[#374151] shadow-sm backdrop-blur-md transition hover:bg-white"
                  aria-label={`${item.name} options`}
                  aria-expanded={isMenuOpen}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-12 z-30 w-36 overflow-hidden rounded-xl border border-[#e5eaf2] bg-white py-1 text-sm shadow-xl">
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onEdit(item);
                        }}
                        className="block w-full px-4 py-2.5 text-left font-medium text-[#374151] hover:bg-[#f5f7fb]"
                      >
                        {shortlist ? 'Open shortlist' : 'Edit'}
                      </button>
                    ) : null}

                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDelete(item);
                        }}
                        className="block w-full px-4 py-2.5 text-left font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-4">
            <StatusPill label={item.status} />
          </div>
        </div>

        <div className="flex min-h-[195px] flex-col p-2">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-[#182230]">
            {item.name}
          </h3>
          {objective && (
            <div className="mt-2 mb-2">
              <p className="line-clamp-3 text-[13px] leading-[21px] text-[#667085]">
                {displayedObjective}
              </p>

              {isLongObjective && !shortlist && (
                <button
                  type="button"
                  onClick={() => navigate(`/brand/campaigns/${item.id}`)}
                  className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-[#5635f5] transition hover:text-[#3213cd]"
                >
                  See more
                </button>
              )}
            </div>
          )}

          {shortlist ? (
            <div className="mt-4 flex items-center gap-2 text-[#667085]">
              <Users className="h-5 w-5 text-[#4b22ff]" />
              <span className="text-sm font-medium">
                {item.creators_count} Creators
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eeeaff]">
                  <Users className="h-5 w-5 text-[#5635f5]" />
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight text-[#182230]">
                    {item.applications_received_count ?? 0}
                  </p>
                  <p className="text-xs text-[#667085]">Applications</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fff3dc]">
                  <Star className="h-5 w-5 text-[#f5a000]" />
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight text-[#182230]">
                    {item.recommended_creators_count ?? 0}
                  </p>
                  <p className="text-xs text-[#667085]">Recommended</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between gap-2 border-t border-[#edf0f5] pt-4">
              {listvisible ? (
                <span className="text-xs text-[#98a2b3]">
                  {formatUpdatedAt(item.updated_at)}
                </span>
              ) : (
                <span className="text-xs text-[#98a2b3]">Details</span>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    shortlist
                      ? `/brand/shortlists/${item.id}`
                      : `/brand/campaigns/${item.id}`
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#5635f5] transition hover:text-[#3213cd]"
              >
                View {shortlist ? 'Shortlist' : 'Campaign'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
};

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[#dfe5ee] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}
    >
      {children}
    </section>
  );
}

/** Shared campaign shell for creator-facing campaign lists. */
export function CreatorCampaignCard({
  title,
  objective,
  coverImage,
  brand,
  status,
  meta,
  onOpen,
  actions,
}: {
  title: string;
  objective?: string;
  coverImage?: string | null;
  brand: CampaignBrand;
  status: string;
  meta?: string;
  onOpen: () => void;
  actions?: ReactNode;
}) {
  return (
    <Panel className="group min-w-0 overflow-hidden rounded-2xl border border-[#e4e9f2] p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(24,39,75,0.10)]">
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-50 to-violet-100">
        <button type="button" onClick={onOpen} className="absolute inset-0 h-full w-full text-left">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/20" />
        </button>
        {brand.brand_id ? <Link to={`/brands/${brand.brand_id}`} className="absolute left-4 top-4 inline-flex max-w-[75%] items-center gap-2 rounded-xl border bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md transition hover:bg-white">
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt=""
              className="h-7 w-7 rounded-md object-contain"
            />
          ) : null}
          <span className="truncate text-sm font-semibold text-[#263246]">
            {brand.company_name}
          </span>
        </Link> : <span className="absolute left-4 top-4 inline-flex max-w-[75%] items-center gap-2 rounded-xl border bg-white/95 px-3 py-2 shadow-sm backdrop-blur-md"><span className="truncate text-sm font-semibold text-[#263246]">{brand.company_name}</span></span>}
        <span className="absolute bottom-4 left-4 inline-flex rounded-lg bg-white/95 px-3 py-1.5 text-xs font-black text-[#3048ff]">
          {status}
        </span>
      </div>
      <div className="flex min-h-[190px] flex-col p-5">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 text-lg font-bold text-[#182230]">
            {title}
          </h3>
        </button>
        <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#667085]">
          {objective || 'Campaign details will be available shortly.'}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] pt-4">
          <span className="text-xs text-[#98a2b3]">
            {meta || 'View details'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#5635f5]"
            >
              View <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex h-7 w-max items-center rounded-lg px-4 text-sm font-black ${statusClasses[label] || 'bg-[#dce9ff] text-[#2f6df6]'}`}
    >
      {label}
    </span>
  );
}
