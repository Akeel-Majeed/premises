import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/utils";
import { useToasts } from "../state/store";

/* ---------- icons (minimal inline set) ---------- */

export function Icon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    heart: <path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.4 5 6 5c2.2 0 3.6 1.2 6 3.7C14.4 6.2 15.8 5 18 5c3.6 0 5.6 3.6 4 6.7C19.5 16.3 12 21 12 21Z" />,
    star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" />,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
    check: <path d="M4 12.5 9.5 18 20 6" fill="none" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    x: <path d="M5 5l14 14M19 5 5 19" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
    plus: <path d="M12 4v16M4 12h16" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
    minus: <path d="M4 12h16" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
    chevL: <path d="M15 4 7 12l8 8" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    chevR: <path d="M9 4l8 8-8 8" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    chevD: <path d="M4 9l8 8 8-8" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" fill="none" strokeWidth="2" stroke="currentColor" /><path d="m16 16 5 5" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    pin: <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />,
    msg: <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z" />,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2" fill="none" strokeWidth="2" stroke="currentColor" /><path d="M3 10h18M8 3v4M16 3v4" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    grid: <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
    shield: <path d="M12 2 4 5.5V11c0 5 3.2 8.9 8 11 4.8-2.1 8-6 8-11V5.5L12 2Z" />,
    verify: <><path d="M12 2 4 5.5V11c0 5 3.2 8.9 8 11 4.8-2.1 8-6 8-11V5.5L12 2Z" /><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" strokeWidth="2" stroke="var(--color-bone)" strokeLinecap="round" strokeLinejoin="round" /></>,
    home: <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z" />,
    user: <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5H4Z" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
    filter: <path d="M4 6h16M7 12h10m-7 6h4" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
    compare: <path d="M9 3v18M4 7l5-4 5 4M15 21V3m5 14-5 4-5-4" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    share: <path d="M12 3v12m0-12L8 7m4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    sqft: <path d="M4 4h16v16H4V4Zm0 5h5V4m11 11h-5v5" fill="none" strokeWidth="1.8" stroke="currentColor" />,
    dock: <path d="M3 20h18M5 20V8h6v12m2-12h6v12M8 11h0m9 0h0" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" />,
    play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
    tour: <><circle cx="12" cy="12" r="9" fill="none" strokeWidth="1.8" stroke="currentColor" /><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" strokeWidth="1.8" stroke="currentColor" /></>,
    clock: <><circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" stroke="currentColor" /><path d="M12 7v5l3.5 2.5" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    info: <><circle cx="12" cy="12" r="9" fill="none" strokeWidth="1.8" stroke="currentColor" /><path d="M12 11v5m0-8.5v.5" strokeWidth="2" stroke="currentColor" strokeLinecap="round" /></>,
    trash: <path d="M5 7h14M10 7V5h4v2m-7 0 1 13h8l1-13" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
    edit: <path d="m5 16-1 4 4-1L20 7l-3-3L5 16Z" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinejoin="round" />,
    bell: <path d="M6 16v-6a6 6 0 1 1 12 0v6l2 3H4l2-3Zm4 5h4a2 2 0 0 1-4 0Z" />,
    photo: <><rect x="3" y="5" width="18" height="14" rx="2" fill="none" strokeWidth="1.8" stroke="currentColor" /><circle cx="9" cy="10" r="1.6" /><path d="m5 18 5-5 3 3 3-2 3 3" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinejoin="round" /></>,
    map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinejoin="round" />,
    list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5m-.5 6h.5m-.5 6h.5" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* ---------- buttons ---------- */

export function Button({
  children, variant = "primary", className = "", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "brass" }) {
  const styles = {
    primary: "bg-vault text-bone hover:bg-vault-2",
    brass: "bg-brass text-ink hover:bg-brass-2 hover:text-bone",
    secondary: "border border-ink/25 text-ink hover:border-ink hover:bg-ink/5",
    ghost: "text-ink-2 hover:text-ink hover:bg-ink/5",
    danger: "bg-terra text-bone hover:bg-terra/90",
  } as const;
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- modal ---------- */

export function Modal({
  open, onClose, title, children, wide = false,
}: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, input, textarea, select, a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-ink/55 backdrop-blur-[2px] cursor-default" onClick={onClose} aria-label="Close dialog" />
      <div
        ref={ref}
        className={cx(
          "relative bg-bone rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto reveal",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 bg-bone/95 backdrop-blur z-10 flex items-center justify-between px-6 py-4 border-b hairline">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-full hover:bg-ink/5 cursor-pointer">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- toasts ---------- */

export function ToastHost() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[90] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-auto" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in flex items-center gap-4 bg-ink text-bone rounded-xl px-4 py-3 text-sm shadow-xl sm:min-w-72">
          <span className="flex-1">{t.msg}</span>
          {t.actionLabel && (
            <button
              className="text-brass font-semibold hover:underline cursor-pointer"
              onClick={() => { t.onAction?.(); dismiss(t.id); }}
            >
              {t.actionLabel}
            </button>
          )}
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100 cursor-pointer">
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- ratings ---------- */

export function Stars({ value, size = "w-3.5 h-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-brass" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" className={cx(size, i > Math.round(value) && "opacity-25")} />
      ))}
    </span>
  );
}

export function RatingInline({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Icon name="star" className="w-3.5 h-3.5 text-brass" />
      <span className="font-mono font-medium">{rating.toFixed(2)}</span>
      {count != null && <span className="text-ink-3">({count})</span>}
    </span>
  );
}

/* ---------- badges / chips ---------- */

export function Badge({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "vault" | "brass" | "terra" | "outline" }) {
  const tones = {
    ink: "bg-ink text-bone",
    vault: "bg-vault text-bone",
    brass: "bg-brass/15 text-brass-2 border border-brass/40",
    terra: "border border-terra/50 text-terra",
    outline: "border border-ink/20 text-ink-2",
  } as const;
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: "Confirmed", cls: "bg-vault/10 text-vault border-vault/30" },
    pending: { label: "Pending", cls: "bg-brass/10 text-brass-2 border-brass/40" },
    declined: { label: "Declined", cls: "text-terra border-terra/40" },
    cancelled: { label: "Cancelled", cls: "text-terra border-terra/40" },
    completed: { label: "Completed", cls: "text-ink-3 border-ink/20" },
    active: { label: "Active", cls: "bg-vault/10 text-vault border-vault/30" },
    snoozed: { label: "Snoozed", cls: "bg-brass/10 text-brass-2 border-brass/40" },
    draft: { label: "Draft", cls: "text-ink-3 border-ink/20" },
    inquiry: { label: "Inquiry", cls: "text-ink-3 border-ink/20" },
    request: { label: "Request", cls: "bg-brass/10 text-brass-2 border-brass/40" },
    booked: { label: "Booked", cls: "bg-vault/10 text-vault border-vault/30" },
  };
  const m = map[status] ?? { label: status, cls: "border-ink/20 text-ink-2" };
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", m.cls)}>{m.label}</span>;
}

