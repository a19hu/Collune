import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createCreatorPortfolio, deleteCreatorPortfolio, updateCreatorPortfolio } from "@/src/lib/authApi";
import type { CreatorPortfolioApi } from "@/src/types";
import { showProjectToast } from "@/src/HtmlComponents/HtmlRoster";
import { Card } from "./CreatorProfile";

type PortfolioForm = { title: string; sub_title: string; link: string; image: File | null; video: File | null };
type Props = { portfolio: CreatorPortfolioApi[]; onChange: (items: CreatorPortfolioApi[]) => void };
const emptyForm: PortfolioForm = { title: "", sub_title: "", link: "", image: null, video: null };

export function CreatorPortfolio({ portfolio, onChange }: Props) {
  const [form, setForm] = useState<PortfolioForm>(emptyForm);
  const [editing, setEditing] = useState<CreatorPortfolioApi | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const dialogOpen = adding || Boolean(editing);

  function openAdd() { setForm(emptyForm); setEditing(null); setAdding(true); }
  function openEdit(item: CreatorPortfolioApi) { setForm({ title: item.title, sub_title: item.sub_title, link: item.link, image: null, video: null }); setAdding(false); setEditing(item); }
  function closeDialog() { setAdding(false); setEditing(null); }

  async function save() {
    if (!form.title.trim() && !form.link.trim() && !form.image && !form.video) return;
    setSaving(true);
    const body = new FormData();
    body.append("title", form.title); body.append("sub_title", form.sub_title); body.append("link", form.link);
    if (form.image) body.append("image", form.image);
    if (form.video) body.append("video", form.video);
    try {
      if (editing) {
        const item = await updateCreatorPortfolio(editing.id, body);
        onChange(portfolio.map((value) => value.id === item.id ? item : value));
        showProjectToast("success", "Portfolio updated", "Your portfolio item has been saved.");
      } else {
        const item = await createCreatorPortfolio(body);
        onChange([item, ...portfolio]);
        showProjectToast("success", "Portfolio item added", "Your work is ready for your public profile.");
      }
      closeDialog();
    } catch (error) { showProjectToast("error", "Could not save portfolio item", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this portfolio item?")) return;
    setSaving(true);
    try { await deleteCreatorPortfolio(id); onChange(portfolio.filter((item) => item.id !== id)); }
    catch (error) { showProjectToast("error", "Could not delete portfolio item", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  }

  return <Card className="p-5" id="portfolio">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-[#172554]">Portfolio</h2><p className="mt-1 text-sm font-semibold text-[#63708a]">Add work samples that appear on your public profile.</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#173ca8]">{portfolio.length} item{portfolio.length === 1 ? "" : "s"}</span><button type="button" onClick={openAdd} className="rounded-[6px] bg-[#2447bd] px-3 py-2 text-xs font-black text-white">Add item</button></div></div>
    <div role="region" aria-label="Portfolio table" tabIndex={0} className="mt-5 max-w-full overflow-x-scroll overscroll-x-contain rounded-[6px] border border-[#dbe3ee]"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f8faff] text-xs font-black uppercase tracking-wide text-[#63708a]"><tr><th className="px-4 py-3">Preview</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Subtitle</th><th className="px-4 py-3">Link</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#e5eaf2]">
      {portfolio.map((item) => <tr key={item.id} className="text-[#25304a]"><td className="px-4 py-3"><div className="h-12 w-12 overflow-hidden rounded-[6px] bg-[#eef4ff]">{item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : item.video_url ? <video src={item.video_url} className="h-full w-full object-cover" muted /> : null}</div></td><td className="px-4 py-3 font-bold">{item.title || "Untitled"}</td><td className="px-4 py-3">{item.sub_title || "—"}</td><td className="max-w-[260px] truncate px-4 py-3"><a href={item.link || undefined} target="_blank" rel="noreferrer" className="text-[#173ca8] hover:underline">{item.link || "—"}</a></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="grid h-8 w-8 place-items-center rounded-[6px] border border-[#c9d7ff] text-[#173ca8]"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(item.id)} disabled={saving} aria-label={`Delete ${item.title}`} className="grid h-8 w-8 place-items-center rounded-[6px] border border-[#f5c2c7] text-[#b42318]"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
      {!portfolio.length ? <tr><td colSpan={5} className="px-4 py-10 text-center font-semibold text-[#63708a]">No portfolio items yet.</td></tr> : null}
    </tbody></table></div>
    {dialogOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-[10px] bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-lg font-black text-[#172554]">{editing ? "Edit portfolio item" : "Add portfolio item"}</h3><button type="button" onClick={closeDialog} className="text-sm font-bold text-[#63708a]">Cancel</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Title<input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm" /></label><label className="grid gap-2 text-sm font-bold">Subtitle<input value={form.sub_title} onChange={(event) => setForm((value) => ({ ...value, sub_title: event.target.value }))} className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">External link<input value={form.link} onChange={(event) => setForm((value) => ({ ...value, link: event.target.value }))} placeholder="https://..." className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm" /></label><label className="cursor-pointer rounded-[6px] border border-dashed border-[#b8c7e2] px-3 py-3 text-sm font-bold text-[#173ca8]">Upload image<input type="file" accept="image/*" className="hidden" onChange={(event) => setForm((value) => ({ ...value, image: event.target.files?.[0] || null, video: null }))} /><span className="ml-2 text-xs text-[#63708a]">{form.image?.name || "Optional"}</span></label><label className="cursor-pointer rounded-[6px] border border-dashed border-[#b8c7e2] px-3 py-3 text-sm font-bold text-[#173ca8]">Upload video<input type="file" accept=".mp4,.mov,.avi,.webm,video/*" className="hidden" onChange={(event) => setForm((value) => ({ ...value, image: null, video: event.target.files?.[0] || null }))} /><span className="ml-2 text-xs text-[#63708a]">{form.video?.name || "Optional"}</span></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeDialog} className="h-10 rounded-[6px] border border-[#d7deea] px-4 text-sm font-black">Cancel</button><button type="button" onClick={() => void save()} disabled={saving} className="h-10 rounded-[6px] bg-[#2447bd] px-4 text-sm font-black text-white disabled:opacity-60">{saving ? "Saving..." : editing ? "Save changes" : "Add item"}</button></div></div></div> : null}
  </Card>;
}
