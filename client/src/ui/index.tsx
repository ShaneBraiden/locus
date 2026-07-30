/**
 * NORTHR UI PRIMITIVES — ORGANIC / NATURAL
 * ----------------------------------------------------------------------------
 * The small set of building blocks every view composes from. These exist so
 * that a "card" or a "button" means exactly one thing across the app.
 *
 * Everything here reads from the tokens in `index.css`. No raw hex, no
 * arbitrary pixel type sizes.
 *
 * Three rules carry the organic style through this file:
 *   1. Nothing is a rectangle. Controls are pills; surfaces take generous,
 *      often asymmetric radii.
 *   2. Interaction is physical. Things lift, tilt and settle — `scale-105` on
 *      hover and `scale-95` on press, so a button feels picked up and set
 *      down rather than switched on.
 *   3. Motion is slow enough to read: 300ms on the soft easing curve. The
 *      global reduced-motion rule in index.css turns all of it off for
 *      anyone who asked for stillness.
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
 * let each chart invent its own palette (which is how the old build ended up
 * with slate axes and a violet series on a warm page), they all import from
 * here. These values mirror `index.css` exactly — if a ramp changes there,
 * change it here in the same commit.
 * ------------------------------------------------------------------------ */
export const CHART = {
  /** Primary data series. */
  moss: "#5D7052",
  /** Secondary / comparison series. */
  clay: "#C18C5D",
  /** Third series, when two are not enough. */
  stone: "#457181",
  /** Axis labels and legend text — ink-500, so it clears 4.5:1 on paper. */
  axis: "#6A6A5E",
  /** Gridlines — timber, deliberately faint. */
  grid: "#DED8CF",
  /** Unfilled track behind a gauge or bar. */
  track: "#F0EBE5",
  /** Tooltip and chart surface. */
  surface: "#FEFEFA",
} as const;

/** The shared easing + duration for every physical interaction below. */
const MOTION = "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ===========================================================================
 * BUTTON
 * Pills, always. A pill has no corners to get wrong, and it is the single
 * clearest signal that this system is not a grid of rectangles.
 * ======================================================================== */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap " +
  MOTION +
  // The lift-and-press pair. Origin is centred so the scale reads as the
  // button coming toward you rather than growing sideways.
  " hover:scale-105 active:scale-95 " +
  "disabled:pointer-events-none disabled:opacity-45 disabled:hover:scale-100";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Moss under white measures 5.38:1 — comfortably AA — and the moss-tinted
  // shadow means the button casts light of its own colour, which is the
  // whole trick of this palette.
  primary:
    "bg-moss-500 text-white shadow-soft hover:bg-moss-600 " +
    "hover:shadow-[0_6px_24px_-4px_rgb(93_112_82_/_0.30)]",
  // Clay-600 rather than the true terracotta: 500 is the better colour and
  // fails AA under white text at 4.17:1.
  secondary:
    "bg-clay-600 text-white shadow-soft hover:bg-clay-700 " +
    "hover:shadow-[0_6px_24px_-4px_rgb(193_140_93_/_0.35)]",
  // A 2px clay hairline on nothing. The extra weight is deliberate — at 1px a
  // warm border on warm paper disappears.
  outline:
    "bg-transparent text-clay-700 border-2 border-clay-500 " +
    "hover:bg-clay-50 hover:border-clay-600",
  ghost:
    "bg-transparent text-moss-700 border-2 border-transparent " +
    "hover:bg-moss-500/10",
  danger: "bg-bad-500 text-white shadow-soft hover:bg-bad-700",
  inverse: "bg-ink-900 text-ink-50 shadow-soft hover:bg-ink-800",
};

// Taller than the old build across the board: h-12 is 48px, clearing the 44px
// touch guidance on its own rather than leaning on the focus ring to get
// there. Horizontal padding is generous — a cramped pill reads as a lozenge.
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-xs",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-9 text-base",
  icon: "h-12 w-12 p-0",
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
 * CARD
 * One surface treatment, six silhouettes. `shape` picks which corner opens
 * up; pass the item's index in a grid (`shape={i}`) and the row will never
 * repeat an outline twice running. That variation is what stops a card grid
 * from reading as a spreadsheet.
 * ======================================================================== */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  flush?: boolean;
  /** Draws a soft accent stripe down the left edge. */
  accent?: "moss" | "clay" | "good" | "warn" | "bad" | "info";
  /** 0–5, or any index — cycles the asymmetric radius. Omit for a plain 2rem. */
  shape?: number;
  /** Adds a slow tilt on hover, as if picking up a physical card. */
  tilt?: boolean;
  as?: "div" | "article" | "section" | "li";
}

