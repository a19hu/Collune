import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Creator, SocialProfile } from '../../types';
import { creatorService, UpdateCreatorPayload } from '../../services/creatorService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface CreatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator | null;
  onSuccess: (creator: Creator) => void;
}

const SOCIAL_PLATFORM_OPTIONS: SocialProfile['platform'][] = ['Instagram', 'YouTube', 'X'];

const inputClassName =
  'w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100';
const labelClassName = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

export const CreatorFormModal: React.FC<CreatorFormModalProps> = ({
  isOpen,
  onClose,
  creator,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const { logAdminAction } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<UpdateCreatorPayload>({
    name: '',
    email: '',
    phone: '',
    displayName: '',
    category: '',
    bio: '',
    about: '',
    gender: '',
    languages: [],
    collaborationPreferences: [],
    workWith: [],
    location: '',
    city: '',
    state: '',
    district: '',
    country: '',
    postalCode: '',
    streetAddress: '',
    isProfileVisible: true,
    socials: [],
  });

  useEffect(() => {
    if (!creator || !isOpen) return;
    setForm({
      name: creator.name || '',
      email: creator.email || '',
      phone: creator.phone || '',
      displayName: creator.displayName || creator.name || '',
      category: creator.category || '',
      bio: creator.bio || '',
      about: creator.about || '',
      gender: creator.gender || '',
      languages: creator.languages || [],
      collaborationPreferences: creator.collaborationPreferences || [],
      workWith: creator.workWith || [],
      location: creator.location || '',
      city: creator.city || '',
      state: creator.state || '',
      district: creator.district || '',
      country: creator.country || '',
      postalCode: creator.postalCode || '',
      streetAddress: creator.streetAddress || '',
      isProfileVisible: creator.isProfileVisible ?? true,
      socials: creator.socials?.length
        ? creator.socials.map((social) => ({ ...social }))
        : [
            { platform: 'Instagram', handle: '', followers: 0, engagementRate: 0, url: '' },
          ],
    });
  }, [creator, isOpen]);

  const socialRows = useMemo(() => form.socials || [], [form.socials]);

  const updateField = <K extends keyof UpdateCreatorPayload>(key: K, value: UpdateCreatorPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const updateSocial = (index: number, next: Partial<SocialProfile>) => {
    setForm((prev) => ({
      ...prev,
      socials: (prev.socials || []).map((social, socialIndex) =>
        socialIndex === index ? { ...social, ...next } : social
      ),
    }));
  };

  const addSocial = () => {
    setForm((prev) => ({
      ...prev,
      socials: [
        ...(prev.socials || []),
        { platform: 'Instagram', handle: '', followers: 0, engagementRate: 0, url: '' },
      ],
    }));
  };

  const removeSocial = (index: number) => {
    setForm((prev) => ({
      ...prev,
      socials: (prev.socials || []).filter((_, socialIndex) => socialIndex !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    setIsSubmitting(true);
    try {
      const updated = await creatorService.updateCreator(creator.id, {
        ...form,
        socials: (form.socials || []).filter((social) => social.platform && (social.handle || social.url)),
      });
      await logAdminAction('UPDATE', 'Creators', `Updated creator ${updated.name} (${updated.id})`, updated.id);
      success('Creator Updated', `Saved profile changes for ${updated.name}.`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      error('Failed to update creator', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Creator"
      subtitle={creator ? `Update profile and channel data for ${creator.name}` : 'Update creator details'}
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/30">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Edit2 className="w-4 h-4 text-indigo-500" />
              <span>Identity & Contact</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Full Name</label>
                <input className={inputClassName} value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div>
                <label className={labelClassName}>Display Name</label>
                <input className={inputClassName} value={form.displayName || ''} onChange={(e) => updateField('displayName', e.target.value)} />
              </div>
              <div>
                <label className={labelClassName}>Email</label>
                <input type="email" className={inputClassName} value={form.email || ''} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClassName}>Phone</label>
                <input className={inputClassName} value={form.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClassName}>Category</label>
                <input className={inputClassName} value={form.category || ''} onChange={(e) => updateField('category', e.target.value)} />
              </div>
              <div>
                <label className={labelClassName}>Gender</label>
                <input className={inputClassName} value={form.gender || ''} onChange={(e) => updateField('gender', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClassName}>Bio</label>
              <textarea className={inputClassName} rows={3} value={form.bio || ''} onChange={(e) => updateField('bio', e.target.value)} />
            </div>
            <div>
              <label className={labelClassName}>About</label>
              <textarea className={inputClassName} rows={4} value={form.about || ''} onChange={(e) => updateField('about', e.target.value)} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.isProfileVisible}
                onChange={(e) => updateField('isProfileVisible', e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Profile is visible to brands</span>
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/70 dark:bg-slate-950/30">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Location & Preferences</div>
            <div>
              <label className={labelClassName}>Full Location</label>
              <input className={inputClassName} value={form.location || ''} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelClassName}>City</label><input className={inputClassName} value={form.city || ''} onChange={(e) => updateField('city', e.target.value)} /></div>
              <div><label className={labelClassName}>State</label><input className={inputClassName} value={form.state || ''} onChange={(e) => updateField('state', e.target.value)} /></div>
              <div><label className={labelClassName}>District</label><input className={inputClassName} value={form.district || ''} onChange={(e) => updateField('district', e.target.value)} /></div>
              <div><label className={labelClassName}>Country</label><input className={inputClassName} value={form.country || ''} onChange={(e) => updateField('country', e.target.value)} /></div>
              <div><label className={labelClassName}>Postal Code</label><input className={inputClassName} value={form.postalCode || ''} onChange={(e) => updateField('postalCode', e.target.value)} /></div>
              <div><label className={labelClassName}>Street Address</label><input className={inputClassName} value={form.streetAddress || ''} onChange={(e) => updateField('streetAddress', e.target.value)} /></div>
            </div>
            <div>
              <label className={labelClassName}>Languages</label>
              <input className={inputClassName} value={(form.languages || []).join(', ')} onChange={(e) => updateField('languages', parseList(e.target.value))} placeholder="English, Hindi" />
            </div>
            <div>
              <label className={labelClassName}>Collaboration Preferences</label>
              <input className={inputClassName} value={(form.collaborationPreferences || []).join(', ')} onChange={(e) => updateField('collaborationPreferences', parseList(e.target.value))} placeholder="Reels, UGC, Stories" />
            </div>
            <div>
              <label className={labelClassName}>Works With</label>
              <input className={inputClassName} value={(form.workWith || []).join(', ')} onChange={(e) => updateField('workWith', parseList(e.target.value))} placeholder="Beauty brands, SaaS, Fitness apps" />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Connected Channels</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Edit social presence, followers, engagement, and URLs.</div>
            </div>
            <button type="button" onClick={addSocial} className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Channel</span>
            </button>
          </div>

          <div className="space-y-3">
            {socialRows.map((social, index) => (
              <div key={`${social.platform}-${index}`} className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.3fr_1fr_1fr_1.5fr_auto] gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/60">
                <select className={inputClassName} value={social.platform} onChange={(e) => updateSocial(index, { platform: e.target.value as SocialProfile['platform'] })}>
                  {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                <input className={inputClassName} value={social.handle} onChange={(e) => updateSocial(index, { handle: e.target.value })} placeholder="@creatorhandle" />
                <input type="number" min={0} className={inputClassName} value={social.followers} onChange={(e) => updateSocial(index, { followers: Number(e.target.value) })} placeholder="Followers" />
                <input type="number" min={0} step="0.1" className={inputClassName} value={social.engagementRate} onChange={(e) => updateSocial(index, { engagementRate: Number(e.target.value) })} placeholder="ER %" />
                <input className={inputClassName} value={social.url} onChange={(e) => updateSocial(index, { url: e.target.value })} placeholder="https://..." />
                <button type="button" onClick={() => removeSocial(index)} className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {isSubmitting ? 'Saving...' : 'Save Creator'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
