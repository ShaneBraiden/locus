/**
 * NORTHR UI PRIMITIVES — PRECISION / GRAPHITE
 * ----------------------------------------------------------------------------
 * The small set of building blocks every view composes from. These exist so
 * that a "panel" or a "button" means exactly one thing across the app.
 *
 * Everything here reads from the tokens in `index.css`. No raw hex, no
 * arbitrary pixel type sizes.
 *
 * Four rules carry the current style through this file:
 *
 *   1. STRUCTURE IS DRAWN WITH LINES. A region is defined by a 1px rule and by
 *      whitespace. The card — a floating rounded box with a shadow under it —
 *      is gone. `<Panel>` exists for the cases that genuinely need a frame
 *      (a bounded data region inside a grid), and it is a hairline border with
 *      no elevation. Everything else stacks with `<Section>`.
 *   2. ELEVATION MEANS FLOATING. Only things that actually leave the page get a
 *      shadow: modals, popovers, dropdowns, toasts. Nothing in the document
 *      flow casts one.
 *   3. GEOMETRY IS SHARP. Controls are rectangles with a 3-4px radius. The only
 *      full-round elements left are the ones that are genuinely circular —
 *      avatars, status dots, spinners.
 *   4. INTERACTION IS A STATE CHANGE, NOT A PERFORMANCE. 150ms on colour and
 *      border. Nothing scales, lifts, tilts or settles.
 */
import React from "react";

/* ---------------------------------------------------------------------------
 * cx — the world's smallest classname joiner. Avoids pulling in clsx.
 * ------------------------------------------------------------------------ */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------------------
 * CHART — the one sanctioned place for literal hex in the app.
 *
 * Recharts takes colours as strings, not class names, so charts cannot read
 * the CSS custom properties the way every other component does. Rather than
 * let each chart invent its own palette, they all import from here. These
 * values mirror `index.css` exactly — if a ramp changes there, change it here
 * in the same commit.
 * ------------------------------------------------------------------------ */
export const CHART = {
  /** Primary data series — the accent. */
  moss: "#2563A8",
  /** Secondary / comparison series — bronze. */
  clay: "#A5762F",
  /** Third series, when two are not enough. */
  stone: "#3A6285",
  /** Axis labels and legend text — ink-500, so it clears 4.5:1 on the page. */
  axis: "#5F6772",
  /** Gridlines — the hairline, deliberately faint. */
  grid: "#E1E4E8",
  /** Unfilled track behind a gauge or bar. */
  track: "#EFF1F3",
  /** Tooltip and chart surface. */
  surface: "#FFFFFF",
} as const;

/**
 * The shared transition for every control below. Colour and border only —
 * note the absence of `transition-all`, which is what let the old system
 * animate transforms it should not have been applying in the first place.
 */
const MOTION =
  "transition-[color,background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)]";

/* ===========================================================================
 * BUTTON
 * Rectangles with a 4px radius. The pill is gone: a pill has no corners to
 * align to anything, which is exactly the problem when a button sits at the
 * end of a table row or flush against a field.
 * ======================================================================== */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap " +
  "border " +
  MOTION +
  " disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // The accent under white measures 5.1:1. No shadow — a primary button is
  // identified by its fill, and it does not need to hover off the page to say
  // so.
  primary: "bg-moss-500 text-white border-moss-500 hover:bg-moss-600 hover:border-moss-600",
  // Formerly a second filled colour. A secondary action should not compete on
  // saturation, so it is now a neutral fill: present, clearly a button,
  // clearly not the primary one.
  secondary: "bg-ink-100 text-ink-800 border-ink-200 hover:bg-ink-200 hover:border-ink-300",
  // 1px, not 2px. On a cool ramp a hairline border reads cleanly; the old
  // 2px was compensating for a warm border disappearing into warm paper.
  outline: "bg-white text-ink-800 border-ink-300 hover:bg-ink-50 hover:border-ink-450",
  ghost: "bg-transparent text-ink-600 border-transparent hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-bad-500 text-white border-bad-500 hover:bg-bad-700 hover:border-bad-700",
  inverse: "bg-ink-900 text-white border-ink-900 hover:bg-ink-800 hover:border-ink-800",
};

