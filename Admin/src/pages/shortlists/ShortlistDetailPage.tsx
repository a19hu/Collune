import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, Target, StickyNote, Wallet, Calendar, Layers } from 'lucide-react';
import { Shortlist } from '../../types';
import { shortlistService } from '../../services/shortlistService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

interface ShortlistDetailPageProps {
  shortlistId: string;
  onRouteChange: (route: string) => void;
}

export const ShortlistDetailPage: React.FC<ShortlistDetailPageProps> = ({ shortlistId, onRouteChange }) => {
  const { error } = useToast();

  const [shortlist, setShortlist] = useState<Shortlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const s = await shortlistService.getShortlistById(shortlistId);
      setShortlist(s);
    } catch (err: any) {
      error('Failed to load shortlist', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shortlistId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!shortlist) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Shortlist Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested shortlist does not exist.</p>
        <button
          onClick={() => onRouteChange('/admin/shortlists')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl cursor-pointer"
        >
          Back to Shortlists List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => onRouteChange('/admin/shortlists')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shortlists</span>
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={shortlist.brandLogo}
              alt={shortlist.brandName}
              className="w-16 h-16 rounded-2xl object-contain bg-slate-50 dark:bg-slate-800 p-2 border-2 border-indigo-500/20 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{shortlist.title}</h1>
                <StatusBadge status={shortlist.status} />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-mono">
                <span>{shortlist.shortlistCode}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400 font-sans">
                  <Building2 className="w-3.5 h-3.5" />
                  {shortlist.brandName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400 font-sans">
                  <Users className="w-3.5 h-3.5" />
                  {shortlist.creators.length} Creators
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Purpose
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{shortlist.purpose || 'Not specified.'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5" />
            Notes for Collune
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{shortlist.notes || 'No notes added.'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Budget Range
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{shortlist.budgetRange || 'Not specified.'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Timeline
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {formatDate(shortlist.startDate)} to {formatDate(shortlist.endDate)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Categories &amp; Platforms
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{shortlist.categories || 'Not specified.'}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {shortlist.platforms.map((platform) => (
              <span
                key={platform}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Target Audience
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{shortlist.audience || 'Not specified.'}</p>
        </div>
      </div>

      {/* Creators */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          Selected Creators ({shortlist.creators.length})
        </h3>
        {shortlist.creators.length === 0 ? (
          <p className="text-xs text-slate-500">No creators added to this shortlist yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortlist.creators.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800"
              >
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{creator.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {creator.category} • {creator.platform}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
