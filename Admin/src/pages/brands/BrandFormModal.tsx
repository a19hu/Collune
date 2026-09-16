import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Brand } from '../../types';
import { brandService } from '../../services/brandService';
import { useToast } from '../../context/ToastContext';

export function BrandFormModal({ isOpen, brand, onClose, onSuccess }: { isOpen: boolean; brand: Brand | null; onClose: () => void; onSuccess: () => void }) {
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', industry: '', website: '', email: '', phone: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (brand) setForm({ name: brand.name, industry: brand.industry, website: brand.website, email: brand.email, phone: brand.phone, description: brand.description });
  }, [brand, isOpen]);

  const setField = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!brand || !form.name.trim() || !form.email.trim()) return;
    setIsSaving(true);
    try {
      await brandService.updateBrand(brand.id, form);
      success('Brand updated', `${form.name} has been updated.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to update brand', err?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Edit Brand" subtitle="Update the brand’s account and contact details." maxWidth="lg">
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name *" value={form.name} onChange={setField('name')} required />
        <Field label="Industry" value={form.industry} onChange={setField('industry')} />
        <Field label="Email *" value={form.email} onChange={setField('email')} type="email" required />
        <Field label="Phone" value={form.phone} onChange={setField('phone')} type="tel" />
      </div>
      <Field label="Website" value={form.website} onChange={setField('website')} type="url" />
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">About brand
        <textarea value={form.description} onChange={setField('description')} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
      </label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button disabled={isSaving} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : 'Save changes'}</button></div>
    </form>
  </Modal>;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}<input {...props} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label>;
}
