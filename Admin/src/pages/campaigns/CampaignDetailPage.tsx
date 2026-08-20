import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Megaphone,
  Building2,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Edit2,
  Pause,
  Play,
  Download,
} from 'lucide-react';
import { Campaign, Creator, CampaignStatus } from '../../types';
import { campaignService } from '../../services/campaignService';
import { creatorService } from '../../services/creatorService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { CampaignFormModal } from './CampaignFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatCompactNumber } from '../../utils/formatters';

interface CampaignDetailPageProps {
  campaignId: string;
  onRouteChange: (route: string) => void;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({
  campaignId,
  onRouteChange,
}) => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [activeTab, setActiveTab] = useState<'creators' | 'deliverables' | 'analytics'>('creators');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<CampaignStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const c = await campaignService.getCampaignById(campaignId);
      if (c) {
        setCampaign(c);
        const allCreators = await creatorService.getCreators();
        setCreators(allCreators.slice(0, c.creatorsSelected || 6));
      }
    } catch (err: any) {
      error('Failed to load campaign', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const handleStatusChange = async () => {
    if (!campaign || !statusConfirm) return;
    try {
      await campaignService.updateStatus(campaign.id, statusConfirm);
      await logAdminAction(
        'UPDATE',
        'Campaigns',
        `Changed campaign "${campaign.title}" status to ${statusConfirm}`,
        campaign.id
      );
      success('Status Updated', `Campaign marked as ${statusConfirm}.`);
      setStatusConfirm(null);
      loadData();
    } catch (err: any) {
      error('Failed to update status', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Campaign Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested campaign does not exist.</p>
        <button
          onClick={() => onRouteChange('/admin/campaigns')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Back to Campaigns List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => onRouteChange('/admin/campaigns')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campaigns</span>
      </button>

      {/* Header Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{campaign.title}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-mono">
              <span>{campaign.campaignCode}</span>
              <span>•</span>
              <button
                onClick={() => onRouteChange(`/admin/brands/${campaign.brandId}`)}
                className="text-indigo-600 dark:text-indigo-400 font-sans font-semibold hover:underline flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{campaign.brandName}</span>
              </button>
              <span>•</span>
              <span className="font-sans text-slate-600 dark:text-slate-400">{campaign.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGuard permission="campaigns.edit">
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Details</span>
              </button>
            </PermissionGuard>

            <PermissionGuard permission="campaigns.edit">
              {campaign.status === 'Active' ? (
                <button
                  onClick={() => setStatusConfirm('Paused')}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : campaign.status === 'Paused' ? (
                <button
                  onClick={() => setStatusConfirm('Active')}
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              ) : null}

              {campaign.status !== 'Completed' && (
                <button
                  onClick={() => setStatusConfirm('Completed')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </button>
              )}
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Budget
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
              {formatCurrency(campaign.budget)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Escrow Funded & Locked
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Creator Slots
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {campaign.creatorsSelected || creators.length} / {campaign.creatorsRequired}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">100% Filled Capacity</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Timeline Window
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatDate(campaign.startDate)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ends {formatDate(campaign.endDate)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Est. Total Impressions
            </div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              4.8M+
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Estimated cumulative views</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('creators')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'creators'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Assigned Influencers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {creators.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'deliverables'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Required Deliverables ({campaign.deliverables.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Live Performance Metrics
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'creators' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Influencer Participants
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Allocated Payout: {formatCurrency(campaign.budget / (campaign.creatorsRequired || 1))} / Creator
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {creators.map((c, i) => (
              <div
                key={c.id}
                onClick={() => onRouteChange(`/admin/creators/${c.id}`)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.name}</div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {c.handle} • {formatCompactNumber(c.totalFollowers)} Followers
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Content Submitted & Approved
                  </span>
                  <StatusBadge status={c.verificationStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'deliverables' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Required Contract Deliverables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaign.deliverables.map((deliv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {typeof deliv === 'string' ? deliv : deliv.title || `${deliv.quantity}x ${deliv.platform} ${deliv.type}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Requires brand pre-approval before live posting. Includes 30-day link in bio.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Video Views</span>
              <Eye className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              3,482,900
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">+24% vs Benchmark</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Audience Likes</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              214,800
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct engagement</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Comments & Inquiries</span>
              <MessageSquare className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              18,420
            </div>
            <div className="text-[11px] text-slate-400 mt-1">High purchase intent</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Shares & Saves</span>
              <Share2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              42,910
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Viral reach multiplier</div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <CampaignFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        campaignToEdit={campaign}
        onSuccess={loadData}
      />

      {/* Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={handleStatusChange}
        title={`Set Campaign to ${statusConfirm}?`}
        description={`This will change the campaign status to ${statusConfirm}.`}
        confirmText="Confirm Status Change"
        variant={statusConfirm === 'Completed' ? 'primary' : 'warning'}
      />
    </div>
  );
};
