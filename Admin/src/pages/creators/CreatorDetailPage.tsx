import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Globe,
  Instagram,
  Youtube,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Ban,
  FileText,
  DollarSign,
  Megaphone,
  Mail,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Creator, Campaign, VerificationStatus } from '../../types';
import { creatorService } from '../../services/creatorService';
import { campaignService } from '../../services/campaignService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCompactNumber, formatCurrency, formatDate } from '../../utils/formatters';

interface CreatorDetailPageProps {
  creatorId: string;
  onRouteChange: (route: string) => void;
}

export const CreatorDetailPage: React.FC<CreatorDetailPageProps> = ({
  creatorId,
  onRouteChange,
}) => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'socials' | 'kyc' | 'campaigns'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const [verifyModal, setVerifyModal] = useState<VerificationStatus | null>(null);
  const [suspendModal, setSuspendModal] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const c = await creatorService.getCreatorById(creatorId);
      if (c) {
        setCreator(c);
        const allCampaigns = await campaignService.getCampaigns();
        // find campaigns matching category or mock
        setCampaigns(allCampaigns.slice(0, 3));
      }
    } catch (err: any) {
      error('Failed to load creator', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [creatorId]);

  const handleVerify = async () => {
    if (!creator || !verifyModal) return;
    try {
      await creatorService.verifyCreator(creator.id, verifyModal);
      const act = verifyModal === 'Verified' ? 'VERIFY' : 'REJECT';
      await logAdminAction(
        act,
        'Creators',
        `${act === 'VERIFY' ? 'Approved' : 'Rejected'} KYC verification for ${creator.name}`,
        creator.id
      );
      success('KYC Updated', `${creator.name} is now ${verifyModal}.`);
      setVerifyModal(null);
      loadData();
    } catch (err: any) {
      error('Failed to verify', err.message);
    }
  };

  const handleToggleStatus = async () => {
    if (!creator) return;
    const newStatus = creator.accountStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await creatorService.updateStatus(creator.id, newStatus);
      await logAdminAction(
        newStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE',
        'Creators',
        `Changed creator status to ${newStatus} for ${creator.name}`,
        creator.id
      );
      success('Account Status Updated', `${creator.name} is now ${newStatus}.`);
      setSuspendModal(false);
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

  if (!creator) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Creator Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested creator profile does not exist.</p>
        <button
          onClick={() => onRouteChange('/admin/creators')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Back to Creator Directory
        </button>
      </div>
    );
  }

  const socialChannels = creator.socials || (creator as any).socialAccounts || [];
  const baseCommercialPrice = (creator as any).basePrice || 75000;
  const memberSince = creator.joinedAt || (creator as any).joinedDate || new Date().toISOString();

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => onRouteChange('/admin/creators')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Creator Directory</span>
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{creator.name}</h1>
                <StatusBadge status={creator.verificationStatus} />
                <StatusBadge status={creator.accountStatus} />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-mono">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{creator.handle}</span>
                <span>•</span>
                <span>{creator.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400 font-sans">
                  <MapPin className="w-3.5 h-3.5" />
                  {creator.location}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl line-clamp-2 pt-1 font-sans">
                {creator.bio}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <PermissionGuard permission="creators.verify">
              {creator.verificationStatus !== 'Verified' && (
                <button
                  onClick={() => setVerifyModal('Verified')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve KYC</span>
                </button>
              )}
              {creator.verificationStatus === 'Pending' && (
                <button
                  onClick={() => setVerifyModal('Rejected')}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject KYC</span>
                </button>
              )}
            </PermissionGuard>

            <PermissionGuard permission="creators.edit">
              <button
                onClick={() => setSuspendModal(true)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  creator.accountStatus === 'Active'
                    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{creator.accountStatus === 'Active' ? 'Deactivate Creator' : 'Reactivate Creator'}</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Highlight Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Reach
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCompactNumber(creator.totalFollowers)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {creator.primaryEngagementRate}% Primary ER
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Niche Category
            </div>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
              {creator.category}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {creator.languages?.slice(0, 2).join(', ')}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Joined Platform
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatDate(memberSince)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Collune ID #{creator.id}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Demographics
          </button>
          <button
            onClick={() => setActiveTab('socials')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'socials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Connected Channels ({socialChannels.length})
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'kyc'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>KYC & Verification</span>
            <span
              className={`w-2 h-2 rounded-full ${
                creator.verificationStatus === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'campaigns'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Campaign History ({campaigns.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personal & Audience Demographics
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{creator.email}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{creator.phone}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Location Base</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{creator.location}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Content Languages</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {creator.languages?.join(', ')}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Base Commercial Rate</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatCurrency(baseCommercialPrice)} / Deliverable
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Commercial Deliverables Summary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard content deliverables supported by this creator on the Collune campaign marketplace.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-slate-500">Instagram Reel</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(baseCommercialPrice)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-slate-500">Instagram Story Set (3x)</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(baseCommercialPrice * 0.45)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-slate-500">YouTube Dedicated Video</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(baseCommercialPrice * 2.2)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-slate-500">YouTube Short / Integration</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                  {formatCurrency(baseCommercialPrice * 0.8)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'socials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialChannels.map((acc: any, idx: number) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {acc.platform}
                    </h4>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {acc.handle}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-semibold border border-emerald-200 dark:border-emerald-800">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Followers</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatCompactNumber(acc.followers || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Engagement</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {acc.engagementRate || 0}%
                  </div>
                </div>
              </div>
            </div>
          ))}
          {socialChannels.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No connected social channels found for this creator.
            </div>
          )}
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                KYC & Legal Documentation Review
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identity verification documents submitted for tax compliance and payouts.
              </p>
            </div>
            <StatusBadge status={creator.verificationStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Document Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(creator as any).kycDetails?.documentType || 'Aadhaar Card / PAN'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Document ID Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {(creator as any).kycDetails?.documentNumber || 'XXXX-XXXX-8921'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Submission Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate((creator as any).kycDetails?.submittedAt || memberSince)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reviewing Officer</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {(creator as any).kycDetails?.verifiedBy || 'Rohan Deshmukh (Creator Ops)'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
              <FileText className="w-8 h-8 text-indigo-500" />
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Verified Document Attachment
              </div>
              <p className="text-[11px] text-slate-400">
                Aadhaar_Front_Back_{creator.id}.pdf (2.4 MB)
              </p>
              <button
                onClick={() => success('Preview opened', 'Simulated viewing encrypted KYC scan')}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Inspect Official ID Scan →
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Campaign Collaborations
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {campaigns.map((cmp) => (
              <div
                key={cmp.id}
                onClick={() => onRouteChange(`/admin/campaigns/${cmp.id}`)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {cmp.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span>Brand: {cmp.brandName}</span> • <span className="font-mono">{cmp.campaignCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(cmp.budget / cmp.creatorsRequired)}
                  </span>
                  <StatusBadge status={cmp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verify Dialog */}
      <ConfirmDialog
        isOpen={!!verifyModal}
        onClose={() => setVerifyModal(null)}
        onConfirm={handleVerify}
        title={`${verifyModal === 'Verified' ? 'Approve' : 'Reject'} KYC for ${creator.name}?`}
        description={
          verifyModal === 'Verified'
            ? 'The creator will receive a verified checkmark and be eligible for brand campaigns.'
            : 'The creator will receive a rejection notice with guidance on re-submitting valid documents.'
        }
        confirmText={verifyModal === 'Verified' ? 'Approve KYC' : 'Reject KYC'}
        variant={verifyModal === 'Verified' ? 'primary' : 'danger'}
      />

      {/* Status Dialog */}
      <ConfirmDialog
        isOpen={suspendModal}
        onClose={() => setSuspendModal(false)}
        onConfirm={handleToggleStatus}
        title={`${creator.accountStatus === 'Active' ? 'Deactivate' : 'Reactivate'} ${creator.name}?`}
        description={
          creator.accountStatus === 'Active'
            ? 'The creator will be deactivated and unable to bid or submit campaign content.'
            : 'The creator will regain full platform access.'
        }
        confirmText={creator.accountStatus === 'Active' ? 'Deactivate Account' : 'Reactivate Account'}
        variant={creator.accountStatus === 'Active' ? 'warning' : 'primary'}
      />
    </div>
  );
};