const ACCENT_STRIPE: Record<NonNullable<CardProps["accent"]>, string> = {
  moss: "before:bg-moss-500",
  clay: "before:bg-clay-500",
  good: "before:bg-good-500",
  warn: "before:bg-warn-500",
  bad: "before:bg-bad-500",
  info: "before:bg-info-500",
};

export function Card({
  interactive,
  flush,
  accent,
  shape,
  tilt,
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  const shapeClass =
    shape === undefined ? "rounded-2xl" : `card-organic-${Math.abs(shape) % 6}`;

  return (
    <Tag
      className={cx(
        // ink-25 rather than pure white: a hair warmer than the page, so the
        // card lifts off the paper by tone as well as by shadow.
        "relative border border-ink-200/60 bg-ink-25 shadow-soft overflow-hidden",
        shapeClass,
        !flush && "p-5 sm:p-6",
        accent &&
          cx(
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] before:content-['']",
            ACCENT_STRIPE[accent],
          ),
        interactive &&
          cx(
            MOTION,
            "hover:-translate-y-1 hover:border-ink-200",
            "hover:shadow-[0_20px_40px_-10px_rgb(93_112_82_/_0.18)]",
            "focus-within:border-ink-200",
            tilt && "hover:rotate-1",
          ),
        className,
      )}
      {...(rest as any)}
    >
      {children}
    </Tag>
  );
}

/* ===========================================================================
 * BADGE
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

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Solid fill instead of the soft tint. */
  solid?: boolean;
}

const BADGE_SOLID: Record<BadgeTone, string> = {
  neutral: "bg-ink-700 text-ink-50 border-transparent",
  moss: "bg-moss-500 text-white border-transparent",
  clay: "bg-clay-600 text-white border-transparent",
  good: "bg-good-500 text-white border-transparent",
  // The one badge that cannot be a 500. Ochre is stuck in a gap: white on
  // warn-500 is 3.45:1 and deep loam on it is only 4.08:1, and no ochre
  // exists that clears 4.5:1 against both. So the solid warn badge drops to
  // warn-300 under ink-900, which measures 8.44:1 and still reads as a filled
  // chip rather than a tint.
  warn: "bg-warn-300 text-ink-900 border-transparent",
  bad: "bg-bad-500 text-white border-transparent",
  info: "bg-info-500 text-white border-transparent",
};

export function Badge({ tone = "neutral", solid, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-tiny font-extrabold uppercase tracking-wider whitespace-nowrap",
        solid ? BADGE_SOLID[tone] : BADGE_TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

/* ===========================================================================
 * SECTION HEADER
 * Replaces the ~30 bespoke heading blocks scattered across the views.
 * ======================================================================== */
export interface SectionHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions. Wraps below the title on narrow screens. */
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss-500/10 text-moss-600">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h2 className="font-display text-xl font-bold text-ink-900 text-balance">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-prose text-sm text-ink-600 text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/* ===========================================================================
 * STAT — the metric tile used across Home, Journey and Experiments.
 * ======================================================================== */
export interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: BadgeTone;
  className?: string;
}

const STAT_ICON_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  moss: "bg-moss-500/10 text-moss-600",
  clay: "bg-clay-500/15 text-clay-700",
  good: "bg-good-50 text-good-700",
  warn: "bg-warn-50 text-warn-700",
  bad: "bg-bad-50 text-bad-700",
  info: "bg-info-50 text-info-700",
};

