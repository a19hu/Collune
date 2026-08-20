import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Shield,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
} from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { AuditLog, AuditAction } from '../../types';
import { auditLogService } from '../../services/auditLogService';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

export const AuditLogsPage: React.FC = () => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditLogService.getLogs();
      setLogs(data);
    } catch (err: any) {
      error('Failed to load audit logs', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExport = (data: AuditLog[]) => {
    exportService.downloadDataset('Internal User Data', 'CSV');
    logAdminAction('EXPORT', 'Exports', `Exported ${data.length} audit trail logs to CSV`);
    success('Export Started', `Downloaded ${data.length} audit log entries.`);
  };

  const getActionBadgeClass = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'VERIFY':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'REJECT':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'ACTIVATE':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'DEACTIVATE':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'EXPORT':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (row) => row.timestamp,
      render: (row) => (
        <div className="text-xs font-mono text-slate-500 whitespace-nowrap">
          {formatDate(row.timestamp)}
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Staff Admin',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-900 dark:text-slate-100">{row.userName}</div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span>{row.userRole}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeClass(
            row.action
          )}`}
        >
          {row.action}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Target Module',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.module}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Event Description & Details',
      render: (row) => (
        <div className="text-xs text-slate-700 dark:text-slate-300 font-sans max-w-md">
          {row.description}
          {row.targetId && (
            <span className="ml-1.5 font-mono text-[10px] text-slate-400">
              [ID: {row.targetId}]
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      render: (row) => (
        <span className="text-xs font-mono text-slate-400">{row.ipAddress}</span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'action',
      label: 'Action',
      options: [
        { label: 'CREATE', value: 'CREATE' },
        { label: 'UPDATE', value: 'UPDATE' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'VERIFY', value: 'VERIFY' },
        { label: 'REJECT', value: 'REJECT' },
        { label: 'ACTIVATE', value: 'ACTIVATE' },
        { label: 'DEACTIVATE', value: 'DEACTIVATE' },
        { label: 'EXPORT', value: 'EXPORT' },
      ],
    },
    {
      key: 'module',
      label: 'Module',
      options: [
        { label: 'Users', value: 'Users' },
        { label: 'Roles', value: 'Roles' },
        { label: 'Creators', value: 'Creators' },
        { label: 'Brands', value: 'Brands' },
        { label: 'Campaigns', value: 'Campaigns' },
        { label: 'Exports', value: 'Exports' },
        { label: 'Settings', value: 'Settings' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Audit Trail & Security Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of all administrative actions, credential changes, and system exports.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search audit events by user, action, target module, description..."
        filterOptions={filterOptions}
        exportPermission="audit.export"
        onExport={handleExport}
        emptyTitle="No audit records found"
        emptyDescription="No events match the selected action or module filters."
      />
    </div>
  );
};
