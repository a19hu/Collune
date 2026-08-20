import React, { useState, useEffect } from 'react';
import { Bookmark, Eye, Building2, Users } from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Shortlist } from '../../types';
import { shortlistService } from '../../services/shortlistService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

interface ShortlistsPageProps {
  onRouteChange: (route: string) => void;
}

export const ShortlistsPage: React.FC<ShortlistsPageProps> = ({ onRouteChange }) => {
  const { error } = useToast();

  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadShortlists = async () => {
    setIsLoading(true);
    try {
      const data = await shortlistService.getShortlists();
      setShortlists(data);
    } catch (err: any) {
      error('Failed to load shortlists', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShortlists();
  }, []);

  const columns: Column<Shortlist>[] = [
    {
      key: 'title',
      header: 'Shortlist',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{row.title}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{row.shortlistCode}</div>
        </div>
      ),
    },
    {
      key: 'brandName',
      header: 'Brand',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{row.brandName}</span>
        </div>
      ),
    },
    {
      key: 'creators',
      header: 'Creators',
      accessor: (row) => row.creators.length,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.creators.length}</span>
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
            onClick={() => onRouteChange(`/admin/shortlists/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title="View Shortlist"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Draft', value: 'Draft' },
        { label: 'Submitted', value: 'Submitted' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-600" />
            <span>Shortlists</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track brand shortlists, selected creators, submission status, and moderation needs.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={shortlists}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search shortlists by title, brand, code..."
        filterOptions={filterOptions}
        onRowClick={(row) => onRouteChange(`/admin/shortlists/${row.id}`)}
        emptyTitle="No shortlists found"
        emptyDescription="Try adjusting search or status filters."
      />
    </div>
  );
};
