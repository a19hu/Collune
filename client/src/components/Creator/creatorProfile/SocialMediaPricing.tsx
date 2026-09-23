import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  createCreatorPricing,
  deleteCreatorPricing,
  updateCreatorPricing,
} from '@/src/lib/authApi';
import type { CreatorSocialMediaPricingApi, RateCardApi } from '@/src/types';
import { showProjectToast } from '@/src/HtmlComponents/HtmlRoster';
import { Card } from './CreatorProfile';

type PricingForm = Omit<CreatorSocialMediaPricingApi, 'id'>;
type Props = {
  pricing: CreatorSocialMediaPricingApi[];
  rateCards: RateCardApi[];
  onChange: (items: CreatorSocialMediaPricingApi[]) => void;
};
const emptyPricing: PricingForm = {
  platform: '',
  service: '',
  price: 0,
  pricing_type: 'FIXED_PRICE',
  notes: '',
  is_visible: false,
};
const typeLabel = (value: PricingForm['pricing_type']) =>
  value === 'FIXED_PRICE'
    ? 'Fixed Price'
    : value === 'STARTING_FROM'
      ? 'Starting From'
      : 'Negotiable';

export function SocialMediaPricing({ pricing, rateCards, onChange }: Props) {
  const [editing, setEditing] = useState<CreatorSocialMediaPricingApi | null>(
    null
  );
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<PricingForm>(emptyPricing);
  const [saving, setSaving] = useState(false);
  const platforms = useMemo(
    () => [...new Set(rateCards.map((item) => item.platform))],
    [rateCards]
  );
  const services = rateCards.filter((item) => item.platform === form.platform);
  const isDialogOpen = adding || Boolean(editing);

  function openAdd() {
    setForm(emptyPricing);
    setEditing(null);
    setAdding(true);
  }
  function openEdit(item: CreatorSocialMediaPricingApi) {
    setForm({ ...item });
    setAdding(false);
    setEditing(item);
  }
  function closeDialog() {
    setAdding(false);
    setEditing(null);
  }

  async function save() {
    if (!form.platform || !form.service) return;
    setSaving(true);
    try {
      if (editing) {
        const item = await updateCreatorPricing(editing.id, form);
        onChange(pricing.map((value) => (value.id === item.id ? item : value)));
        showProjectToast(
          'success',
          'Price updated',
          'Your pricing entry has been saved.'
        );
      } else {
        const item = await createCreatorPricing(form);
        onChange([...pricing, item]);
        showProjectToast(
          'success',
          'Price added',
          'Your pricing entry has been added.'
        );
      }
      closeDialog();
    } catch (error) {
      showProjectToast(
        'error',
        'Could not save price',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this pricing entry?')) return;
    setSaving(true);
    try {
      await deleteCreatorPricing(id);
      onChange(pricing.filter((item) => item.id !== id));
    } catch (error) {
      showProjectToast(
        'error',
        'Could not delete price',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 w-full min-w-0" id="pricing">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#172554]">
            Social media pricing
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#63708a]">
            Toggle visibility to control which rates are shown publicly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#173ca8]">
            {pricing.filter((item) => item.is_visible).length} public
          </span>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-[6px] bg-[#2447bd] px-3 py-2 text-xs font-black text-white"
          >
            Add price
          </button>
        </div>
      </div>
      <div
        role="region"
        aria-label="Social media pricing table"
        tabIndex={0}
        className="w-full min-w-0 overflow-x-auto rounded-[6px] border border-[#dbe3ee]"
      >
        <table 
        className="w-full min-w-[820px] text-left text-sm"
        >
          <thead className="bg-[#f8faff] text-xs font-black uppercase tracking-wide text-[#63708a]">
            <tr>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5eaf2]">
            {pricing.map((item) => (
              <tr key={item.id} className="text-[#25304a]">
                <td className="px-4 py-3 font-bold">{item.platform}</td>
                <td className="px-4 py-3">{item.service}</td>
                <td className="px-4 py-3 font-black">
                  ₹{Number(item.price || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">{typeLabel(item.pricing_type)}</td>
                <td className="px-4 py-3">{item.notes || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-black ${item.is_visible ? 'bg-[#ddfbea] text-[#067647]' : 'bg-[#eef1f6] text-[#63708a]'}`}
                  >
                    {item.is_visible ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.service}`}
                      className="grid h-8 w-8 place-items-center rounded-[6px] border border-[#c9d7ff] text-[#173ca8]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      disabled={saving}
                      aria-label={`Delete ${item.service}`}
                      className="grid h-8 w-8 place-items-center rounded-[6px] border border-[#f5c2c7] text-[#b42318]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pricing.length ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center font-semibold text-[#63708a]"
                >
                  No pricing entries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-[10px] bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#172554]">
                {editing ? 'Edit pricing entry' : 'Add pricing entry'}
              </h3>
              <button
                type="button"
                onClick={closeDialog}
                className="text-sm font-bold text-[#63708a]"
              >
                Cancel
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Platform
                <select
                  value={form.platform}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      platform: event.target.value,
                      service: '',
                    }))
                  }
                  className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm"
                >
                  <option value="">Select platform</option>
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Service
                <select
                  value={form.service}
                  disabled={!form.platform}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      service: event.target.value,
                    }))
                  }
                  className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm disabled:bg-slate-100"
                >
                  <option value="">Select service</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.service}>
                      {item.service}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Price
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      price: Number(event.target.value),
                    }))
                  }
                  className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Pricing type
                <select
                  value={form.pricing_type}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      pricing_type: event.target
                        .value as PricingForm['pricing_type'],
                    }))
                  }
                  className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm"
                >
                  <option value="FIXED_PRICE">Fixed Price</option>
                  <option value="STARTING_FROM">Starting From</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Notes
                <input
                  value={form.notes}
                  maxLength={30}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      notes: event.target.value,
                    }))
                  }
                  className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm"
                />
              </label>
              <label className="flex items-end gap-2 pb-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      is_visible: event.target.checked,
                    }))
                  }
                />{' '}
                Visible publicly
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="h-10 rounded-[6px] border border-[#d7deea] px-4 text-sm font-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !form.platform || !form.service}
                className="h-10 rounded-[6px] bg-[#2447bd] px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add price'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