/**
 * Shorter than the old build across the board — h-12 buttons are a marketing
 * page's proportion, and a dense application reads as amateur at that scale.
 * `md` is 34px, which is the standard for a desktop toolbar. `lg` at 40px is
 * still comfortably thumb-sized for the mobile primary actions, and coarse
 * pointers get their hit area from padding rather than from height.
 */
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-[2.125rem] px-3.5 text-sm",
  lg: "h-10 px-5 text-sm",
  icon: "h-[2.125rem] w-[2.125rem] p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders full-width. */
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", size = "md", block, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        block && "w-full",
        className,
      )}
      {...rest}
    />
  );
});

/* ===========================================================================
 * SECTION — the primary structural unit, and the card's replacement.
 *
 * A section is a titled band of content separated from its neighbours by a
 * single rule. Stack four of them and the page reads as a document with four
 * parts. Stack four cards and it reads as four things that happen to be near
 * each other.
 *
 * The rule is on the TOP edge, and suppressed on the first child, so a column
 * of sections never opens or closes with a stray line.
 * ======================================================================== */
// `title` is omitted from the inherited HTML attributes throughout this file:
// the DOM `title` is a tooltip string, and here it means a rendered heading,
// which may be any node.
export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Drops the top rule — for a section that already sits under one. */
  seamless?: boolean;
  as?: "section" | "div" | "article";
}

export function Section({
  title,
  eyebrow,
  description,
  actions,
  seamless,
  as: Tag = "section",
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag
      className={cx(
        seamless ? "pt-0 mt-0 border-0" : "border-t border-ink-200 pt-6 mt-6 first:border-0 first:pt-0 first:mt-0",
        className,
      )}
      {...(rest as any)}
    >
      {(title || actions || eyebrow) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
            {title && (
              <h2 className="text-lg font-bold text-ink-900 text-balance">{title}</h2>
            )}
            {description && (
              <p className="mt-1 max-w-prose text-sm text-ink-500 text-pretty">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
          )}
        </div>
      )}
      {children}
    </Tag>
  );
}

/* ===========================================================================
 * PANEL — a bounded region, for the cases a rule cannot express.
 *
 * Use this only when content needs a real boundary: a data block inside a
 * grid, a chart with its own axis space, a sidebar module. It is a hairline
 * border and a 6px radius. It does not lift, tint, tilt or glow.
 *
 * `Card` is kept as an alias below because ~200 call sites import it. New code
 * should reach for `Section` first and `Panel` only when a frame is load-
 * bearing.
 * ======================================================================== */
export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Adds hover/focus affordance for panels that are themselves a control. */
  interactive?: boolean;
  /** Removes internal padding — for panels wrapping a table or chart. */
  flush?: boolean;
  /** A 2px status marker on the left edge. The only decoration permitted. */
  accent?: "moss" | "clay" | "good" | "warn" | "bad" | "info";
  /** Sunken fill instead of white, for secondary/inset regions. */
  muted?: boolean;
  /** Panel header strip: title on a sunken band with a rule under it. */
  title?: React.ReactNode;
  actions?: React.ReactNode;
  as?: "div" | "article" | "section" | "li";
  /** @deprecated Silhouette variation from the organic system. Ignored. */
  shape?: number;
  /** @deprecated Hover tilt from the organic system. Ignored. */
  tilt?: boolean;
}

const ACCENT_EDGE: Record<NonNullable<PanelProps["accent"]>, string> = {
  moss: "before:bg-moss-500",
  clay: "before:bg-clay-500",
  good: "before:bg-good-500",
  warn: "before:bg-warn-500",
  bad: "before:bg-bad-500",
  info: "before:bg-info-500",
};

