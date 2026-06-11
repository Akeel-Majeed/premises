import { useState } from "react";
import { addDays, cx, diffDays, todayIso } from "../lib/utils";
import { Icon } from "./ui";
import { useToasts } from "../state/store";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function monthDays(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = (first.getUTCDay() + 6) % 7; // Monday-first
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= count; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

interface RangeCalendarProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  blocked: Set<string>;
  booked: Set<string>;
  months?: number;
  minDays?: number;
}

/** Range-select availability calendar with keyboard-accessible day buttons. */
export function RangeCalendar({ start, end, onChange, blocked, booked, months = 2, minDays = 1 }: RangeCalendarProps) {
  const today = todayIso();
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const push = useToasts((s) => s.push);

  const unavailable = (d: string) => d < today || blocked.has(d) || booked.has(d);

  const clickDay = (d: string) => {
    if (unavailable(d)) return;
    if (!start || (start && end)) {
      onChange(d, "");
      return;
    }
    if (d <= start) {
      onChange(d, "");
      return;
    }
    // validate no unavailable day inside range
    let cur = start;
    while (cur <= d) {
      if (unavailable(cur) && cur !== start) {
        push("That range includes unavailable dates — pick a clear window");
        onChange(d, "");
        return;
      }
      cur = addDays(cur, 1);
    }
    if (minDays > 1 && diffDays(start, d) < minDays) {
      push(`This space has a ${minDays}-day minimum`);
      return;
    }
    onChange(start, d);
  };

  const inRange = (d: string) => start && end && d >= start && d <= end;

  return (
    <div>
      <div className="relative">
        {/* chevrons sit inline with the month titles, flanking the header row */}
        <button
          onClick={() => setOffset(Math.max(0, offset - 1))}
          disabled={offset === 0}
          aria-label="Previous month"
          className="absolute left-0 -top-2 z-10 p-2 rounded-full hover:bg-ink/5 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon name="chevL" className="w-4 h-4" />
        </button>
        <button
          onClick={() => setOffset(offset + 1)}
          aria-label="Next month"
          className="absolute right-0 -top-2 z-10 p-2 rounded-full hover:bg-ink/5 cursor-pointer"
        >
          <Icon name="chevR" className="w-4 h-4" />
        </button>
        <div className={cx("grid gap-8", months === 2 && "lg:grid-cols-2")}>
        {Array.from({ length: months }, (_, m) => {
          const d = new Date(now.getFullYear(), now.getMonth() + offset + m, 1);
          const cells = monthDays(d.getFullYear(), d.getMonth());
          return (
            <div key={m}>
              <p className="font-display font-semibold text-sm text-center mb-3">{monthLabel(d.getFullYear(), d.getMonth())}</p>
              <div className="grid grid-cols-7 text-center text-[11px] text-ink-3 font-mono mb-1">
                {DOW.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="grid grid-cols-7" role="grid" aria-label={monthLabel(d.getFullYear(), d.getMonth())}>
                {cells.map((day, i) =>
                  day === null ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={day}
                      onClick={() => clickDay(day)}
                      disabled={unavailable(day)}
                      aria-label={day + (booked.has(day) ? " (booked)" : blocked.has(day) ? " (unavailable)" : "")}
                      aria-pressed={day === start || day === end}
                      className={cx(
                        "aspect-square text-xs font-mono flex items-center justify-center rounded-full m-0.5 transition-colors",
                        unavailable(day)
                          ? "text-ink-3/50 line-through cursor-not-allowed"
                          : "hover:bg-vault/10 cursor-pointer",
                        inRange(day) && day !== start && day !== end && "bg-vault/15 rounded-none",
                        (day === start || day === end) && "bg-vault text-bone cell-fill",
                      )}
                    >
                      {Number(day.slice(8))}
                    </button>
                  ),
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-vault inline-block" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-vault/15 inline-block" /> In range</span>
        <span className="line-through">Unavailable</span>
        {start && (
          <button className="ml-auto underline hover:text-ink cursor-pointer" onClick={() => onChange("", "")}>
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
