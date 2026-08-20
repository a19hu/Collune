import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Building2,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { Campaign, CampaignStatus } from '../../types';
import { campaignService } from '../../services/campaignService';
import { exportService } from '../../services/exportService';
import { CampaignFormModal } from './CampaignFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CampaignsPageProps {
  onRouteChange: (route: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onRouteChange }) => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [statusChange, setStatusChange] = useState<{ campaign: Campaign; newStatus: CampaignStatus } | null>(null);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      error('Failed to load campaigns', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleStatusUpdate = async () => {
    if (!statusChange) return;
    try {
      await campaignService.updateStatus(statusChange.campaign.id, statusChange.newStatus);
      await logAdminAction(
        'UPDATE',
        'Campaigns',
        `Changed campaign "${statusChange.campaign.title}" status to ${statusChange.newStatus}`,
        statusChange.campaign.id
      );
      success('Status Updated', `Campaign is now ${statusChange.newStatus}.`);
      setStatusChange(null);
      loadCampaigns();
    } catch (err: any) {
      error('Failed to update status', err.message);
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    try {
      await campaignService.deleteCampaign(campaignToDelete.id);
      await logAdminAction('DELETE', 'Campaigns', `Deleted campaign "${campaignToDelete.title}"`, campaignToDelete.id);
      success('Campaign Deleted', `${campaignToDelete.title} was removed.`);
      setCampaignToDelete(null);
      loadCampaigns();
    } catch (err: any) {
      error('Failed to delete campaign', err.message);
    }
  };

  const handleExport = (data: Campaign[]) => {
    exportService.downloadDataset('Campaign Data', 'CSV');
    logAdminAction('EXPORT', 'Exports', `Exported ${data.length} campaign records to CSV`);
    success('Export Started', `Downloaded campaign dataset (${data.length} records).`);
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'title',
      header: 'Campaign Title',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{row.title}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <span>{row.campaignCode}</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'brandName',
      header: 'Brand Partner',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.brandName}</span>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Total Budget',
      accessor: (row) => row.budget,
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
          {formatCurrency(row.budget)}
        </span>
      ),
    },
    {
      key: 'creatorsRequired',
      header: 'Creators',
      accessor: (row) => row.creatorsRequired,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.creatorsSelected || 0} / {row.creatorsRequired} Slots</span>
        </div>
      ),
    },
    {
      key: 'timeline',
      header: 'Timeline',
      accessor: (row) => row.startDate,
      render: (row) => (
        <div className="text-xs text-slate-500">
          <div>{formatDate(row.startDate)}</div>
          <div className="text-[10px] text-slate-400">to {formatDate(row.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onRouteChange(`/admin/campaigns/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title="View Campaign Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>

          <PermissionGuard permission="campaigns.edit">
            <button
              onClick={() => {
                setCampaignToEdit(row);
                setIsCreateOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Edit Campaign"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>

          {/* Quick status switches */}
          <PermissionGuard permission="campaigns.edit">
            {row.status === 'Active' ? (
              <button
                onClick={() => setStatusChange({ campaign: row, newStatus: 'Paused' })}
                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                title="Pause Campaign"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : row.status === 'Paused' ? (
              <button
                onClick={() => setStatusChange({ campaign: row, newStatus: 'Active' })}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                title="Resume Campaign"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : null}
          </PermissionGuard>

          <PermissionGuard permission="campaigns.delete">
            <button
              onClick={() => setCampaignToDelete(row)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
              title="Delete Campaign"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Paused', value: 'Paused' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
  ];

  const bulkActions: BulkAction<Campaign>[] = [
    {
      label: 'Pause Selected',
      variant: 'default',
      permission: 'campaigns.edit',
      onClick: async (selected) => {
        for (const c of selected) {
          await campaignService.updateStatus(c.id, 'Paused');
        }
        await logAdminAction('UPDATE', 'Campaigns', `Bulk paused ${selected.length} campaigns`);
        success(`Paused ${selected.length} campaigns`);
        loadCampaigns();
      },
    },
    {
      label: 'Mark as Completed',
      variant: 'success',
      permission: 'campaigns.edit',
      onClick: async (selected) => {
        for (const c of selected) {
          await campaignService.updateStatus(c.id, 'Completed');
        }
        await logAdminAction('UPDATE', 'Campaigns', `Bulk completed ${selected.length} campaigns`);
        success(`Completed ${selected.length} campaigns`);
        loadCampaigns();
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Campaigns Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track brand deliverables, assigned creator slots, budget allocation, and live statuses.
          </p>
        </div>

        <PermissionGuard permission="campaigns.create">
          <button
            onClick={() => {
              setCampaignToEdit(null);
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Main Table */}
      <DataTable
        data={campaigns}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search campaigns by title, brand, category, code..."
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportPermission="campaigns.export"
        onExport={handleExport}
        onRowClick={(row) => onRouteChange(`/admin/campaigns/${row.id}`)}
        emptyTitle="No campaigns found"
        emptyDescription="Try adjusting search or status filters."
      />

      {/* Create / Edit Modal */}
      <CampaignFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        campaignToEdit={campaignToEdit}
        onSuccess={loadCampaigns}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!campaignToDelete}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={handleDelete}
        title={`Delete Campaign "${campaignToDelete?.title}"?`}
        description="This will cancel active creator bids and remove the campaign record from the platform."
        confirmText="Delete Campaign"
        variant="danger"
      />

      {/* Status Change Dialog */}
      <ConfirmDialog
        isOpen={!!statusChange}
        onClose={() => setStatusChange(null)}
        onConfirm={handleStatusUpdate}
        title={`Change Status to ${statusChange?.newStatus}?`}
        description={`Set status of "${statusChange?.campaign.title}" to ${statusChange?.newStatus}.`}
        confirmText="Update Status"
        variant="primary"
      />
    </div>
  );
};