/* ---------- empty state ---------- */

export function EmptyState({
  icon = "search", title, body, action,
}: { icon?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-ink/20 flex items-center justify-center text-ink-3 mb-5">
        <Icon name={icon} className="w-7 h-7" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-ink-2 text-sm max-w-sm mb-6">{body}</p>
      {action}
    </div>
  );
}

/* ---------- skeletons ---------- */

export function CardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skel aspect-[4/3] rounded-xl mb-3" />
      <div className="skel h-4 w-3/4 mb-2" />
      <div className="skel h-3 w-1/2 mb-2" />
      <div className="skel h-4 w-1/3" />
    </div>
  );
}

export function SkeletonGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-8" role="status" aria-label="Loading results">
      {Array.from({ length: n }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

/* ---------- tabs ---------- */

export function Tabs({
  tabs, active, onChange,
}: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b hairline overflow-x-auto rail">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer",
            active === t.key ? "border-vault text-vault" : "border-transparent text-ink-3 hover:text-ink",
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 font-mono text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- accordion ---------- */

export function Accordion({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b hairline">
      <button
        className="flex w-full items-center justify-between py-4 text-left font-semibold text-sm cursor-pointer hover:text-vault"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <Icon name="chevD" className={cx("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-4 text-sm text-ink-2 leading-relaxed">{children}</div>}
    </div>
  );
}

/* ---------- form field ---------- */

export function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-3 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-terra mt-1" role="alert">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-ink/20 bg-white px-3.5 py-2.5 text-sm placeholder:text-ink-3 focus:border-vault focus:outline-none focus:ring-2 focus:ring-vault/20";

/* ---------- stepper buttons ---------- */

export function NumStepper({ value, onChange, min = 1, max = 99, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button
        className="w-8 h-8 rounded-full border border-ink/25 flex items-center justify-center hover:border-ink disabled:opacity-30 cursor-pointer"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        <Icon name="minus" className="w-3.5 h-3.5" />
      </button>
      <span className="font-mono font-medium w-8 text-center" aria-live="polite">{value}</span>
      <button
        className="w-8 h-8 rounded-full border border-ink/25 flex items-center justify-center hover:border-ink disabled:opacity-30 cursor-pointer"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Icon name="plus" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ---------- mock charts ---------- */

export function Sparkline({ data, className = "text-vault" }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${36 - (v / max) * 32}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" className={cx("w-full h-12", className)} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,40 ${pts} 100,40`} fill="currentColor" opacity="0.08" />
    </svg>
  );
}

export function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-36" role="img" aria-label={`Bar chart: ${labels.map((l, i) => `${l} ${data[i]}`).join(", ")}`}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-[10px] font-mono text-ink-3 opacity-0 group-hover:opacity-100 transition-opacity">£{v.toLocaleString()}</span>
          <div className="w-full bg-vault rounded-t-sm transition-colors group-hover:bg-brass" style={{ height: `${(v / max) * 100}px` }} />
          <span className="text-[10px] text-ink-3 font-mono">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90" aria-hidden="true">
        {segments.map((s, i) => {
          const frac = s.value / total;
          const el = (
            <circle
              key={i} cx="21" cy="21" r="15.9" fill="none" stroke={s.color} strokeWidth="6"
              strokeDasharray={`${frac * 100} ${100 - frac * 100}`} strokeDashoffset={-acc * 100}
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <ul className="text-xs space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-2">{s.label}</span>
            <span className="font-mono ml-auto pl-3">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- misc ---------- */

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-3">
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {it.to ? <a href={it.to} className="hover:text-ink hover:underline">{it.label}</a> : <span className="text-ink-2">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-semibold">{children}</h2>
      {sub && <p className="text-sm text-ink-2 mt-1">{sub}</p>}
    </div>
  );
}
