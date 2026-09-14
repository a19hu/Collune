import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getNotifications, markNotificationsRead } from "../../lib/authApi";
import { notificationDestination } from "../../lib/notificationNavigation";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import type { NotificationItem } from "../../types";

function timeLabel(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const { refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true); setError("");
    getNotifications(10, false, page).then((response) => {
      if (!active) return;
      setItems(response.notifications); setTotalPages(response.total_pages); setUnreadCount(response.unread_count);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load notifications.");
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page]);

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markAsRead([notification.notification_id]);
      setItems((current) => current.map((item) => item.notification_id === notification.notification_id ? { ...item, is_read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    navigate(notificationDestination(notification, currentUser?.role || "Creator"));
  };

  const markPageRead = async () => {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.notification_id);
    if (!unreadIds.length) return;
    await markNotificationsRead({ notification_ids: unreadIds });
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount((count) => Math.max(0, count - unreadIds.length));
    void refreshNotifications();
  };

  return <div className="mx-auto max-w-4xl"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="inline-flex items-center gap-2 text-sm font-black text-[#65718a]"><Bell className="h-4 w-4 text-[#3158ca]" />Activity</p><h1 className="mt-2 text-3xl font-black text-[#173ca8]">Notifications</h1><p className="mt-2 text-sm font-semibold text-[#65718a]">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p></div><div className="flex gap-2"><button type="button" onClick={() => void markPageRead()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8e3ff] bg-white px-4 text-sm font-black text-[#3158ca]"><CheckCheck className="h-4 w-4" />Mark page read</button><button type="button" onClick={() => void markAllAsRead().then(() => { setItems((current) => current.map((item) => ({ ...item, is_read: true }))); setUnreadCount(0); })} className="h-10 rounded-lg bg-[#173fb5] px-4 text-sm font-black text-white">Mark all read</button></div></div>
    <section className="overflow-hidden rounded-xl border border-[#dce4f0] bg-white">{isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#3158ca]" /></div> : error ? <p className="p-6 text-sm font-semibold text-[#b42318]">{error}</p> : items.length ? <div>{items.map((item) => <button key={item.notification_id} type="button" onClick={() => void openNotification(item)} className={`flex w-full gap-4 border-b border-[#edf1f6] px-5 py-5 text-left transition last:border-0 hover:bg-[#f8faff] ${item.is_read ? "bg-white" : "bg-[#f2f6ff]"}`}><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.is_read ? "bg-[#d5dce9]" : "bg-[#3158ca]"}`} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-start justify-between gap-2"><strong className="text-sm font-black text-[#25304a]">{item.title}</strong><time className="text-xs font-semibold text-[#7b8597]">{timeLabel(item.created_at)}</time></span><span className="mt-1 block text-sm font-medium text-[#65718a]">{item.message}</span></span></button>)}</div> : <div className="grid min-h-64 place-items-center p-6 text-center"><Bell className="h-8 w-8 text-[#93a3d8]" /><p className="mt-3 text-sm font-semibold text-[#65718a]">You have no notifications yet.</p></div>}</section>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold text-[#65718a]">Page {page} of {totalPages}</p><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d8e3ff] text-[#3158ca] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-[#d8e3ff] text-[#3158ca] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>
  </div>;
}
