import React, { useState, useEffect } from 'react';
import {
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Mail,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { DataTable, Column, BulkAction } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { Brand, VerificationStatus } from '../../types';
import { brandService } from '../../services/brandService';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface BrandsPageProps {
  onRouteChange: (route: string) => void;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({ onRouteChange }) => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyAction, setVerifyAction] = useState<{ brand: Brand; newStatus: VerificationStatus } | null>(null);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const data = await brandService.getBrands();
      setBrands(data);
    } catch (err: any) {
      error('Failed to load brands', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleVerify = async () => {
    if (!verifyAction) return;
    try {
      await brandService.verifyBrand(verifyAction.brand.id, verifyAction.newStatus);
      const act = verifyAction.newStatus === 'Verified' ? 'VERIFY' : 'REJECT';
      await logAdminAction(
        act,
        'Brands',
        `${act === 'VERIFY' ? 'Approved' : 'Rejected'} verification for brand ${verifyAction.brand.name}`,
        verifyAction.brand.id
      );
      success('Brand Verification Updated', `${verifyAction.brand.name} is now ${verifyAction.newStatus}.`);
      setVerifyAction(null);
      loadBrands();
    } catch (err: any) {
      error('Failed to update brand verification', err.message);
    }
  };

  const handleExport = (data: Brand[]) => {
    exportService.downloadDataset('Brand Data', 'CSV');
    logAdminAction('EXPORT', 'Exports', `Exported ${data.length} brand partner records to CSV`);
    success('Export Started', `Downloaded brand dataset (${data.length} records).`);
  };

  const columns: Column<Brand>[] = [
    {
      key: 'name',
      header: 'Brand Partner',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.logoUrl}
            alt={row.name}
            className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.name}</div>
            <div className="text-xs text-slate-400 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.industry}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Mail className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-[170px]">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'totalCampaigns',
      header: 'Campaigns',
      accessor: (row) => row.totalCampaigns,
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          {row.totalCampaigns} created
        </span>
      ),
    },
    {
      key: 'totalSpend',
      header: 'Total Spend',
      accessor: (row) => row.totalSpend,
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
          {formatCurrency(row.totalSpend)}
        </span>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Status',
      render: (row) => <StatusBadge status={row.verificationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onRouteChange(`/admin/brands/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title="View Brand Profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.verificationStatus === 'Pending' && (
            <PermissionGuard permission="brands.verify">
              <button
                onClick={() => setVerifyAction({ brand: row, newStatus: 'Verified' })}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                title="Approve Brand"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVerifyAction({ brand: row, newStatus: 'Rejected' })}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                title="Reject Brand"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </PermissionGuard>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'industry',
      label: 'Industry',
      options: [
        { label: 'Consumer Electronics & Audio', value: 'Consumer Electronics & Audio' },
        { label: 'Beauty & Personal Care', value: 'Beauty & Personal Care' },
        { label: 'Financial Services & Payments', value: 'Financial Services & Payments' },
        { label: 'Apparel & Footwear', value: 'Apparel & Footwear' },
        { label: 'Beverages & Nutrition', value: 'Beverages & Nutrition' },
        { label: 'Automotive & Mobility', value: 'Automotive & Mobility' },
        { label: 'Quick Commerce & Food Tech', value: 'Quick Commerce & Food Tech' },
      ],
    },
    {
      key: 'verificationStatus',
      label: 'Status',
      options: [
        { label: 'Verified', value: 'Verified' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
  ];

  const bulkActions: BulkAction<Brand>[] = [
    {
      label: 'Approve Selected Brands',
      variant: 'success',
      permission: 'brands.verify',
      onClick: async (selected) => {
        for (const b of selected) {
          await brandService.verifyBrand(b.id, 'Verified');
        }
        await logAdminAction('VERIFY', 'Brands', `Bulk verified ${selected.length} brand accounts`);
        success(`Approved ${selected.length} brands`);
        loadBrands();
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Brand Partners
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise clients, direct marketing budgets, and account verification statuses.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={brands}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search brands by company name, contact, industry, code..."
        filterOptions={filterOptions}
        bulkActions={bulkActions}
        exportPermission="brands.export"
        onExport={handleExport}
        onRowClick={(row) => onRouteChange(`/admin/brands/${row.id}`)}
        emptyTitle="No brand partners found"
        emptyDescription="No brands match the applied search query or industry filters."
      />

      {/* Verification Dialog */}
      <ConfirmDialog
        isOpen={!!verifyAction}
        onClose={() => setVerifyAction(null)}
        onConfirm={handleVerify}
        title={`${verifyAction?.newStatus === 'Verified' ? 'Approve' : 'Reject'} "${verifyAction?.brand.name}"?`}
        description={
          verifyAction?.newStatus === 'Verified'
            ? 'The brand will be verified and allowed to launch influencer marketing campaigns.'
            : 'The brand application will be marked as rejected.'
        }
        confirmText={verifyAction?.newStatus === 'Verified' ? 'Approve Brand' : 'Reject Application'}
        variant={verifyAction?.newStatus === 'Verified' ? 'primary' : 'danger'}
      />
    </div>
  );
};