export function Panel({
  interactive,
  flush,
  accent,
  muted,
  title,
  actions,
  as: Tag = "div",
  // Accepted and discarded: the organic silhouette props. Kept in the
  // signature so the existing `shape={i}` / `tilt` call sites keep compiling
  // while the views are migrated.
  shape: _shape,
  tilt: _tilt,
  className,
  children,
  ...rest
}: PanelProps) {
  const hasHeader = Boolean(title || actions);

  return (
    <Tag
      className={cx(
        "relative rounded-lg border border-ink-200",
        muted ? "bg-ink-50" : "bg-white",
        // Padding stays on the element itself (rather than on an inner
        // wrapper) so that the many call sites passing their own layout
        // classes — `flex`, `grid`, `space-y-*` — still apply to the children
        // they were written for.
        !flush && !hasHeader && "p-4 sm:p-5",
        accent &&
          cx(
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:content-['']",
            "before:rounded-l-lg",
            ACCENT_EDGE[accent],
          ),
        interactive && cx(MOTION, "hover:border-ink-400 focus-within:border-moss-500"),
        className,
      )}
      {...(rest as any)}
    >
      {hasHeader ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-2.5">
            {title && (
              <h3 className="min-w-0 truncate text-sm font-bold text-ink-900">{title}</h3>
            )}
            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>
          <div className={cx(!flush && "p-4")}>{children}</div>
        </>
      ) : (
        children
      )}
    </Tag>
  );
}

/**
 * @deprecated Use `Section` for page structure or `Panel` for a bounded
 * region. Retained as an alias so the existing imports across the views
 * resolve; it renders as a flat panel, never as the old floating card.
 */
export const Card = Panel;
export type CardProps = PanelProps;

/* ===========================================================================
 * RULE — an explicit divider, for the places a section boundary is too heavy.
 * ======================================================================== */
export function Rule({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        vertical ? "w-px self-stretch bg-ink-200" : "h-px w-full bg-ink-200",
        className,
      )}
    />
  );
}

/* ===========================================================================
 * ROW — a single line item in a rule-separated list. This is what a grid of
 * small cards becomes. Wrap a stack of them in `divide-rule` (or just let the
 * component draw its own bottom rule) and the result is scannable in a way a
 * card grid is not: every label starts on the same x, every value ends on the
 * same x.
 * ======================================================================== */
export interface RowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Left-hand icon slot. Kept small — 16px, ink-400. */
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  meta?: React.ReactNode;
  /** Right-aligned value, action or badge. */
  trailing?: React.ReactNode;
  interactive?: boolean;
  active?: boolean;
}

export function Row({
  icon: Icon,
  title,
  meta,
  trailing,
  interactive,
  active,
  className,
  children,
  ...rest
}: RowProps) {
  return (
    <div
      className={cx(
        "flex items-start gap-3 px-1 py-3",
        interactive && cx(MOTION, "cursor-pointer hover:bg-ink-50"),
        active && "bg-moss-50",
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        {meta && <div className="mt-0.5 text-xs text-ink-500">{meta}</div>}
        {children}
      </div>
      {trailing && (
        <div className="flex shrink-0 items-center gap-2 text-sm text-ink-700">{trailing}</div>
      )}
    </div>
  );
}

/* ===========================================================================
 * BADGE
 * A 2px-radius chip, not a pill. Lowercase-height, uppercase letterforms, one
 * weight of border.
 * ======================================================================== */
type BadgeTone = "neutral" | "moss" | "clay" | "good" | "warn" | "bad" | "info";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-600 border-ink-200",
  moss: "bg-moss-50 text-moss-700 border-moss-200",
  clay: "bg-clay-50 text-clay-700 border-clay-200",
  good: "bg-good-50 text-good-700 border-good-300/60",
  warn: "bg-warn-50 text-warn-700 border-warn-300/60",
  bad: "bg-bad-50 text-bad-700 border-bad-300/60",
  info: "bg-info-50 text-info-700 border-info-300/60",
};

const BADGE_SOLID: Record<BadgeTone, string> = {
  neutral: "bg-ink-700 text-white border-ink-700",
  moss: "bg-moss-500 text-white border-moss-500",
  clay: "bg-clay-600 text-white border-clay-600",
  good: "bg-good-500 text-white border-good-500",
  // The one badge that cannot be a 500: no amber clears 4.5:1 against both
  // white and ink-900, so the solid warn drops to warn-300 under ink-900,
  // which measures 8.9:1 and still reads as a filled chip rather than a tint.
  warn: "bg-warn-300 text-ink-900 border-warn-300",
  bad: "bg-bad-500 text-white border-bad-500",
  info: "bg-info-500 text-white border-info-500",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Solid fill instead of the soft tint. */
  solid?: boolean;
}

export function Badge({ tone = "neutral", solid, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-xs border px-1.5 py-px",
        "text-micro font-bold uppercase tracking-[0.07em] whitespace-nowrap",
        solid ? BADGE_SOLID[tone] : BADGE_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

/* ===========================================================================
 * SECTION HEADER
 * Replaces the ~30 bespoke heading blocks scattered across the views. Now
 * draws its own bottom rule, so a heading always terminates a boundary rather
 * than floating above unbounded content.
 * ======================================================================== */
export interface SectionHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions. Wraps below the title on narrow screens. */
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Suppresses the bottom rule when the header sits inside a framed panel. */
  bare?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  bare,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
        !bare && "border-b border-ink-200 pb-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          // A 28px square at 4px radius, not a 44px circle. An icon beside a
          // heading is a locator, not a feature.
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink-200 bg-ink-50 text-ink-600">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h2 className="text-xl font-bold text-ink-900 text-balance">{title}</h2>
          {description && (
            <p className="mt-1.5 max-w-prose text-sm text-ink-500 text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
      )}
    </div>
  );
}

/* ===========================================================================
 * STAT — the metric tile.
 *
 * Formerly a shadowed, hover-scaling card with a 36px icon chip. Now a plain
 * cell: label above, figure below, hint under that. In a row of four they are
 * separated by vertical rules rather than by gaps between floating boxes,
 * which is what makes them read as one instrument panel instead of four
 * unrelated widgets. Use `<StatRow>` for that arrangement.
 * ======================================================================== */
export interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: BadgeTone;
  className?: string;
}

