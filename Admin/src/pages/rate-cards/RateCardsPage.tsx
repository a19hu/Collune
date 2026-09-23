import React, { useEffect, useRef, useState } from 'react';
import { Edit2, ListTree, Plus, Trash2, Upload } from 'lucide-react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as api from '../../lib/api';

type RateCardForm = api.AdminRateCardWritePayload;

const emptyForm: RateCardForm = {
  platform: '',
  service: '',
  sort_order: 0,
};

const csvHeaderAliases = {
  platform: ['platform'],
  service: ['service'],
  sortOrder: ['sortorder', 'displayorder', 'order'],
};

const normaliseCsvHeader = (header: string) => header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[ _-]/g, '');

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
};

const findCsvColumn = (headers: string[], aliases: string[]) =>
  headers.findIndex((header) => aliases.includes(normaliseCsvHeader(header)));

const rateCardKey = (platform: string, service: string) =>
  `${platform.trim().toLocaleLowerCase()}\u0000${service.trim().toLocaleLowerCase()}`;

export const RateCardsPage: React.FC = () => {
  const { hasPermission, logAdminAction } = useAuth();
  const { success, error } = useToast();
  const [rateCards, setRateCards] = useState<api.AdminRateCardApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<api.AdminRateCardApi | null>(null);
  const [deleting, setDeleting] = useState<api.AdminRateCardApi | null>(null);
  const [form, setForm] = useState<RateCardForm>(emptyForm);
  const [isImporting, setIsImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canCreate = hasPermission('rate_cards.create');
  const canEdit = hasPermission('rate_cards.edit');
  const canDelete = hasPermission('rate_cards.delete');

  const loadRateCards = async () => {
    setIsLoading(true);
    try {
      setRateCards(await api.getAdminRateCards());
    } catch (err) {
      error('Failed to load rate cards', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRateCards();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsEditorOpen(true);
  };

  const openEdit = (rateCard: api.AdminRateCardApi) => {
    setEditing(rateCard);
    setForm({
      platform: rateCard.platform,
      service: rateCard.service,
      sort_order: rateCard.sort_order,
    });
    setIsEditorOpen(true);
  };

  const saveRateCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.platform.trim() || !form.service.trim()) {
      error('Platform and service are required');
      return;
    }

    setIsSaving(true);
    const payload = {
      platform: form.platform.trim(),
      service: form.service.trim(),
      sort_order: Math.max(0, Number(form.sort_order) || 0),
    };

    try {
      const saved = editing
        ? await api.updateAdminRateCard(editing.id, payload)
        : await api.createAdminRateCard(payload);
      setRateCards((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
      );
      await logAdminAction(
        editing ? 'UPDATE' : 'CREATE',
        'Rate Cards',
        `${editing ? 'Updated' : 'Created'} rate card: ${saved.platform} — ${saved.service}`,
        saved.id
      );
      success(editing ? 'Rate card updated' : 'Rate card created');
      setIsEditorOpen(false);
    } catch (err) {
      error('Could not save rate card', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRateCard = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await api.deleteAdminRateCard(deleting.id);
      setRateCards((current) => current.filter((item) => item.id !== deleting.id));
      await logAdminAction('DELETE', 'Rate Cards', `Deleted rate card: ${deleting.platform} — ${deleting.service}`, deleting.id);
      success('Rate card deleted');
      setDeleting(null);
    } catch (err) {
      error('Could not delete rate card', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const importRateCards = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      error('Please choose a CSV file');
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) {
        throw new Error('The file must include a header row and at least one data row.');
      }

      const [headers, ...dataRows] = rows;
      const platformColumn = findCsvColumn(headers, csvHeaderAliases.platform);
      const serviceColumn = findCsvColumn(headers, csvHeaderAliases.service);
      const sortOrderColumn = findCsvColumn(headers, csvHeaderAliases.sortOrder);
      if (platformColumn < 0 || serviceColumn < 0) {
        throw new Error('Required CSV columns: platform, service. Optional: sort_order.');
      }

      const invalidRows: number[] = [];
      const payloads: RateCardForm[] = [];
      const payloadRowNumbers: number[] = [];
      dataRows.forEach((row, rowIndex) => {
        const platform = (row[platformColumn] ?? '').trim();
        const service = (row[serviceColumn] ?? '').trim();
        if (!platform || !service) {
          invalidRows.push(rowIndex + 2);
          return;
        }
        const requestedSortOrder = Number(row[sortOrderColumn]);
        payloads.push({
          platform,
          service,
          sort_order: sortOrderColumn >= 0 && Number.isFinite(requestedSortOrder)
            ? Math.max(0, requestedSortOrder)
            : rowIndex,
        });
        payloadRowNumbers.push(rowIndex + 2);
      });

      if (!payloads.length) {
        throw new Error('No valid rate-card rows were found.');
      }

      const existingByKey = new Map(rateCards.map((item) => [rateCardKey(item.platform, item.service), item]));
      const imported: api.AdminRateCardApi[] = [];
      const failedRows: number[] = [];
      // Keep requests in order so repeated platform/service rows in a file end with the last row's values.
      for (let index = 0; index < payloads.length; index += 1) {
        const payload = payloads[index];
        try {
          const existing = existingByKey.get(rateCardKey(payload.platform, payload.service));
          const saved = existing
            ? await api.updateAdminRateCard(existing.id, payload)
            : await api.createAdminRateCard(payload);
          existingByKey.set(rateCardKey(saved.platform, saved.service), saved);
          imported.push(saved);
        } catch {
          failedRows.push(payloadRowNumbers[index]);
        }
      }

      if (imported.length) {
        setRateCards((current) => {
          const next = new Map(current.map((item) => [item.id, item]));
          imported.forEach((item) => next.set(item.id, item));
          return Array.from(next.values());
        });
        await logAdminAction('CREATE', 'Rate Cards', `Imported ${imported.length} rate card${imported.length === 1 ? '' : 's'} from ${file.name}`);
      }

      const skippedRows = [...invalidRows, ...failedRows];
      if (failedRows.length) {
        error(
          `Imported ${imported.length} of ${payloads.length} rate cards`,
          `Rows ${skippedRows.join(', ')} could not be imported.`
        );
      } else if (invalidRows.length) {
        success(`Imported ${imported.length} rate cards`, `Skipped incomplete rows: ${invalidRows.join(', ')}.`);
      } else {
        success(`Imported ${imported.length} rate cards`);
      }
    } catch (err) {
      error('Could not import rate cards', err instanceof Error ? err.message : 'Please check the CSV and try again.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const columns: Column<api.AdminRateCardApi>[] = [
    { key: 'platform', header: 'Platform', render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.platform}</span> },
    { key: 'service', header: 'Service', render: (row) => <span className="text-slate-700 dark:text-slate-300">{row.service}</span> },
    { key: 'sort_order', header: 'Display order', render: (row) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{row.sort_order}</span> },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          {canEdit ? <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50" aria-label={`Edit ${row.service}`}><Edit2 className="h-4 w-4" /></button> : null}
          {canDelete ? <button type="button" onClick={() => setDeleting(row)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50" aria-label={`Delete ${row.service}`}><Trash2 className="h-4 w-4" /></button> : null}
          {!canEdit && !canDelete ? <span className="text-xs text-slate-400">Read only</span> : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"><ListTree className="h-6 w-6 text-indigo-600" />Rate Cards</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage the platforms and services creators can select when setting prices. CSV imports use <span className="font-mono">platform, service, sort_order</span> columns.</p>
        </div>
        {canCreate ? <div className="flex flex-wrap items-center gap-2"><input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void importRateCards(event)} /><button type="button" onClick={() => csvInputRef.current?.click()} disabled={isImporting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50"><Upload className="h-4 w-4" />{isImporting ? 'Importing...' : 'Import CSV'}</button><button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"><Plus className="h-4 w-4" />Add rate card</button></div> : null}
      </div>

      <DataTable
        data={rateCards}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search platforms or services..."
        searchFields={['platform', 'service']}
        defaultSortKey="sort_order"
        emptyTitle="No rate cards found"
        emptyDescription="Add a rate card to make it available to creators."
      />

      <Modal isOpen={isEditorOpen} onClose={() => !isSaving && setIsEditorOpen(false)} title={editing ? 'Edit rate card' : 'Add rate card'} subtitle="Rate cards become service options in creator pricing.">
        <form className="space-y-4" onSubmit={saveRateCard}>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Platform<input autoFocus value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))} placeholder="e.g. Instagram" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Service<input value={form.service} onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))} placeholder="e.g. Reel" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Display order<input type="number" min="0" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800"><button type="button" onClick={() => setIsEditorOpen(false)} disabled={isSaving} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button type="submit" disabled={isSaving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isSaving ? 'Saving...' : editing ? 'Save changes' : 'Add rate card'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleting)} onClose={() => !isSaving && setDeleting(null)} onConfirm={() => void deleteRateCard()} title="Delete rate card?" description={`Remove “${deleting?.platform} — ${deleting?.service}” from the creator pricing catalog. Existing creator prices will not be deleted.`} confirmText="Delete rate card" isLoading={isSaving} />
    </div>
  );
};
