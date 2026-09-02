import {
  CheckCheck,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  SendHorizonal,
  Smile,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { showProjectToast } from "../../HtmlComponents/HtmlRoster";
import { useAuth } from "../../contexts/AuthContext";
import { authStorage } from "../../contexts/authStorage";
import {
  createChatConversation,
  getChatConversationMessages,
  getChatConversations,
  getChatInboxSocketUrl,
  getChatSocketUrl,
  markChatConversationRead,
  sendChatMessage,
} from "../../lib/authApi";
import { playIncomingMessageSound, showDesktopNotification } from "../../lib/sound";
import type { ChatConversationApi, ChatMessageApi } from "../../types";

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDay(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

type PresenceInfo = { is_online: boolean; last_seen?: string | null };

function formatLastSeen(value?: string | null) {
  if (!value) return "Offline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Offline";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Last seen just now";
  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;
  return `Last seen ${formatDay(value)}`;
}

function extractPresence(items: ChatConversationApi[]) {
  const map: Record<string, PresenceInfo> = {};
  items.forEach((item) => {
    const participant = item.other_participant;
    if (participant?.user_id) {
      map[participant.user_id] = {
        is_online: !!participant.is_online,
        last_seen: participant.last_seen ?? null,
      };
    }
  });
  return map;
}

function getAvatarFallback(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "CH";
}

function sortConversations(items: ChatConversationApi[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.latest_message?.created_at || left.updated_at).getTime();
    const rightTime = new Date(right.latest_message?.created_at || right.updated_at).getTime();
    return rightTime - leftTime;
  });
}

function isOwnChatMessage(message: ChatMessageApi, currentUser: { user_id?: string; email?: string; name?: string; role?: string } | null) {
  if (!currentUser) return false;
  if (currentUser.user_id && message.sender.user_id === currentUser.user_id) return true;
  if (currentUser.email && message.sender.email?.toLowerCase() === currentUser.email.toLowerCase()) return true;
  if (currentUser.role && message.sender.role?.toLowerCase() === currentUser.role.toUpperCase()) {
    if (currentUser.name && message.sender.name?.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      return true;
    }
  }
  return false;
}

function ChatAvatar({
  name,
  subtitle,
  avatar,
  size = "md",
  isOnline,
}: {
  name: string;
  subtitle?: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}) {
  const sizeClass = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-10 w-10" : "h-11 w-11";
  const fallback = getAvatarFallback(name);
  const ringClass = subtitle?.toLowerCase().includes("brand") ? "from-[#0f766e] to-[#14b8a6]" : "from-[#3659d7] to-[#7c8fff]";

  const statusDot = isOnline !== undefined ? (
    <span
      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
        isOnline ? "bg-emerald-500" : "bg-[#b7c0c2]"
      }`}
    />
  ) : null;

  if (avatar) {
    return (
      <span className="relative inline-block shrink-0">
        <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover`} />
        {statusDot}
      </span>
    );
  }

  return (
    <span className="relative inline-block shrink-0">
      <div className={`grid ${sizeClass} place-items-center rounded-full bg-gradient-to-br ${ringClass} text-sm font-black text-white`}>
        {fallback}
      </div>
      {statusDot}
    </span>
  );
}

