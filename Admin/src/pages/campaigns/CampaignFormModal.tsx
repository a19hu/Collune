import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Campaign, CampaignStatus, CreatorCategory, Brand, CampaignDeliverable } from '../../types';
import { campaignService } from '../../services/campaignService';
import { brandService } from '../../services/brandService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: Campaign | null;
  onSuccess: () => void;
}

const CATEGORIES: CreatorCategory[] = [
  'Fashion',
  'Beauty',
  'Technology',
  'Gaming',
  'Food',
  'Travel',
  'Fitness',
  'Finance',
  'Lifestyle',
  'Entertainment',
];

export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  onClose,
  campaignToEdit,
  onSuccess,
}) => {
  const { logAdminAction, currentUser } = useAuth();
  const { success, error } = useToast();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [title, setTitle] = useState('');
  const [brandId, setBrandId] = useState('');
  const [category, setCategory] = useState<CreatorCategory>('Fashion');
  const [budget, setBudget] = useState(500000);
  const [creatorsRequired, setCreatorsRequired] = useState(10);
  const [deliverablesStr, setDeliverablesStr] = useState('1x Dedicated Reel, 2x Stories');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [status, setStatus] = useState<CampaignStatus>('Active');
  const [description, setDescription] = useState('Brand amplification campaign targeting millennial demographics.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      const data = await brandService.getBrands();
      setBrands(data);
      if (data.length > 0 && !brandId) {
        setBrandId(data[0].id);
      }
    };
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (campaignToEdit) {
      setTitle(campaignToEdit.title);
      setBrandId(campaignToEdit.brandId);
      setCategory(campaignToEdit.category);
      setBudget(campaignToEdit.budget);
      setCreatorsRequired(campaignToEdit.creatorsRequired);
      setDeliverablesStr(
        campaignToEdit.deliverables.map((d) => `${d.quantity}x ${d.platform} ${d.type}`).join(', ')
      );
      setStartDate(campaignToEdit.startDate);
      setEndDate(campaignToEdit.endDate);
      setStatus(campaignToEdit.status);
      setDescription(campaignToEdit.description || '');
    } else {
      setTitle('');
      setCategory(CATEGORIES[0]);
      setBudget(500000);
      setCreatorsRequired(10);
      setDeliverablesStr('1x Dedicated Reel, 2x Stories');
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
      setStatus('Active');
      setDescription('Brand amplification campaign targeting engaged audiences across visual platforms.');
    }
  }, [campaignToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !brandId) {
      error('Missing fields', 'Title and Brand are required.');
      return;
    }

    setIsSubmitting(true);
    const selectedBrand = brands.find((b) => b.id === brandId);
    const brandName = selectedBrand ? selectedBrand.name : 'Brand Partner';
    const brandLogo = selectedBrand ? selectedBrand.logoUrl : 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&auto=format&fit=crop&q=80';

    const parsedDeliverables: CampaignDeliverable[] = deliverablesStr
      .split(',')
      .map((d, index) => {
        const text = d.trim();
        return {
          id: `deliv-${index + 1}`,
          title: text || 'Deliverable',
          platform: 'Instagram' as const,
          type: 'Reel' as const,
          quantity: 1,
          completedQuantity: 0,
          dueDate: endDate,
        };
      })
      .filter((d) => d.title.length > 0);

    try {
      if (campaignToEdit) {
        await campaignService.updateCampaign(campaignToEdit.id, {
          title,
          brandId,
          brandName,
          brandLogo,
          category,
          budget: Number(budget),
          creatorsRequired: Number(creatorsRequired),
          deliverables: parsedDeliverables.length > 0 ? parsedDeliverables : campaignToEdit.deliverables,
          startDate,
          endDate,
          status,
          description,
        });
        await logAdminAction('UPDATE', 'Campaigns', `Updated campaign "${title}" for ${brandName}`, campaignToEdit.id);
        success('Campaign Updated', `Saved changes for ${title}.`);
      } else {
        const created = await campaignService.createCampaign({
          title,
          brandId,
          brandName,
          brandLogo,
          category,
          description,
          objective: 'Brand Awareness & Product Discovery',
          targetAudience: '18-35 Age group, Tier 1 & 2 cities',
          platforms: ['Instagram', 'YouTube'],
          budget: Number(budget),
          creatorsRequired: Number(creatorsRequired),
          startDate,
          endDate,
          status,
          campaignManager: currentUser?.name || 'Staff Admin',
          deliverables: parsedDeliverables.length > 0 ? parsedDeliverables : [
            {
              id: 'deliv-1',
              title: 'Dedicated Instagram Reel',
              platform: 'Instagram',
              type: 'Reel',
              quantity: 1,
              completedQuantity: 0,
              dueDate: endDate,
            },
          ],
        });
        await logAdminAction('CREATE', 'Campaigns', `Created new campaign "${title}" with budget ₹${budget}`, created.id);
        success('Campaign Created', `Campaign "${title}" is now registered.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save campaign', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaignToEdit ? 'Edit Campaign' : 'Create New Campaign'}
      subtitle={campaignToEdit ? `Updating ID: ${campaignToEdit.campaignCode}` : 'Configure marketing goals, budget, and influencer slots.'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Campaign Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diwali Mega Festive Launch 2026"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Partner *
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Niche
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CreatorCategory)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Budget (INR ₹) *
            </label>
            <input
              type="number"
              required
              min={10000}
              step={10000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Creators Required *
            </label>
            <input
              type="number"
              required
              min={1}
              value={creatorsRequired}
              onChange={(e) => setCreatorsRequired(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Deliverables (Comma-separated)
          </label>
          <input
            type="text"
            value={deliverablesStr}
            onChange={(e) => setDeliverablesStr(e.target.value)}
            placeholder="e.g. 1x Reel, 2x Stories, 1x YouTube Short"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Campaign Brief / Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key messaging points and brand guidelines..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Campaign Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : campaignToEdit ? 'Save Campaign' : 'Launch Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