const STAT_TONE: Record<BadgeTone, string> = {
  neutral: "text-ink-400",
  moss: "text-moss-500",
  clay: "text-clay-600",
  good: "text-good-500",
  warn: "text-warn-500",
  bad: "text-bad-500",
  info: "text-info-500",
};

export function Stat({ label, value, hint, icon: Icon, tone = "neutral", className }: StatProps) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1 px-4 py-3", className)}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cx("h-3.5 w-3.5 shrink-0", STAT_TONE[tone])} />}
        <span className="eyebrow truncate">{label}</span>
      </div>
      <div
        data-numeric
        className="text-2xl font-bold leading-none tracking-tight text-ink-900"
      >
        {value}
      </div>
      {hint && <div className="truncate text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

/**
 * A framed strip of stats divided by vertical rules. The replacement for a
 * `grid gap-4` of stat cards.
 */
export function StatRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-2 divide-x divide-y divide-ink-200 overflow-hidden rounded-lg",
        "border border-ink-200 bg-white sm:grid-cols-4 sm:divide-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ===========================================================================
 * PROGRESS
 * A 4px square-ended bar. The old one was a fully rounded capsule with a
 * gradient fill; at 6px tall a gradient is invisible and the round cap makes
 * low percentages unreadable, because the cap alone is several percent wide.
 * ======================================================================== */
export interface ProgressProps {
  /** 0–100. Clamped. */
  value: number;
  tone?: "moss" | "clay" | "good" | "warn" | "bad";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const PROGRESS_FILL: Record<NonNullable<ProgressProps["tone"]>, string> = {
  moss: "bg-moss-500",
  clay: "bg-clay-500",
  good: "bg-good-500",
  warn: "bg-warn-500",
  bad: "bg-bad-500",
};

export function Progress({
  value,
  tone = "moss",
  size = "md",
  label,
  className,
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cx(
        "w-full overflow-hidden rounded-xs bg-ink-100",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div
        className={cx(
          "h-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          PROGRESS_FILL[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ===========================================================================
 * EMPTY STATE
 * ======================================================================== */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed",
        "border-ink-300 bg-ink-50 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        // A square at 4px radius. The old blob was the shape language being
        // obvious in the one place it had room to be; there is no shape
        // language to demonstrate now.
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-400">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <h3 className="text-sm font-bold text-ink-900 text-balance">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs text-ink-500 text-pretty">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ===========================================================================
 * SEGMENTED CONTROL / TABS
 * Reworked from a pill strip on a tinted track into an underlined tab bar. The
 * active tab is marked by a 2px accent rule sitting on the container's bottom
 * border — the standard, and the one that costs no elevation and no fill.
 * ======================================================================== */
export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Lets the strip scroll sideways instead of wrapping on narrow screens. */
  scrollable?: boolean;
  ariaLabel?: string;
  /** Boxed variant: a bordered group of buttons, for use inside a toolbar. */
  variant?: "underline" | "boxed";
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  scrollable = true,
  ariaLabel,
  variant = "underline",
}: SegmentedProps<T>) {
  const boxed = variant === "boxed";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex items-stretch",
        boxed
          ? "divide-x divide-ink-200 overflow-hidden rounded-md border border-ink-200 bg-white"
          : "gap-4 border-b border-ink-200",
        scrollable && "max-w-full overflow-x-auto scroll-slim",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold",
              MOTION,
              boxed
                ? cx(
                    "px-3 py-1.5",
                    active
                      ? "bg-moss-50 text-moss-700"
                      : "bg-white text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  )
                : cx(
                    // -1px margin pulls the active underline down onto the
                    // container's own border so the two read as one line.
                    "border-b-2 px-0.5 pb-2 pt-1 -mb-px",
                    active
                      ? "border-moss-500 text-ink-900"
                      : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-900",
                  ),
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ===========================================================================
 * FIELD — label + control + error, used by auth and any form.
 * ======================================================================== */
export interface FieldProps {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Field({ id, label, error, hint, children, className }: FieldProps) {
  return (
    // Flush left, no inset. The control is a rectangle now, so its text starts
    // at the same x as the label above it and the two align on a common edge.
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1 text-tiny font-semibold text-bad-700"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-tiny text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Shared input chrome, so every text input in the app matches.
 *
 * Solid white on a 4px rectangle. The old field was a translucent pill that
 * let the page grain show through — a nice detail, and one that made every
 * form look like it was printed on the page rather than something you could
 * type into.
 */
export const inputClass = (hasError?: boolean, hasLeadingIcon?: boolean) =>
  cx(
    "w-full h-[2.125rem] rounded-md border bg-white text-sm text-ink-900",
    // ink-500 placeholder, not ink-400: placeholders are text and must clear
    // 4.5:1. The border uses ink-300 at rest, which clears 3:1 for a
    // perceivable boundary (WCAG 1.4.11).
    "placeholder:text-ink-400",
    "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
    // A 1px inset ring in the accent, not a diffuse halo — the border simply
    // gets heavier and changes colour.
    "focus:outline-none focus:ring-1",
    "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500",
    hasLeadingIcon ? "pl-9 pr-3" : "px-3",
    hasError
      ? "border-bad-500 focus:border-bad-500 focus:ring-bad-500"
      : "border-ink-300 hover:border-ink-450 focus:border-moss-500 focus:ring-moss-500",
  );

/* ===========================================================================
 * SPINNER — one of the three things still allowed to be a circle.
 * ======================================================================== */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className ?? "h-4 w-4",
      )}
    />
  );
}

/* ===========================================================================
 * SKELETON — for loading states that used to just pop in.
 * ======================================================================== */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("animate-pulse rounded-xs bg-ink-100", className ?? "h-3.5 w-full")}
    />
  );
}

/* ===========================================================================
 * WASH — retired.
 *
 * The ambient blurred colour blob behind heroes and section headers was the
 * most recognisable element of the previous style, and it is exactly the kind
 * of decoration this system removed: it carried no information and it sat
 * behind content it did not describe.
 *
 * The component is kept as a no-op (its `.wash` class is `display: none` in
 * index.css) so the existing call sites compile and render nothing, rather
 * than requiring a coordinated edit across every view in the same commit.
 * ======================================================================== */
export interface WashProps {
  shape?: number;
  tone?: "moss" | "clay" | "sand";
  className?: string;
  animate?: boolean;
}

/** @deprecated Renders nothing. Delete call sites as views are touched. */
export function Wash(_props: WashProps) {
  return null;
}