function ConversationItem({
  conversation,
  isActive,
  isOnline,
  onClick,
}: {
  conversation: ChatConversationApi;
  isActive: boolean;
  isOnline?: boolean;
  onClick: () => void;
}) {
  const latestMessage = conversation.latest_message?.content || "Start a conversation";
  const latestAt = conversation.latest_message?.created_at || conversation.updated_at;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        isActive
          ? "bg-[#e8f2f0] shadow-[0_10px_24px_rgba(15,118,110,0.08)]"
          : "hover:bg-[#f6faf9]"
      }`}
    >
      <ChatAvatar
        name={conversation.other_participant.name}
        subtitle={conversation.other_participant.subtitle}
        avatar={conversation.other_participant.avatar}
        isOnline={isOnline}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[15px] font-black text-[#132238]">{conversation.other_participant.name}</p>
          <span className={`shrink-0 text-[11px] font-semibold ${conversation.unread_count ? "text-[#0f766e]" : "text-[#7d8ca2]"}`}>
            {formatTime(latestAt)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-[#617086]">{latestMessage}</p>
          {conversation.unread_count ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#0f766e] px-1.5 py-0.5 text-[11px] font-black text-white">
              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8f2f0] text-[#0f766e]">
          <MessageCircle className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xl font-black text-[#132238]">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-[#617086]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [conversations, setConversations] = useState<ChatConversationApi[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessageApi[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceInfo>>({});
  const inboxSocketRef = useRef<WebSocket | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversation_id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const activePresence = activeConversation?.other_participant.user_id
    ? presenceMap[activeConversation.other_participant.user_id]
    : undefined;

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((item) => {
      const haystack = [
        item.other_participant.name,
        item.other_participant.subtitle,
        item.latest_message?.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [conversations, search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    setIsLoadingConversations(true);

    getChatConversations()
      .then(async (response) => {
        if (!mounted) return;

        let nextConversations = sortConversations(response.conversations);
        const creatorId = searchParams.get("creatorId");
        const brandId = searchParams.get("brandId");
        const conversationId = searchParams.get("conversationId");
        let selectedConversationId = conversationId;

        if (creatorId || brandId) {
          try {
            const created = await createChatConversation({
              creator_id: creatorId || undefined,
              brand_id: brandId || undefined,
            });
            const existing = nextConversations.find(
              (item) => item.conversation_id === created.conversation.conversation_id,
            );
            nextConversations = sortConversations(
              existing ? nextConversations : [created.conversation, ...nextConversations],
            );
            selectedConversationId = created.conversation.conversation_id;
            setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.delete("creatorId");
              next.delete("brandId");
              next.set("conversationId", created.conversation.conversation_id);
              return next;
            }, { replace: true });
          } catch (error) {
            showProjectToast(
              "error",
              "Chat unavailable",
              error instanceof Error ? error.message : "Unable to start chat.",
            );
          }
        }

        setConversations(nextConversations);
        setPresenceMap((prev) => ({ ...prev, ...extractPresence(nextConversations) }));
        const chosenId = selectedConversationId || nextConversations[0]?.conversation_id || "";
        if (chosenId) setActiveConversationId(chosenId);
      })
      .catch((error) => {
        if (!mounted) return;
        showProjectToast(
          "error",
          "Chat load failed",
          error instanceof Error ? error.message : "Unable to load chats.",
        );
      })
      .finally(() => {
        if (mounted) setIsLoadingConversations(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchParamsKey, setSearchParams]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let mounted = true;
    setIsLoadingMessages(true);

    getChatConversationMessages(activeConversationId)
      .then((response) => {
        if (!mounted) return;
        setMessages(response.messages);
        setConversations((items) =>
          items.map((item) =>
            item.conversation_id === activeConversationId ? { ...item, unread_count: 0 } : item,
          ),
        );
        void markChatConversationRead(activeConversationId);
      })
      .catch((error) => {
        if (mounted) {
          showProjectToast(
            "error",
            "Messages failed",
            error instanceof Error ? error.message : "Unable to load messages.",
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingMessages(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeConversationId]);

  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) return;

    const socket = new WebSocket(getChatInboxSocketUrl(token));
    inboxSocketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          event?: string;
          conversation_id?: string;
          message?: ChatMessageApi;
          user_id?: string;
          is_online?: boolean;
          last_seen?: string | null;
        };

        if (payload.event === "presence.update" && payload.user_id) {
          setPresenceMap((prev) => ({
            ...prev,
            [payload.user_id as string]: {
              is_online: !!payload.is_online,
              last_seen: payload.last_seen ?? prev[payload.user_id as string]?.last_seen ?? null,
            },
          }));
          return;
        }

        if (payload.event !== "chat.inbox" || !payload.message || !payload.conversation_id) return;
        const isOwnMessage = payload.message ? isOwnChatMessage(payload.message, currentUser) : false;

        setConversations((items) => {
          const existing = items.find((item) => item.conversation_id === payload.conversation_id);
          const nextItems = items.map((item) => {
            if (item.conversation_id !== payload.conversation_id) return item;
            const isActive = payload.conversation_id === activeConversationId;
            return {
              ...item,
              latest_message: payload.message || item.latest_message,
              unread_count: isOwnMessage || isActive ? 0 : (item.unread_count || 0) + 1,
            };
          });

          if (existing) return sortConversations(nextItems);
          void getChatConversations()
            .then((response) => {
              setConversations(sortConversations(response.conversations));
              setPresenceMap((prev) => ({ ...prev, ...extractPresence(response.conversations) }));
            })
            .catch(() => undefined);
          return items;
        });

        if (!isOwnMessage) {
          void playIncomingMessageSound();
          showDesktopNotification(activeConversationId === payload.conversation_id ? 'New message in active chat' : 'New chat message', {
            body: `${payload.message.sender.name}: ${payload.message.content}`,
          });
        }

        if (payload.conversation_id === activeConversationId) {
          setMessages((items) =>
            items.some((item) => item.message_id === payload.message!.message_id)
              ? items
              : [...items, payload.message!],
          );
          void markChatConversationRead(payload.conversation_id);
        }
      } catch {
      }
    };

    return () => {
      socket.close();
      if (inboxSocketRef.current === socket) inboxSocketRef.current = null;
    };
  }, [activeConversationId, currentUser?.user_id]);

  useEffect(() => {
    if (!activeConversationId) return;
    const token = authStorage.getAccessToken();
    if (!token) return;

    const socket = new WebSocket(getChatSocketUrl(activeConversationId, token));
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          event?: string;
          message?: ChatMessageApi;
        };
        if (payload.event !== "chat.message" || !payload.message) return;
        if (payload.message.conversation_id !== activeConversationId) return;

        setMessages((items) =>
          items.some((item) => item.message_id === payload.message!.message_id)
            ? items
            : [...items, payload.message!],
        );
        setConversations((items) =>
          sortConversations(
            items.map((item) =>
              item.conversation_id === activeConversationId
                ? { ...item, latest_message: payload.message!, unread_count: 0 }
                : item,
            ),
          ),
        );
      } catch {
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [activeConversationId]);

  async function handleSend() {
    if (!activeConversationId || !draft.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await sendChatMessage(activeConversationId, draft.trim());
      setMessages((items) =>
        items.some((item) => item.message_id === response.message.message_id)
          ? items
          : [...items, response.message],
      );
      setConversations((items) =>
        sortConversations(
          items.map((item) =>
            item.conversation_id === activeConversationId
              ? { ...item, latest_message: response.message, unread_count: 0 }
              : item,
          ),
        ),
      );
      setDraft("");
    } catch (error) {
      showProjectToast(
        "error",
        "Message failed",
        error instanceof Error ? error.message : "Unable to send message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#dce7e4] bg-[#f2f6f5] shadow-[0_24px_60px_rgba(20,30,60,0.08)]">
      <div className="grid h-[74vh] min-h-[74vh] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col border-r border-[#dde8e4] bg-[#f8fbfa]">
          <div className="border-b border-[#dde8e4] bg-[#eef5f3] px-5 py-4">
            <div className="flex items-center gap-3">
              <ChatAvatar
                name={currentUser?.name || currentUser?.email || "You"}
                subtitle={currentUser?.role}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-[#132238]">{currentUser?.name || "Your Inbox"}</p>
                <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
                  {currentUser?.role || "Chat"}
                </p>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8b8d]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search or start a new chat"
                className="h-11 w-full rounded-full border border-[#d6e3df] bg-white pl-11 pr-4 text-sm font-medium text-[#223248] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {isLoadingConversations ? (
              <div className="grid min-h-[260px] place-items-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#0f766e]" />
              </div>
            ) : !filteredConversations.length ? (
              <EmptyState
                title={search.trim() ? "No matching chats" : "No chats yet"}
                subtitle={search.trim() ? "Try another name or keyword." : "Start from a saved creator or saved campaign to open a conversation."}
              />
            ) : (
              <div className="space-y-1.5">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.conversation_id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.conversation_id}
                    isOnline={presenceMap[conversation.other_participant.user_id]?.is_online ?? conversation.other_participant.is_online}
                    onClick={() => {
                      setActiveConversationId(conversation.conversation_id);
                      setSearchParams((current) => {
                        const next = new URLSearchParams(current);
                        next.set("conversationId", conversation.conversation_id);
                        return next;
                      }, { replace: true });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#efeae2]">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#d7d2cb 0.8px, transparent 0.8px)", backgroundSize: "22px 22px" }} />

          {activeConversation ? (
            <>
              <header className="relative z-10 flex items-center gap-3 border-b border-[#ddd6ce] bg-[#f7f4ef] px-5 py-4 shadow-sm">
                <ChatAvatar
                  name={activeConversation.other_participant.name}
                  subtitle={activeConversation.other_participant.subtitle}
                  avatar={activeConversation.other_participant.avatar}
                  size="lg"
                  isOnline={activePresence?.is_online ?? activeConversation.other_participant.is_online}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-black text-[#132238]">{activeConversation.other_participant.name}</p>
                  <p className="truncate text-xs font-medium text-[#617086]">
                    {activePresence?.is_online ?? activeConversation.other_participant.is_online
                      ? "Online"
                      : formatLastSeen(activePresence?.last_seen ?? activeConversation.other_participant.last_seen)}
                  </p>
                </div>
              </header>

              <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {isLoadingMessages ? (
                  <div className="grid min-h-[280px] place-items-center">
                    <Loader2 className="h-7 w-7 animate-spin text-[#0f766e]" />
                  </div>
                ) : messages.length ? (
                  <div className="space-y-3">
                    {messages.map((message, index) => {
                      const ownMessage = isOwnChatMessage(message, currentUser);
                      const previousMessage = messages[index - 1];
                      const showDate = !previousMessage || formatDay(previousMessage.created_at) !== formatDay(message.created_at);

                      return (
                        <div key={message.message_id}>
                          {showDate ? (
                            <div className="mb-4 flex justify-center">
                              <span className="rounded-full bg-white/90 px-4 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#7b8b8d] shadow-sm">
                                {formatDay(message.created_at)}
                              </span>
                            </div>
                          ) : null}
                          <div className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[85%] rounded-[18px] px-4 py-3 shadow-sm sm:max-w-[72%] ${
                                ownMessage
                                  ? "rounded-br-[6px] bg-[#d9fdd3] text-[#132238]"
                                  : "rounded-bl-[6px] bg-white text-[#132238]"
                              }`}
                            >
                              <p className={`mb-1 text-[11px] font-black uppercase tracking-[0.14em] ${ownMessage ? "text-[#3a6d41]" : "text-[#0f766e]"}`}>
                                {ownMessage ? "You" : message.sender.name}
                              </p>
                              <p className="whitespace-pre-wrap text-[14px] font-medium leading-relaxed">{message.content}</p>
                              <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#6d7a80]">
                                <span>{formatTime(message.created_at)}</span>
                                {ownMessage ? <CheckCheck className="h-3.5 w-3.5 text-[#0f766e]" /> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                ) : (
                  <EmptyState
                    title="Say hello"
                    subtitle="This conversation is empty right now. Send the first message to get things started."
                  />
                )}
              </div>

              <div className="relative z-10 border-t border-[#ddd6ce] bg-[#f7f4ef] px-4 py-4 sm:px-5">
                <div className="flex items-end gap-3 rounded-[24px] bg-white px-3 py-2 shadow-sm ring-1 ring-[#e6ded6]">
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Type a message"
                    className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm font-medium text-[#223248] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isSending || !draft.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0f766e] text-white transition hover:bg-[#0d675f] disabled:cursor-not-allowed disabled:bg-[#9dbab5]"
                  >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-10 grid flex-1 place-items-center p-8">
              <EmptyState
                title="Select a conversation"
                subtitle="Choose a chat from the left to start messaging in real time."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
