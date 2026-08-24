import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Download,
  Filter,
  Instagram,
  Youtube,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { Creator, VerificationStatus } from '../../types';
import { creatorService } from '../../services/creatorService';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCompactNumber } from '../../utils/formatters';

interface CreatorsPageProps {
  onRouteChange: (route: string) => void;
}

export const CreatorsPage: React.FC<CreatorsPageProps> = ({ onRouteChange }) => {
  const { hasPermission, logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyAction, setVerifyAction] = useState<{ creator: Creator; newStatus: VerificationStatus } | null>(null);
  const [statusAction, setStatusAction] = useState<{ creator: Creator; newStatus: 'Active' | 'Inactive' } | null>(null);

  const loadCreators = async () => {
    setIsLoading(true);
    try {
      const data = await creatorService.getCreators();
      setCreators(data);
    } catch (err: any) {
      error('Failed to load creators', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  const handleVerify = async () => {
    if (!verifyAction) return;
    try {
      await creatorService.verifyCreator(verifyAction.creator.id, verifyAction.newStatus);
      const act = verifyAction.newStatus === 'Verified' ? 'VERIFY' : 'REJECT';
      await logAdminAction(act, 'Creators', `${act === 'VERIFY' ? 'Approved' : 'Rejected'} verification for ${verifyAction.creator.name} (${verifyAction.creator.id})`, verifyAction.creator.id);
      success('Verification Updated', `${verifyAction.creator.name} status is now ${verifyAction.newStatus}.`);
      setVerifyAction(null);
      loadCreators();
    } catch (err: any) {
      error('Failed to update verification', err.message);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusAction) return;
    try {
      await creatorService.updateStatus(statusAction.creator.id, statusAction.newStatus);
      const act = statusAction.newStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE';
      await logAdminAction(act, 'Creators', `Changed creator account status to ${statusAction.newStatus} for ${statusAction.creator.name}`, statusAction.creator.id);
      success('Status Updated', `${statusAction.creator.name} is now ${statusAction.newStatus}.`);
      setStatusAction(null);
      loadCreators();
    } catch (err: any) {
      error('Failed to update status', err.message);
    }
  };

  const handleExport = (data: Creator[]) => {
    exportService.downloadDataset('Creator Data', 'CSV');
    logAdminAction('EXPORT', 'Exports', `Exported ${data.length} creator records to CSV`);
    success('Export Started', `Downloaded creator dataset (${data.length} records).`);
  };

  const columns: Column<Creator>[] = [
    {
      key: 'name',
      header: 'Creator Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatarUrl}
            alt={row.name}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{row.name}</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <span>{row.handle}</span>
              <span>•</span>
              <span className="text-[10px] text-slate-400">{row.id}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Niche',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.category}
        </span>
      ),
    },
    {
      key: 'totalFollowers',
      header: 'Reach & Engagement',
      accessor: (row) => row.totalFollowers,
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {formatCompactNumber(row.totalFollowers)} Followers
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{row.primaryEngagementRate}% ER</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">{row.location}</span>
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'KYC Status',
      render: (row) => <StatusBadge status={row.verificationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onRouteChange(`/admin/creators/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title="View Creator Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* KYC Verify / Reject quick actions */}
          {row.verificationStatus === 'Pending' && (
            <PermissionGuard permission="creators.verify">
              <button
                onClick={() => setVerifyAction({ creator: row, newStatus: 'Verified' })}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                title="Approve KYC"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVerifyAction({ creator: row, newStatus: 'Rejected' })}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                title="Reject KYC"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </PermissionGuard>
          )}

          {/* Deactivate / Activate toggle */}
          {row.accountStatus === 'Active' ? (
            <PermissionGuard permission="creators.edit">
              <button
                onClick={() => setStatusAction({ creator: row, newStatus: 'Inactive' })}
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                title="Deactivate Creator"
              >
                <Ban className="w-4 h-4" />
              </button>
            </PermissionGuard>
          ) : (
            <PermissionGuard permission="creators.edit">
              <button
                onClick={() => setStatusAction({ creator: row, newStatus: 'Active' })}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                title="Reactivate Creator"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </PermissionGuard>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { label: 'Fashion & Style', value: 'Fashion & Style' },
        { label: 'Technology & Gadgets', value: 'Technology & Gadgets' },
        { label: 'Beauty & Skincare', value: 'Beauty & Skincare' },
        { label: 'Gaming & Esports', value: 'Gaming & Esports' },
        { label: 'Food & Culinary', value: 'Food & Culinary' },
        { label: 'Travel & Adventure', value: 'Travel & Adventure' },
        { label: 'Fitness & Health', value: 'Fitness & Health' },
        { label: 'Finance & Crypto', value: 'Finance & Crypto' },
        { label: 'Comedy & Entertainment', value: 'Comedy & Entertainment' },
      ],
    },
    {
      key: 'verificationStatus',
      label: 'KYC Status',
      options: [
        { label: 'Verified', value: 'Verified' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Unverified', value: 'Unverified' },
      ],
    },
    {
      key: 'accountStatus',
      label: 'Account Status',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  ];

  const bulkActions: BulkAction<Creator>[] = [
    {
      label: 'Approve KYC for Selected',
      variant: 'success',
      permission: 'creators.verify',
      onClick: async (selected) => {
        for (const c of selected) {
          await creatorService.verifyCreator(c.id, 'Verified');
        }
        await logAdminAction('VERIFY', 'Creators', `Bulk approved KYC for ${selected.length} creators`);
        success(`Approved KYC for ${selected.length} creators`);
        loadCreators();
      },
    },
    {
      label: 'Deactivate Selected',
      variant: 'danger',
      permission: 'creators.edit',
      onClick: async (selected) => {
        for (const c of selected) {
          await creatorService.updateStatus(c.id, 'Inactive');
        }
        await logAdminAction('DEACTIVATE', 'Creators', `Bulk deactivated ${selected.length} creators`);
        success(`Deactivated ${selected.length} creator accounts`);
        loadCreators();
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Creator Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, verify KYC documentation, and oversee influencer rosters.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={creators}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search creators by name, handle, code, category, location..."
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportPermission="creators.export"
        onExport={handleExport}
        onRowClick={(row) => onRouteChange(`/admin/creators/${row.id}`)}
        emptyTitle="No creators found"
        emptyDescription="Try clearing active category or KYC filters."
      />

      {/* Verification Confirmation */}
      <ConfirmDialog
        isOpen={!!verifyAction}
        onClose={() => setVerifyAction(null)}
        onConfirm={handleVerify}
        title={`${verifyAction?.newStatus === 'Verified' ? 'Approve' : 'Reject'} KYC for "${verifyAction?.creator.name}"?`}
        description={
          verifyAction?.newStatus === 'Verified'
            ? 'The creator will receive a verified badge and become eligible for brand campaigns.'
            : 'The creator KYC will be rejected and they will be prompted to re-upload official ID proof.'
        }
        confirmText={verifyAction?.newStatus === 'Verified' ? 'Approve Verification' : 'Reject Verification'}
        variant={verifyAction?.newStatus === 'Verified' ? 'primary' : 'danger'}
      />

      {/* Status Confirmation */}
      <ConfirmDialog
        isOpen={!!statusAction}
        onClose={() => setStatusAction(null)}
        onConfirm={handleStatusToggle}
        title={`${statusAction?.newStatus === 'Active' ? 'Reactivate' : 'Deactivate'} "${statusAction?.creator.name}"?`}
        description={
          statusAction?.newStatus === 'Active'
            ? 'The creator will regain full platform access and can accept campaign offers.'
            : 'The creator will be deactivated and unable to bid or submit campaign content.'
        }
        confirmText={statusAction?.newStatus === 'Active' ? 'Reactivate Account' : 'Deactivate Account'}
        variant={statusAction?.newStatus === 'Active' ? 'primary' : 'warning'}
      />
    </div>
  );
};
