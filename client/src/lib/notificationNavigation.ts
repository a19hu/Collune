import type { NotificationItem, UserAccount } from "../types";

export function notificationDestination(notification: NotificationItem, role: UserAccount["role"]) {
  const data = notification.data || {};
  const value = (key: string) => typeof data[key] === "string" ? data[key] : "";
  const base = role === "Brand" ? "/brand" : "/creator";
  const conversationId = value("conversation_id");
  if (conversationId) return `${base}/chat?conversationId=${encodeURIComponent(conversationId)}`;
  const campaignId = value("campaign_id");
  if (campaignId) return role === "Brand" ? `/brand/campaigns/${campaignId}` : `/creator/marketplace/${campaignId}`;
  const shortlistId = value("shortlist_id");
  if (shortlistId && role === "Brand") return `/brand/shortlists/${shortlistId}`;
  const creatorId = value("creator_id");
  if (creatorId) return `/creator_profile/${creatorId}`;
  const brandId = value("brand_id");
  if (brandId) return `/brands/${brandId}`;
  return `${base}/notifications`;
}
