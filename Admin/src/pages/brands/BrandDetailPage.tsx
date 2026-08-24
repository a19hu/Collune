import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  User,
  DollarSign,
  Megaphone,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Brand, Campaign, VerificationStatus } from '../../types';
import { brandService } from '../../services/brandService';
import { campaignService } from '../../services/campaignService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface BrandDetailPageProps {
  brandId: string;
  onRouteChange: (route: string) => void;
}

export const BrandDetailPage: React.FC<BrandDetailPageProps> = ({ brandId, onRouteChange }) => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'compliance'>('overview');
  const [verifyModal, setVerifyModal] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const b = await brandService.getBrandById(brandId);
      if (b) {
        setBrand(b);
        const all = await campaignService.getCampaigns();
        setCampaigns(all.filter((c) => c.brandId === b.id || c.brandName === b.name));
      }
    } catch (err: any) {
      error('Failed to load brand', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [brandId]);

  const handleVerify = async () => {
    if (!brand || !verifyModal) return;
    try {
      await brandService.verifyBrand(brand.id, verifyModal);
      const act = verifyModal === 'Verified' ? 'VERIFY' : 'REJECT';
      await logAdminAction(act, 'Brands', `${act === 'VERIFY' ? 'Approved' : 'Rejected'} brand ${brand.name}`, brand.id);
      success('Brand Status Updated', `${brand.name} is now ${verifyModal}.`);
      setVerifyModal(null);
      loadData();
    } catch (err: any) {
      error('Failed to verify brand', err.message);
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

  if (!brand) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Brand Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The requested brand account does not exist.</p>
        <button
          onClick={() => onRouteChange('/admin/brands')}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Back to Brands List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => onRouteChange('/admin/brands')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Brand Directory</span>
      </button>

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="w-18 h-18 rounded-2xl object-contain bg-slate-50 dark:bg-slate-800 p-2 border-2 border-indigo-500/20 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{brand.name}</h1>
                <StatusBadge status={brand.verificationStatus} />
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap font-mono">
                <span>{brand.id}</span>
                <span>•</span>
                <span className="font-sans text-indigo-600 dark:text-indigo-400 font-semibold">
                  {brand.industry}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400 font-sans">
                  <MapPin className="w-3.5 h-3.5" />
                  {brand.address}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl line-clamp-2 pt-1 font-sans">
                {brand.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGuard permission="brands.verify">
              {brand.verificationStatus !== 'Verified' && (
                <button
                  onClick={() => setVerifyModal('Verified')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Brand</span>
                </button>
              )}
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Budget Spend
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
              {formatCurrency(brand.totalSpend)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Verified Enterprise Tier
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Campaigns Run
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {brand.totalCampaigns}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{campaigns.length} in current year</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Contact Email
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
              {brand.email}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{brand.phone}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Website & Portal
            </div>
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-1 truncate"
            >
              <span>{brand.website.replace('https://', '')}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <div className="text-[10px] text-slate-400 mt-0.5">Joined {formatDate(brand.joinedAt)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Contacts
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'campaigns'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Campaigns Portfolio</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
              {campaigns.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Corporate Compliance (GST/CIN)
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Corporate Overview
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Legal Entity Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{brand.name} Private Limited</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Industry Classification</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{brand.industry}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Registered Office</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{brand.address}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Billing Currency</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">INR (₹) / Multi-currency ready</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Assigned Account Manager
            </h3>
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                VM
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Vikram Malhotra
                </div>
                <div className="text-[11px] text-slate-500">Lead Brand Manager • Operations</div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  vikram.brands@collune.com
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Brand Campaigns
            </h3>
            <PermissionGuard permission="campaigns.create">
              <button
                onClick={() => onRouteChange('/admin/campaigns')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Go to Campaigns →
              </button>
            </PermissionGuard>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {campaigns.map((cmp) => (
              <div
                key={cmp.id}
                onClick={() => onRouteChange(`/admin/campaigns/${cmp.id}`)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl px-2 transition-colors cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {cmp.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <span>{cmp.category}</span> • <span>{cmp.creatorsRequired} Creators required</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(cmp.budget)}
                  </span>
                  <StatusBadge status={cmp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            GSTIN & Tax Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-slate-500">GSTIN Identification Number</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                27AAACB2212P1ZX
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold">Active & Validated</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-slate-500">CIN (Corporate Identity Number)</div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                U72200MH2021PTC364812
              </div>
              <div className="text-[10px] text-slate-400">Incorporated with MCA India</div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!verifyModal}
        onClose={() => setVerifyModal(null)}
        onConfirm={handleVerify}
        title={`${verifyModal === 'Verified' ? 'Approve' : 'Reject'} "${brand.name}"?`}
        description="This will update the verification badge of this brand in the Collune marketplace."
        confirmText="Confirm Verification"
        variant="primary"
      />
    </div>
  );
};
