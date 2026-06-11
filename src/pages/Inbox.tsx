import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, EmptyState, Icon, StatusPill, inputCls } from "../components/ui";
import { cx, fmtMoney, fmtRange } from "../lib/utils";
import { BOOKINGS, THREADS } from "../mocks/data";
import type { Thread, ThreadMessage } from "../mocks/types";
import { findListing, useApp, useToasts } from "../state/store";

function useThreads(): Thread[] {
  const { myMessages, published } = useApp();
  return useMemo(() => {
    const seeded = THREADS.map((t) => ({
      ...t,
      messages: [...t.messages, ...(myMessages[t.id] ?? [])],
    }));
    // ad-hoc threads created from "Message host" on listings
    const extra = Object.keys(myMessages)
      .filter((tid) => tid.startsWith("t-new-") && !seeded.some((s) => s.id === tid))
      .map((tid) => {
        const listingId = tid.replace("t-new-", "");
        return {
          id: tid,
          listingId,
          otherName: "Host",
          otherAvatar: "https://i.pravatar.cc/150?img=12",
          status: "inquiry" as const,
          messages: myMessages[tid] ?? [],
        } satisfies Thread;
      });
    return [...extra, ...seeded];
  }, [myMessages, published]);
}

const QUICK_REPLIES = [
  "Yes, those dates are available.",
  "Happy to arrange a viewing — what day suits?",
  "Could you tell me more about your intended use?",
];

export default function Inbox() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { session, openAuth, appendMessage, decisions, decide, published } = useApp();
  const push = useToasts((s) => s.push);
  const threads = useThreads();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = threads.find((t) => t.id === threadId) ?? null;
  const isHost = session?.mode === "host";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  if (!session) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="msg" title="Sign in to see messages" body="Conversations with hosts and renters live here."
          action={<Button onClick={openAuth}>Sign in</Button>} />
      </main>
    );
  }

  const filtered = threads.filter((t) => (filter === "all" ? true : t.status === filter));

  const send = (text: string) => {
    if (!active || !text.trim()) return;
    appendMessage(active.id, { from: "me", text: text.trim(), at: new Date().toISOString() });
    setDraft("");
    setTimeout(() => {
      useApp.getState().appendMessage(active.id, {
        from: "them",
        text: isHost
          ? "Thanks — that works for us. Looking forward to it!"
          : "Thanks for the message! Yes, that should be fine — let me check the calendar and confirm shortly.",
        at: new Date().toISOString(),
      });
    }, 2500);
  };

  // pending request context for host view
  const pendingRequest = active
    ? BOOKINGS.find((b) => b.listingId === active.listingId && b.status === "pending" && !decisions[b.id])
    : undefined;
  const listing = active ? findListing(active.listingId, published) : undefined;

  return (
    <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display text-3xl font-semibold mb-5">Inbox</h1>
      <div className="grid lg:grid-cols-[360px_1fr] border hairline rounded-2xl overflow-hidden bg-white min-h-[60vh]">
        {/* thread list */}
        <div className={cx("border-r hairline flex flex-col", active && "hidden lg:flex")}>
          <div className="flex gap-1.5 p-3 border-b hairline overflow-x-auto rail">
            {[["all", "All"], ["inquiry", "Inquiries"], ["request", "Requests"], ["booked", "Booked"]].map(([v, label]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={cx("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer", filter === v ? "bg-ink text-bone" : "text-ink-2 hover:bg-ink/5")}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-ink-3 p-6 text-center">No conversations here yet.</p>}
            {filtered.map((t) => {
              const l = findListing(t.listingId, published);
              const last = t.messages[t.messages.length - 1];
              return (
                <button key={t.id} onClick={() => navigate(`/inbox/${t.id}`)}
                  className={cx("w-full flex gap-3 p-4 text-left border-b hairline hover:bg-bone-2 cursor-pointer", active?.id === t.id && "bg-bone-2")}>
                  <img src={t.otherAvatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{t.otherName}</span>
                      <StatusPill status={t.status} />
                    </span>
                    <span className="block text-xs text-ink-3 truncate mt-0.5">{l?.title}</span>
                    <span className="block text-xs text-ink-2 truncate mt-1">{last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "…"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* thread view */}
        <div className={cx("flex flex-col", !active && "hidden lg:flex")}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon="msg" title="Pick a conversation" body="Select a thread on the left to read and reply." />
            </div>
          ) : (
            <>
              <button className="lg:hidden flex items-center gap-1.5 text-sm font-semibold p-3 border-b hairline cursor-pointer" onClick={() => navigate("/inbox")}>
                <Icon name="chevL" className="w-4 h-4" /> All conversations
              </button>

              {/* context card */}
              {listing && (
                <div className="border-b hairline p-4 flex gap-3.5 items-center bg-bone">
                  <img src={listing.photos[0]} alt="" className="w-16 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/space/${listing.id}`} className="font-display font-semibold text-sm hover:underline truncate block">{listing.title}</Link>
                    {pendingRequest ? (
                      <p className="text-xs text-ink-2 mt-0.5">
                        {pendingRequest.renterName} · {fmtRange(pendingRequest.start, pendingRequest.end)} · payout {fmtMoney(pendingRequest.breakdown.base - Math.round(pendingRequest.breakdown.base * 0.03))}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-3 mt-0.5">{listing.neighborhood}, {listing.city}</p>
                    )}
                  </div>
                  {isHost && pendingRequest && (
                    <div className="flex gap-2 shrink-0">
                      <Button className="!px-3 !py-1.5 text-xs" onClick={() => { decide(pendingRequest.id, "confirmed"); push("Request approved — renter notified"); }}>Approve</Button>
                      <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => { decide(pendingRequest.id, "declined"); push("Request declined"); }}>Decline</Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 space-y-4" aria-live="polite">
                {active.messages.map((m: ThreadMessage, i) => (
                  <div key={i} className={cx("max-w-[78%]", m.from === "me" ? "ml-auto" : "")}>
                    <p className={cx("rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.from === "me" ? "bg-vault text-bone rounded-br-md" : "bg-bone-2 rounded-bl-md")}>
                      {m.text}
                    </p>
                    <p className={cx("text-[10px] text-ink-3 mt-1 font-mono", m.from === "me" && "text-right")}>
                      {new Date(m.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {isHost && (
                <div className="flex gap-2 px-4 pb-2 overflow-x-auto rail">
                  {QUICK_REPLIES.map((q) => (
                    <button key={q} onClick={() => send(q)} className="shrink-0 border border-ink/20 rounded-full px-3 py-1.5 text-xs hover:border-vault hover:text-vault cursor-pointer">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form className="flex gap-2 p-4 border-t hairline" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" className={inputCls} aria-label="Message" />
                <Button type="submit" disabled={!draft.trim()}>Send</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
