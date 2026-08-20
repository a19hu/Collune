import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PermissionGuard } from '../permissions/PermissionGuard';
import { Permission } from '../../types';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hidden?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  permission?: Permission | string;
  onClick: (selectedRows: T[]) => void;
}

interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T | string)[];
  filterOptions?: FilterOption[];
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  exportPermission?: Permission | string;
  onExport?: (data: T[]) => void;
  exportFilename?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  primaryAction?: React.ReactNode;
  itemsPerPageOptions?: number[];
  initialPageSize?: number;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFields,
  filterOptions = [],
  bulkActions = [],
  onRowClick,
  exportPermission,
  onExport,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search filters or add a new record.',
  defaultSortKey,
  defaultSortDir = 'asc',
  primaryAction,
  itemsPerPageOptions = [10, 20, 50, 100],
  initialPageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    defaultSortKey ? { key: defaultSortKey, dir: defaultSortDir } : null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((c) => {
      initial[c.key] = !c.hidden;
    });
    return initial;
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Filter & Search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = (searchFields || columns.map((c) => c.key)).some((field) => {
          let val = (item as any)[field];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          return String(val || '')
            .toLowerCase()
            .includes(q);
        });
        if (!matchesSearch) return false;
      }

      // Filter options matching
      for (const [filterKey, filterVal] of Object.entries(activeFilters)) {
        if (filterVal && filterVal !== 'ALL') {
          const itemVal = String((item as any)[filterKey] || '').toLowerCase();
          if (itemVal !== String(filterVal).toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchQuery, activeFilters, searchFields, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, dir } = sortConfig;
    const col = columns.find((c) => c.key === key);

    return [...filteredData].sort((a, b) => {
      let aVal = col?.accessor ? col.accessor(a) : (a as any)[key];
      let bVal = col?.accessor ? col.accessor(b) : (b as any)[key];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal || '').toLowerCase();
      const strB = String(bVal || '').toLowerCase();
      if (strA < strB) return dir === 'asc' ? -1 : 1;
      if (strA > strB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, dir: 'asc' };
      }
      if (prev.dir === 'asc') {
        return { key, dir: 'desc' };
      }
      return null;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((d) => d.id)));
    }
  };

  const toggleSelectRow = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedRows = useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id));
  }, [data, selectedIds]);

  const displayedColumns = useMemo(() => {
    return columns.filter((c) => visibleColumns[c.key] !== false);
  }, [columns, visibleColumns]);

  const handleDefaultExport = () => {
    if (onExport) {
      onExport(filteredData);
      return;
    }
    // Simple fallback CSV download
    const exportCols = displayedColumns.filter((c) => c.key !== 'actions');
    const headers = exportCols.map((c) => c.header).join(',');
    const rows = filteredData.map((row) =>
      exportCols
        .map((col) => {
          let val = col.accessor ? col.accessor(row) : (row as any)[col.key];
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Bar: Search, Filters, Primary Actions & Bulk Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search input */}
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dynamic Filter Dropdowns */}
          {filterOptions.map((filter) => (
            <div key={filter.key} className="relative">
              <select
                value={activeFilters[filter.key] || 'ALL'}
                onChange={(e) => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    [filter.key]: e.target.value,
                  }));
                  setCurrentPage(1);
                }}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All {filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Active Filter Clear Tag */}
          {(Object.values(activeFilters).some((v) => v && v !== 'ALL') || searchQuery) && (
            <button
              onClick={() => {
                setActiveFilters({});
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-medium px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu((p) => !p)}
              className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Customize columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-30 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Toggle Columns
                </div>
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key] !== false}
                      onChange={(e) => {
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [col.key]: e.target.checked,
                        }));
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="truncate">{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          {exportPermission ? (
            <PermissionGuard permission={exportPermission}>
              <button
                type="button"
                onClick={handleDefaultExport}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </PermissionGuard>
          ) : onExport ? (
            <button
              type="button"
              onClick={handleDefaultExport}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          ) : null}

          {/* Primary Action Button */}
          {primaryAction}
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-2 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
            <span className="w-4.5 h-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              {selectedIds.size}
            </span>
            <span>records selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {bulkActions.map((action, idx) => {
              const btn = (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedRows)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer',
                    action.variant === 'danger'
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : action.variant === 'success'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              );

              if (action.permission) {
                return (
                  <PermissionGuard key={idx} permission={action.permission}>
                    {btn}
                  </PermissionGuard>
                );
              }
              return btn;
            })}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-indigo-700 dark:text-indigo-300 hover:underline ml-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                {/* Bulk Checkbox Column */}
                {bulkActions.length > 0 && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((d) => selectedIds.has(d.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                )}

                {displayedColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={cn(
                      'px-3.5 py-2.5 transition-colors select-none font-bold',
                      col.sortable !== false && 'cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800',
                      col.headerClassName
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-400">
                          {sortConfig?.key === col.key ? (
                            sortConfig.dir === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {bulkActions.length > 0 && (
                      <td className="px-3 py-3 text-center">
                        <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                    )}
                    {displayedColumns.map((col, idx) => (
                      <td key={idx} className="px-3.5 py-3">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty State
                <tr>
                  <td
                    colSpan={displayedColumns.length + (bulkActions.length > 0 ? 1 : 0)}
                    className="py-14 text-center"
                  >
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                        <Filter className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {emptyTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs leading-relaxed">
                        {emptyDescription}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows
                paginatedData.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={cn(
                        'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group',
                        onRowClick && 'cursor-pointer',
                        isSelected && 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      )}
                    >
                      {bulkActions.length > 0 && (
                        <td
                          className="px-3 py-2.5 text-center"
                          onClick={(e) => toggleSelectRow(row.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                      )}

                      {displayedColumns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-3.5 py-2.5 text-slate-800 dark:text-slate-200 text-xs align-middle',
                            col.className
                          )}
                        >
                          {col.render
                            ? col.render(row)
                            : col.accessor
                            ? col.accessor(row)
                            : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 text-xs">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer text-xs"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-[11px]">
              Showing{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-200">
                {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </strong>{' '}
              of{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-200">
                {sortedData.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="mr-1 text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
