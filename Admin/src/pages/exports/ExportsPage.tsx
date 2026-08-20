import React, { useState, useEffect } from 'react';
import {
  DownloadCloud,
  FileSpreadsheet,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  User,
  Shield,
} from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { ExportRecord, ExportType, ExportFormat } from '../../types';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatCompactNumber } from '../../utils/formatters';

export const ExportsPage: React.FC = () => {
  const { currentUser, currentRole, logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [exportType, setExportType] = useState<ExportType>('Creator Data');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('CSV');
  const [filterQuery, setFilterQuery] = useState('All active and verified records');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadExports = async () => {
    setIsLoading(true);
    try {
      const data = await exportService.getExports();
      setExportsList(data);
    } catch (err: any) {
      error('Failed to load export history', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleGenerateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const record = await exportService.createExport({
        type: exportType,
        format: exportFormat,
        filters: filterQuery,
        userName: currentUser.name,
        userRole: currentRole.name,
      });

      // Automatically trigger client-side file download
      exportService.downloadDataset(exportType, exportFormat);

      await logAdminAction(
        'EXPORT',
        'Exports',
        `Generated ${exportFormat} export for ${exportType} (${record.recordsCount} records)`,
        record.id
      );

      success('Export Completed & Downloaded', `Generated ${record.exportCode} for ${exportType}.`);
      setIsModalOpen(false);
      loadExports();
    } catch (err: any) {
      error('Failed to generate export', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectDownload = (row: ExportRecord) => {
    exportService.downloadDataset(row.type, row.format);
    logAdminAction('EXPORT', 'Exports', `Downloaded dataset ${row.exportCode} (${row.type})`, row.id);
    success('Download started', `Downloading ${row.exportCode}...`);
  };

  const columns: Column<ExportRecord>[] = [
    {
      key: 'exportCode',
      header: 'Export Code & ID',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              {row.exportCode}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Dataset Scope',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
          {row.type}
        </span>
      ),
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">{row.requestedBy}</div>
          <div className="text-[10px] text-slate-400">{row.requestedByRole}</div>
        </div>
      ),
    },
    {
      key: 'recordsCount',
      header: 'Records',
      accessor: (row) => row.recordsCount,
      render: (row) => (
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
          {formatCompactNumber(row.recordsCount)} rows
        </span>
      ),
    },
    {
      key: 'format',
      header: 'Format',
      render: (row) => (
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          .{row.format.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      accessor: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Download',
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleDirectDownload(row)}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
          title="Download File"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Data Exports Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and download structured CSV and Excel datasets for analytical reporting.
          </p>
        </div>

        <PermissionGuard permission="exports.create">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Export</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Main Table */}
      <DataTable
        data={exportsList}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search exports by code, dataset scope, staff user..."
        emptyTitle="No export records found"
        emptyDescription="Generate a dataset above to download instant CSV/Excel files."
      />

      {/* Generate Export Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Structured Export"
        subtitle="Select dataset scope and file format for instant processing."
        maxWidth="md"
      >
        <form onSubmit={handleGenerateExport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dataset Scope *
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="Creator Data">Creator Directory & KYC Records</option>
              <option value="Brand Data">Brand Partners & Spend Records</option>
              <option value="Campaign Data">Campaigns & Deliverables History</option>
              <option value="Staff Users">Internal Staff & Access Logs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Export File Format *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                  exportFormat === 'CSV'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="CSV"
                  checked={exportFormat === 'CSV'}
                  onChange={() => setExportFormat('CSV')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold">Comma Separated (.CSV)</div>
                  <div className="text-[10px] text-slate-400">Standard spreadsheet</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                  exportFormat === 'Excel'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="Excel"
                  checked={exportFormat === 'Excel'}
                  onChange={() => setExportFormat('Excel')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold">Plain / Tab (.TXT)</div>
                  <div className="text-[10px] text-slate-400">Raw text dump</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Filter Note / Query
            </label>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="e.g. Verified Creators only"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="text-slate-500">Requested Operator:</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {currentUser.name} ({currentRole.name})
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Processing...' : 'Generate & Download'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
