import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Instagram,
  Loader2,
  MapPin,
  Save,
  Pencil,
  Trash2,
  Twitter,
  Upload,
  UserRound,
  Youtube,
} from 'lucide-react';
import {
  getFacebookConnectUrl,
  getCreatorProfile,
  getCreatorRateCards,
  getCreatorPortfolio,
  getCreatorPricing,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  updateCreatorProfile,
} from '../../../lib/authApi';
import type {
  CreatorListPlatformApi,
  CreatorPortfolioApi,
  CreatorProfileApi,
  CreatorSocialMediaPricingApi,
  CreatorSocialPlatform,
  RateCardApi,
} from '../../../types';
import {
  AddressComposer,
  formatLocationParts,
  getLocationDisplayValue,
  parseLocationParts,
} from '../../../pages/StepsCreatorRegister';
import { showProjectToast } from '../../../HtmlComponents/HtmlRoster';
import { SocialMediaPricing } from './SocialMediaPricing';
import { CreatorPortfolio } from './CreatorPortfolio';

type EditForm = {
  category: string;
  location: string;
  languages: string;
  collaboration_preferences: string;
  work_with: string;
  bio: string;
  about: string;
  gender: string;
  is_profile_visible: boolean;
  profile_image: File | null;
};

const CATEGORY_OPTIONS = [
  'Lifestyle',
  'Fashion',
  'Beauty',
  'Food',
  'Travel',
  'Fitness',
  'Gaming',
  'Technology',
  'Education',
  'Finance',
  'Entertainment',
  'Political Commentary',
];
const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Urdu',
];
const COLLABORATION_OPTIONS = [
  'Sponsored Post',
  'UGC Content',
  'Brand Ambassador',
  'Event Appearance',
  'Product Review',
  'Affiliate Campaign',
  'Long-term Partnership',
];

const platformMeta: Record<
  CreatorSocialPlatform,
  { label: string; color: string; Icon: typeof Instagram }
> = {
  INSTAGRAM: { label: 'Instagram', color: 'bg-[#e1306c]', Icon: Instagram },
  YOUTUBE: { label: 'YouTube', color: 'bg-[#ff0000]', Icon: Youtube },
  FACEBOOK: { label: 'Facebook', color: 'bg-[#1877f2]', Icon: Globe2 },
  X: { label: 'X', color: 'bg-[#111827]', Icon: Twitter },
};

function compactNumber(value?: number) {
  const safeValue = Number(value || 0);
  if (safeValue >= 1000000)
    return `${(safeValue / 1000000).toFixed(safeValue % 1000000 === 0 ? 0 : 1)}M`;
  if (safeValue >= 1000)
    return `${(safeValue / 1000).toFixed(safeValue % 1000 === 0 ? 0 : 1)}K`;
  return String(safeValue);
}

function listToCsv(value?: string[]) {
  return (value || []).join(', ');
}

function csvToList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditForm(profile: CreatorProfileApi): EditForm {
  const location =
    profile.location ||
    formatLocationParts({
      country: profile.country || '',
      state: profile.state || '',
      district: profile.district || '',
      city: profile.city || '',
      postalCode: profile.postalCode || '',
      streetAddress: profile.streetAddress || '',
    });
  return {
    category: profile.category || '',
    location,
    languages: listToCsv(profile.languages),
    collaboration_preferences: listToCsv(profile.collaboration_preferences),
    work_with: listToCsv(profile.work_with),
    bio: profile.bio || '',
    about: profile.about || '',
    gender: profile.gender || '',
    is_profile_visible: profile.is_profile_visible ?? true,
    profile_image: null,
  };
}

