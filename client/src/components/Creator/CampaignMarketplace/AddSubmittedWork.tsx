import { ArrowLeft, FileText, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createCreatorWorkSubmission, getCreatorAppliedCampaigns, getCreatorRateCards } from "../../../lib/authApi";
import { showProjectToast } from "../../../HtmlComponents/HtmlRoster";
import type { CreatorAppliedCampaignApi, RateCardApi } from "../../../types";

type SubmissionForm = {
  campaignId: string;
  platform: string;
  contentType: string;
  contentTitle: string;
  contentUrl: string;
  publishedDate: string;
  description: string;
  creatorRemarks: string;
  screenshot: File | null;
  attachment: File | null;
};

const emptyForm: SubmissionForm = {
  campaignId: "", platform: "", contentType: "", contentTitle: "", contentUrl: "", publishedDate: "", description: "", creatorRemarks: "", screenshot: null, attachment: null,
};

export function AddSubmittedWork() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<SubmissionForm>(emptyForm);
  const [campaigns, setCampaigns] = useState<CreatorAppliedCampaignApi[]>([]);
  const [rateCards, setRateCards] = useState<RateCardApi[]>([]);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCreatorAppliedCampaigns(), getCreatorRateCards()])
      .then(([applications, cards]) => {
        if (!active) return;
        const accepted = applications.campaigns.filter((item) => item.application_status === "ACCEPTED");
        const requestedCampaignId = searchParams.get("campaignId") || "";
        const selected = accepted.find((item) => item.campaign.id === requestedCampaignId);
        setCampaigns(accepted);
        setRateCards(cards);
        if (selected) {
          setForm((current) => ({ ...current, campaignId: selected.campaign.id }));
          setCampaignSearch(selected.campaign.title);
        }
      })
      .catch((error) => active && setLoadError(error instanceof Error ? error.message : "Unable to load submission details."))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [searchParams]);

  const selectedCampaign = campaigns.find((item) => item.campaign.id === form.campaignId);
  const platforms = useMemo(() => Array.from(new Set(rateCards.map((item) => item.platform))).sort(), [rateCards]);
  const contentTypes = useMemo(() => rateCards.filter((item) => item.platform === form.platform).sort((a, b) => a.sort_order - b.sort_order || a.service.localeCompare(b.service)), [form.platform, rateCards]);

  const chooseCampaign = (title: string) => {
    setCampaignSearch(title);
    const matched = campaigns.find((item) => item.campaign.title === title);
    setForm((current) => ({ ...current, campaignId: matched?.campaign.id || "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.campaignId || !form.platform || !form.contentType || !form.contentUrl.trim()) {
      showProjectToast("error", "Complete the required fields", "Choose an accepted campaign, platform, content type, and add the published content link.");
      return;
    }
    setIsSaving(true);
    const payload = new FormData();
    payload.append("campaign_id", form.campaignId);
    payload.append("platform", form.platform);
    payload.append("content_type", form.contentType);
    payload.append("content_title", form.contentTitle.trim());
    payload.append("content_url", form.contentUrl.trim());
    if (form.publishedDate) payload.append("published_date", form.publishedDate);
    payload.append("description", form.description.trim());
    payload.append("creator_remarks", form.creatorRemarks.trim());
    if (form.screenshot) payload.append("screenshot_url", form.screenshot, form.screenshot.name);
    if (form.attachment) payload.append("attachment_url", form.attachment, form.attachment.name);
    try {
      await createCreatorWorkSubmission(payload);
      showProjectToast("success", "Work submitted", "Your content has been sent to the brand for review.");
      navigate("/creator/submitted-work");
    } catch (error) {
      showProjectToast("error", "Could not submit work", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="grid min-h-[360px] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#5168ff]" /></div>;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate("/creator/submitted-work")} className="inline-flex items-center gap-2 text-sm font-black text-[#5168ff] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to submitted work</button>
      <section className="mt-4 rounded-lg border border-[#dfe6f0] bg-white p-5 shadow-[0_2px_4px_rgba(20,30,60,0.02)] sm:p-7">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#5168ff]"><FileText className="h-5 w-5" /></span><div><h1 className="text-xl font-black text-[#1d2430]">Add submitted work</h1><p className="mt-1 text-sm font-medium text-[#65758f]">Submit content for a campaign where you have been officially accepted.</p></div></div>
        {loadError ? <p className="mt-5 rounded-md bg-[#fff1f2] p-3 text-sm font-semibold text-[#b42318]">{loadError}</p> : null}
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-black text-[#25304a]">Campaign <span className="text-[#d23b3b]">*</span>
            <input list="accepted-campaigns" value={campaignSearch} onChange={(event) => chooseCampaign(event.target.value)} placeholder="Search accepted campaigns..." className="h-11 rounded-md border border-[#d7deea] px-3 text-sm font-medium outline-none focus:border-[#5168ff] focus:ring-2 focus:ring-[#dce4ff]" />
            <datalist id="accepted-campaigns">{campaigns.map((item) => <option key={item.application_id} value={item.campaign.title}>{item.campaign.brand_name}</option>)}</datalist>
          </label>
          {!campaigns.length && !loadError ? <p className="rounded-md bg-[#fff8e5] p-3 text-sm font-semibold text-[#8a5a00]">You do not have any accepted campaigns yet.</p> : null}
          {selectedCampaign ? <div className="grid gap-3 rounded-lg bg-[#f8faff] p-4 text-sm sm:grid-cols-3"><div><span className="block text-xs font-black uppercase text-[#63708a]">Campaign Name</span><strong className="mt-1 block text-[#1d2430]">{selectedCampaign.campaign.title}</strong></div><div><span className="block text-xs font-black uppercase text-[#63708a]">Brand</span><strong className="mt-1 block text-[#1d2430]">{selectedCampaign.campaign.brand_name}</strong></div><div><span className="block text-xs font-black uppercase text-[#63708a]">Deadline</span><strong className="mt-1 block text-[#1d2430]">{selectedCampaign.campaign.deadline || "Not set"}</strong></div></div> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-[#25304a]">Platform <span className="text-[#d23b3b]">*</span><select value={form.platform} onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value, contentType: "" }))} className="h-11 rounded-md border border-[#d7deea] bg-white px-3 text-sm font-medium outline-none focus:border-[#5168ff]" disabled={!rateCards.length}><option value="">Select platform</option>{platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-black text-[#25304a]">Content Type <span className="text-[#d23b3b]">*</span><select value={form.contentType} onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value }))} className="h-11 rounded-md border border-[#d7deea] bg-white px-3 text-sm font-medium outline-none focus:border-[#5168ff] disabled:bg-[#f5f7fa]" disabled={!form.platform}><option value="">Select content type</option>{contentTypes.map((item) => <option key={item.id} value={item.service}>{item.service}</option>)}</select></label>
          </div>
          <label className="grid gap-2 text-sm font-black text-[#25304a]">Content Title<input value={form.contentTitle} onChange={(event) => setForm((current) => ({ ...current, contentTitle: event.target.value }))} placeholder="e.g. Morning skincare routine" className="h-11 rounded-md border border-[#d7deea] px-3 text-sm font-medium outline-none focus:border-[#5168ff]" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-black text-[#25304a]">Published Content Link <span className="text-[#d23b3b]">*</span><input type="url" required value={form.contentUrl} onChange={(event) => setForm((current) => ({ ...current, contentUrl: event.target.value }))} placeholder="https://..." className="h-11 rounded-md border border-[#d7deea] px-3 text-sm font-medium outline-none focus:border-[#5168ff]" /></label><label className="grid gap-2 text-sm font-black text-[#25304a]">Published Date<input type="date" value={form.publishedDate} onChange={(event) => setForm((current) => ({ ...current, publishedDate: event.target.value }))} className="h-11 rounded-md border border-[#d7deea] px-3 text-sm font-medium outline-none focus:border-[#5168ff]" /></label></div>
          <label className="grid gap-2 text-sm font-black text-[#25304a]">Description / Work Details<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Share the work details, messaging, and anything the brand should know." className="rounded-md border border-[#d7deea] px-3 py-2 text-sm font-medium outline-none focus:border-[#5168ff]" /></label>
          <label className="grid gap-2 text-sm font-black text-[#25304a]">Creator Remarks<textarea value={form.creatorRemarks} onChange={(event) => setForm((current) => ({ ...current, creatorRemarks: event.target.value }))} rows={3} placeholder="Optional notes for the brand" className="rounded-md border border-[#d7deea] px-3 py-2 text-sm font-medium outline-none focus:border-[#5168ff]" /></label>
          <div className="grid gap-5 sm:grid-cols-2"><label className="cursor-pointer rounded-md border border-dashed border-[#b8c7e2] p-4 text-sm font-black text-[#3048ff]"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Screenshot / Proof <span className="font-medium text-[#65758f]">(optional)</span></span><input type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => setForm((current) => ({ ...current, screenshot: event.target.files?.[0] || null }))} /><span className="mt-2 block truncate text-xs font-medium text-[#65758f]">{form.screenshot?.name || "Upload an image or PDF"}</span></label><label className="cursor-pointer rounded-md border border-dashed border-[#b8c7e2] p-4 text-sm font-black text-[#3048ff]"><span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Additional File <span className="font-medium text-[#65758f]">(optional)</span></span><input type="file" className="hidden" onChange={(event) => setForm((current) => ({ ...current, attachment: event.target.files?.[0] || null }))} /><span className="mt-2 block truncate text-xs font-medium text-[#65758f]">{form.attachment?.name || "Upload a supporting file"}</span></label></div>
          <div className="flex justify-end gap-3 border-t border-[#edf1f6] pt-5"><button type="button" onClick={() => navigate("/creator/submitted-work")} disabled={isSaving} className="h-11 rounded-md border border-[#d7deea] px-4 text-sm font-black text-[#63708a]">Cancel</button><button type="submit" disabled={isSaving || !campaigns.length} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#5168ff] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{isSaving ? "Submitting..." : "Submit work"}</button></div>
        </form>
      </section>
    </main>
  );
}