export function Stat({ label, value, hint, icon: Icon, tone = "neutral", className }: StatProps) {
  return (
    <div
      className={cx(
        "group flex min-w-0 flex-col gap-2.5 rounded-2xl border border-ink-200/60",
        "bg-ink-25 p-5 shadow-soft",
        MOTION,
        "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgb(93_112_82_/_0.18)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{label}</span>
        {Icon && (
          <span
            className={cx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              STAT_ICON_TONES[tone],
              MOTION,
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      {/* origin-left so the number grows into the whitespace on its right
          instead of drifting under the label. */}
      <div
        data-numeric
        className={cx(
          "font-display text-2xl font-bold leading-none text-ink-900 origin-left",
          MOTION,
          "group-hover:scale-110",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-ink-500 truncate">{hint}</div>}
    </div>
  );
}

/* ===========================================================================
 * PROGRESS
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
  moss: "bg-gradient-to-r from-moss-400 to-moss-600",
  clay: "bg-gradient-to-r from-clay-400 to-clay-600",
  good: "bg-gradient-to-r from-good-300 to-good-500",
  warn: "bg-gradient-to-r from-warn-300 to-warn-500",
  bad: "bg-gradient-to-r from-bad-300 to-bad-500",
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
        "w-full overflow-hidden rounded-full bg-ink-100",
        size === "sm" ? "h-1.5" : "h-2.5",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      {/* 700ms, not 500: a bar that fills slowly reads as something growing. */}
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
        "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed",
        "border-ink-200 bg-ink-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        // A blob, not a rounded square. An empty state has the room for the
        // shape language to be obvious, and nothing to distract from it.
        <span className="blob-1 flex h-16 w-16 items-center justify-center bg-moss-500/10 text-moss-600">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="font-display text-lg font-bold text-ink-900 text-balance">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-ink-500 text-pretty">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ===========================================================================
 * SEGMENTED CONTROL — replaces the hand-rolled sub-tab strips.
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
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  scrollable = true,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-ink-200/60 bg-ink-100/70 p-1.5",
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
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2",
              "text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              active
                ? "bg-ink-25 text-ink-900 shadow-soft"
                : "text-ink-500 hover:bg-ink-25/60 hover:text-ink-800",
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
    // px-1 on the label and helper text: the control is a pill, so its text
    // starts inset. Flush-left labels above a pill look detached from it.
    <div className={cx("space-y-2", className)}>
      <label htmlFor={id} className="block px-1 text-xs font-bold text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1 px-1 text-tiny font-bold text-bad-700"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="px-1 text-tiny text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Shared input chrome, so every text input in the app matches.
 *
 * Pills, and semi-transparent white rather than solid — the page grain shows
 * faintly through the field, which is the detail that keeps a form from
 * looking pasted on top of the paper rather than printed into it.
 */
export const inputClass = (hasError?: boolean, hasLeadingIcon?: boolean) =>
  cx(
    "w-full h-12 rounded-full border bg-white/60 text-sm text-ink-900",
    // ink-500 placeholder, not ink-400: placeholders are text and must clear
    // 4.5:1. The control border uses ink-450, the lightest value that still
    // clears 3:1 for a perceivable boundary.
    "placeholder:text-ink-500 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    // A soft ring rather than a hard outline — the focus state should read
    // like light through leaves. 2px and offset keeps it unmissable.
    "focus:outline-none focus:ring-2 focus:ring-moss-500/30 focus:ring-offset-2 focus:ring-offset-ink-50",
    "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500",
    hasLeadingIcon ? "pl-11 pr-5" : "px-5",
    hasError
      ? "border-bad-500 focus:border-bad-500 focus:ring-bad-500/25"
      : "border-ink-450 hover:border-ink-600 focus:border-moss-500",
  );

/* ===========================================================================
 * SPINNER
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
      className={cx("animate-pulse rounded-xl bg-ink-100", className ?? "h-4 w-full")}
    />
  );
}

/* ===========================================================================
 * WASH — the ambient blurred colour blob behind heroes and section headers.
 *
 * This is the most recognisable element of the style, so it lives here rather
 * than being re-hand-rolled per view. It is decorative and absolutely
 * positioned: the parent needs `relative`, and almost always `overflow-hidden`
 * too — on narrow screens the clip is what stops a wash creating scroll.
 * ======================================================================== */
export interface WashProps {
  /** Cycles the blob silhouette. Any integer. */
  shape?: number;
  tone?: "moss" | "clay" | "sand";
  className?: string;
  /** Slow ambient drift. Off by default; at most one per screen. */
  animate?: boolean;
}

const WASH_TONE: Record<NonNullable<WashProps["tone"]>, string> = {
  moss: "bg-moss-300",
  clay: "bg-clay-300",
  sand: "bg-sand-300",
};

export function Wash({ shape = 0, tone = "moss", className, animate }: WashProps) {
  return (
    <div
      aria-hidden
      className={cx(
        "wash",
        `blob-${(Math.abs(shape) % 6) + 1}`,
        WASH_TONE[tone],
        animate && "animate-drift",
        className,
      )}
    />
  );
}