export function Card({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-[8px] border border-[#dce4f0] bg-white ${className}`}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-wide text-[#63708a]">
      {children}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm font-semibold text-[#25304a] outline-none focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="resize-none rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-sm font-semibold leading-relaxed text-[#25304a] outline-none focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      />
    </label>
  );
}

function getPlatformRows(profile: CreatorProfileApi): CreatorListPlatformApi[] {
  if (profile.platform_data?.length) return profile.platform_data;
  return (profile.social_accounts || []).map((account) => ({
    name: account.platform,
    followers: account.followers || 0,
    engagement_rate: account.engagement_rate,
    view_count: account.view_count,
    media_count: account.media_count,
  }));
}

export function CreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfileApi | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState<CreatorPortfolioApi[] | null>(
    null
  );
  const [pricing, setPricing] = useState<CreatorSocialMediaPricingApi[] | null>(
    null
  );
  const [rateCards, setRateCards] = useState<RateCardApi[] | null>(null);
  const [loadingSection, setLoadingSection] = useState('');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    getCreatorProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toEditForm(data));

        const params = new URLSearchParams(window.location.search);
        const connected = ['instagram', 'youtube', 'facebook', 'x'].find(
          (key) => params.get(key) === 'connected'
        );
        const failed = ['instagram', 'youtube', 'facebook', 'x'].find(
          (key) => params.get(key) === 'error'
        );
        if (connected) {
          setMessage(`${connected.toUpperCase()} connected.`);
          showProjectToast(
            'success',
            'Platform connected',
            `${connected.toUpperCase()} connected successfully.`
          );
        }
        if (failed) {
          const message = `${failed.toUpperCase()} connection failed. Please try again.`;
          setError(message);
          showProjectToast('error', 'Connection failed', message);
        }
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'Unable to load creator profile.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const section = window.location.hash.slice(1);
    if (!section) return;
    const timer = window.setTimeout(() => {
      setActiveSection(section);
      void loadSection(section);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const platformRows = useMemo(
    () => (profile ? getPlatformRows(profile) : []),
    [profile]
  );
  const totalFollowers =
    profile?.total_followers ??
    platformRows.reduce((sum, item) => sum + (item.followers || 0), 0);
  const avatar = profile?.profile_image_url || profile?.profile_image || '';
  const publicProfileUrl = profile ? `/creators/${profile.creator_id}` : '';

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function goToSection(section: string) {
    setActiveSection(section);
    window.history.replaceState(null, '', `#${section}`);
    void loadSection(section);
  }

  async function loadSection(section: string) {
    if (section === 'portfolio' && portfolio === null) {
      setLoadingSection(section);
      try {
        setPortfolio(await getCreatorPortfolio());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load portfolio.'
        );
      } finally {
        setLoadingSection('');
      }
    }
    if (section === 'pricing' && (pricing === null || rateCards === null)) {
      setLoadingSection(section);
      try {
        const [pricingItems, rateCardItems] = await Promise.all([
          getCreatorPricing(),
          getCreatorRateCards(),
        ]);
        setPricing(pricingItems);
        setRateCards(rateCardItems);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load pricing.'
        );
      } finally {
        setLoadingSection('');
      }
    }
  }

  async function saveProfile() {
    if (!form) return;
    setIsSaving(true);
    setError('');
    setMessage('');

    const body = new FormData();
    const address = parseLocationParts(form.location);
    body.append('category', form.category);
    body.append('location', form.location);
    body.append('country', address.country);
    body.append('state', address.state);
    body.append('district', address.district);
    body.append('city', address.city);
    body.append('postalCode', address.postalCode);
    body.append('streetAddress', address.streetAddress);
    body.append('languages', JSON.stringify(csvToList(form.languages)));
    body.append(
      'collaboration_preferences',
      JSON.stringify(csvToList(form.collaboration_preferences))
    );
    body.append('work_with', JSON.stringify(csvToList(form.work_with)));
    body.append('bio', form.bio);
    body.append('about', form.about);
    body.append('gender', form.gender);
    body.append('is_profile_visible', String(form.is_profile_visible));
    if (form.profile_image) body.append('profile_image', form.profile_image);

    try {
      const updated = await updateCreatorProfile(body);
      setProfile(updated);
      setForm(toEditForm(updated));
      setProfileEditorOpen(false);
      setMessage('Profile updated.');
      showProjectToast(
        'success',
        'Profile updated',
        'Your creator profile has been saved.'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to update creator profile.';
      setError(message);
      showProjectToast('error', 'Profile update failed', message);
    } finally {
      setIsSaving(false);
    }
  }

  async function connectSocial(
    platform: 'instagram' | 'youtube' | 'facebook' | 'x'
  ) {
    setConnectingPlatform(platform);
    setError('');
    try {
      const response =
        platform === 'instagram'
          ? await getInstagramConnectUrl()
          : platform === 'youtube'
            ? await getYouTubeConnectUrl()
            : platform === 'facebook'
              ? await getFacebookConnectUrl()
              : await getXConnectUrl();
      window.location.href = response.auth_url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Unable to connect ${platform}.`;
      setError(message);
      showProjectToast('error', 'Connection failed', message);
      setConnectingPlatform('');
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[8px] border border-[#dce4f0] bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-[#2447bd]" />
      </div>
    );
  }

  if (!profile || !form) {
    return (
      <Card className="p-6 text-sm font-semibold text-[#b42318]">
        {error || 'No creator profile found.'}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-3 text-[#25304a]">
      <div className="mx-auto grid  gap-4 ">
        <main className="grid gap-4">
          {error ? (
            <div className="rounded-[6px] border border-[#f3b7b7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
              {error}
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <div className="bg-[#172554] px-6 py-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#eaf0ff]">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={profile.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="m-5 h-10 w-10 text-[#173ca8]" />
                    )}
                    <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-white text-[#067647]">
                      {profile.verified ? (
                        <BadgeCheck className="h-5 w-5 fill-[#067647] text-white" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black">
                      {profile.display_name || 'Creator'}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-white/75">
                      {form.category || 'Category not added'} ·{' '}
                      {getLocationDisplayValue(form.location) ||
                        'Location not added'}
                    </p>
                  </div>
                </div>
                <div className="rounded-[8px] bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'is_profile_visible',
                        !form.is_profile_visible
                      )
                    }
                    className={`h-10 rounded-[6px] px-4 text-sm font-black ${form.is_profile_visible ? 'bg-[#ddfbea] text-[#067647]' : 'bg-[#fee4e2] text-[#b42318]'}`}
                  >
                    {form.is_profile_visible
                      ? 'Profile Visible'
                      : 'Profile Hidden'}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={publicProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-[6px] border border-[#d7deea] text-[#173ca8]"
                    aria-label="Open public profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-4">
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">
                  Visibility
                </span>
                <p className="mt-2 text-sm font-semibold text-[#25304a]">
                  {form.is_profile_visible
                    ? 'Brands and visitors can discover this profile.'
                    : 'This profile is hidden from public and brand discovery.'}
                </p>
              </div>
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">
                  Followers
                </span>
                <strong className="mt-2 block text-2xl font-black text-[#173ca8]">
                  {compactNumber(totalFollowers)}
                </strong>
              </div>
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">
                  Profile State
                </span>
                <strong className="mt-2 block text-lg font-black text-[#173ca8]">
                  {profile.verified ? 'Verified' : 'Under Review'}
                </strong>
              </div>
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">
                  Posts
                </span>
                <strong className="mt-2 block text-lg font-black text-[#173ca8]">
                  {compactNumber(profile.total_media_count)}
                </strong>
              </div>
            </div>
          </Card>

          <nav
            className="sticky top-3 z-10 overflow-x-auto rounded-[8px] border border-[#dce4f0] bg-white p-2 shadow-sm"
            aria-label="Creator profile sections"
          >
            <div className="flex min-w-max gap-1">
              {[
                ['profile', 'Profile'],
                ['contact', 'Contact'],
                ['social', 'Social Accounts'],
                ['portfolio', 'Portfolio'],
                ['pricing', 'Pricing'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToSection(id)}
                  className={`rounded-[6px] px-4 py-2 text-sm font-black transition ${activeSection === id ? 'bg-[#173ca8] text-white shadow-sm' : 'text-[#63708a] hover:bg-[#eef4ff] hover:text-[#173ca8]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <Card
            className={activeSection === 'profile' ? 'p-5' : 'hidden'}
            id="profile"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#172554]">
                  Profile data
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">
                  Your profile category, languages, and collaboration
                  preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileEditorOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#c9d7ff] bg-white px-3 text-sm font-black text-[#173ca8]"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['Category', form.category],
                ['Languages', form.languages],
                ['Collaboration preferences', form.collaboration_preferences],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[6px] border border-[#dbe3ee] bg-[#f8faff] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-[#63708a]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#25304a]">
                    {value || 'Not added'}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[6px] border border-[#dbe3ee] bg-[#f8faff] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#63708a]">
                  Bio
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[#25304a]">
                  {form.bio || 'Not added'}
                </p>
              </div>
              <div className="rounded-[6px] border border-[#dbe3ee] bg-[#f8faff] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#63708a]">
                  About
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[#25304a]">
                  {form.about || 'Not added'}
                </p>
              </div>
            </div>
          </Card>

          {profileEditorOpen ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Edit profile"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[10px] bg-white p-5 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#172554]">
                      Edit profile
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#63708a]">
                      Choose one category and select all applicable languages
                      and preferences.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileEditorOpen(false)}
                    className="text-sm font-bold text-[#63708a]"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold">
                    Category
                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateField('category', event.target.value)
                      }
                      className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm"
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Profile image
                    <span className="inline-flex h-11 items-center rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm font-semibold text-[#173ca8]">
                      <Upload className="mr-2 h-4 w-4" />
                      {form.profile_image
                        ? form.profile_image.name
                        : 'Choose image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          updateField(
                            'profile_image',
                            event.target.files?.[0] || null
                          )
                        }
                      />
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Languages
                    <select
                      multiple
                      value={csvToList(form.languages)}
                      onChange={(event) =>
                        updateField(
                          'languages',
                          Array.from(
                            event.target.selectedOptions,
                            (option) => option.value
                          ).join(', ')
                        )
                      }
                      className="min-h-32 rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-sm"
                    >
                      {LANGUAGE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-semibold text-[#63708a]">
                      Hold Ctrl/Cmd to select more than one.
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    Collaboration preferences
                    <select
                      multiple
                      value={csvToList(form.collaboration_preferences)}
                      onChange={(event) =>
                        updateField(
                          'collaboration_preferences',
                          Array.from(
                            event.target.selectedOptions,
                            (option) => option.value
                          ).join(', ')
                        )
                      }
                      className="min-h-32 rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-sm"
                    >
                      {COLLABORATION_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-semibold text-[#63708a]">
                      Hold Ctrl/Cmd to select more than one.
                    </span>
                  </label>
                </div>
                <div className="mt-5">
                  <AddressComposer
                    location={form.location}
                    onChange={(value) => updateField('location', value)}
                  />
                </div>
                <div className="mt-5 grid gap-4">
                  <TextArea
                    label="Bio"
                    value={form.bio}
                    onChange={(value) => updateField('bio', value)}
                    rows={4}
                    placeholder="Short summary shown on your profile."
                  />
                  <TextArea
                    label="About"
                    value={form.about}
                    onChange={(value) => updateField('about', value)}
                    rows={6}
                    placeholder="Longer profile story, audience, and content direction."
                  />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileEditorOpen(false)}
                    className="h-10 rounded-[6px] border border-[#d7deea] px-4 text-sm font-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#2447bd] px-4 text-sm font-black text-white disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save profile
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <Card
            className={activeSection === 'contact' ? 'p-5' : 'hidden'}
            id="contact"
          >
            <h2 className="text-xl font-black text-[#172554]">
              Contact Information
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#63708a]">
              These details come from the account used to register your creator
              profile.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['Contact Person', profile.contact_person_name],
                ['Work Email', profile.work_email],
                ['Phone Number', profile.contact_phone],
                ['WhatsApp Number', profile.whatsapp_number],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-2">
                  <FieldLabel>{label}</FieldLabel>
                  <p className="min-h-11 rounded-md border border-[#d7deea] bg-[#f8faff] px-3 py-2.5 text-sm font-semibold text-[#25304a]">
                    {value || 'Not provided'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className={activeSection === 'social' ? 'p-5' : 'hidden'}
            id="social"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#172554]">
                  Social accounts
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">
                  Connected metrics are read from the backend profile response.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['instagram', 'youtube', 'facebook', 'x'] as const).map(
                  (platform) => (
                    <button
                      key={platform}
                      type="button"
                      disabled={Boolean(connectingPlatform)}
                      onClick={() => void connectSocial(platform)}
                      className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#172554] px-3 text-xs font-black uppercase text-white disabled:opacity-60"
                    >
                      {connectingPlatform === platform ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Connect {platform}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {platformRows.length ? (
                platformRows.map((item) => {
                  const meta =
                    platformMeta[item.name] || platformMeta.INSTAGRAM;
                  const Icon = meta.Icon;
                  return (
                    <div
                      key={item.name}
                      className="rounded-[6px] border border-[#dbe3ee] bg-[#fbfcff] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-[6px] text-white ${meta.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <strong className="text-sm font-black text-[#25304a]">
                          {meta.label}
                        </strong>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="block text-xs font-bold text-[#63708a]">
                            Followers
                          </span>
                          <strong className="text-lg font-black text-[#173ca8]">
                            {compactNumber(item.followers)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#63708a]">
                            Engagement
                          </span>
                          <strong className="text-lg font-black text-[#173ca8]">
                            {Number(item.engagement_rate || 0).toFixed(1)}%
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[6px] border border-dashed border-[#cbd5e1] bg-[#fbfcff] p-5 text-sm font-semibold text-[#63708a] sm:col-span-2 lg:col-span-4">
                  No social accounts connected yet.
                </div>
              )}
            </div>
          </Card>

          {activeSection === 'portfolio' ? (
            loadingSection === 'portfolio' || portfolio === null ? (
              <Card className="grid min-h-48 place-items-center p-5">
                <Loader2 className="h-6 w-6 animate-spin text-[#2447bd]" />
              </Card>
            ) : (
              <CreatorPortfolio portfolio={portfolio} onChange={setPortfolio} />
            )
          ) : null}
          {activeSection === 'pricing' ? (
            loadingSection === 'pricing' ||
            pricing === null ||
            rateCards === null ? (
              <Card className="grid min-h-48 place-items-center p-5">
                <Loader2 className="h-6 w-6 animate-spin text-[#2447bd]" />
              </Card>
            ) : (
              <SocialMediaPricing
                pricing={pricing}
                rateCards={rateCards}
                onChange={setPricing}
              />
            )
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default CreatorProfile;
