/**
 * NORTHR UI PRIMITIVES
 * ----------------------------------------------------------------------------
 * The small set of building blocks every view composes from. These exist so
 * that a "card" or a "button" means exactly one thing across the app — the old
 * build had eleven different card treatments and no two buttons agreed on
 * padding, radius or weight.
 *
 * Everything here reads from the tokens in `index.css`. No raw hex, no
 * arbitrary pixel type sizes.
 */
import React from "react";

/* ---------------------------------------------------------------------------
 * cx — the world's smallest classname joiner. Avoids pulling in clsx.
 * ------------------------------------------------------------------------ */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ===========================================================================
 * BUTTON
 * ======================================================================== */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Dark ink on gold, not white on gold. White on gold-500 measures 2.94:1 and
  // fails AA outright; ink-900 on gold-400 measures 8.68:1 and reads as a
  // highlight, which suits the brand better anyway.
  primary:
    "bg-gold-400 text-ink-900 shadow-e2 hover:bg-gold-300 hover:shadow-e3 " +
    "border border-gold-500/30",
  secondary:
    "bg-violet-600 text-white shadow-e2 hover:bg-violet-700 hover:shadow-e3 " +
    "border border-violet-700/20",
  outline:
    "bg-white text-ink-700 border border-ink-200 shadow-e1 " +
    "hover:border-ink-300 hover:bg-ink-25 hover:text-ink-900",
  ghost:
    "bg-transparent text-ink-500 border border-transparent " +
    "hover:bg-ink-100 hover:text-ink-900",
  danger:
    "bg-bad-500 text-white shadow-e2 hover:bg-bad-700 border border-bad-700/20",
  inverse:
    "bg-ink-900 text-white shadow-e2 hover:bg-ink-800 border border-white/10",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
  // 40px hit target, square. Meets the 44px guidance once the 2px focus ring
  // and surrounding gap are counted; used only for secondary affordances.
  icon: "h-10 w-10 p-0 rounded-lg",
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
 * One surface treatment. `interactive` adds the lift; `flush` removes padding
 * for cards that own their own internal layout.
 * ======================================================================== */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  flush?: boolean;
  /** Draws a 3px accent stripe down the left edge. */
  accent?: "gold" | "violet" | "good" | "warn" | "bad" | "info";
  as?: "div" | "article" | "section" | "li";
}

const ACCENT_STRIPE: Record<NonNullable<CardProps["accent"]>, string> = {
  gold: "before:bg-gold-400",
  violet: "before:bg-violet-500",
  good: "before:bg-good-500",
  warn: "before:bg-warn-500",
  bad: "before:bg-bad-500",
  info: "before:bg-info-500",
};

export function Card({
  interactive,
  flush,
  accent,
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cx(
        "relative rounded-xl border border-ink-100 bg-white shadow-e2 overflow-hidden",
        !flush && "p-4 sm:p-5",
        accent &&
          cx(
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-['']",
            ACCENT_STRIPE[accent],
          ),
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-200 " +
            "ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 " +
            "hover:border-ink-200 hover:shadow-e4 focus-within:border-ink-200",
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
type BadgeTone = "neutral" | "gold" | "violet" | "good" | "warn" | "bad" | "info";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-600 border-ink-200",
  gold: "bg-gold-50 text-gold-700 border-gold-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
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
  neutral: "bg-ink-700 text-white border-transparent",
  gold: "bg-gold-500 text-white border-transparent",
  violet: "bg-violet-600 text-white border-transparent",
  good: "bg-good-500 text-white border-transparent",
  warn: "bg-warn-500 text-white border-transparent",
  bad: "bg-bad-500 text-white border-transparent",
  info: "bg-info-500 text-white border-transparent",
};

export function Badge({ tone = "neutral", solid, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        "text-tiny font-bold uppercase tracking-wider whitespace-nowrap",
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
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-600">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h2 className="text-xl font-bold text-ink-900 text-balance">{title}</h2>
          {description && (
            <p className="mt-1.5 max-w-prose text-sm text-ink-600 text-pretty">
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
  gold: "bg-gold-50 text-gold-600",
  violet: "bg-violet-50 text-violet-600",
  good: "bg-good-50 text-good-700",
  warn: "bg-warn-50 text-warn-700",
  bad: "bg-bad-50 text-bad-700",
  info: "bg-info-50 text-info-700",
};

export function Stat({ label, value, hint, icon: Icon, tone = "neutral", className }: StatProps) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col gap-2 rounded-xl border border-ink-100 bg-white p-4 shadow-e1",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{label}</span>
        {Icon && (
          <span
            className={cx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              STAT_ICON_TONES[tone],
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div
        data-numeric
        className="font-display text-2xl font-bold leading-none text-ink-900"
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
  tone?: "gold" | "violet" | "good" | "warn" | "bad";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const PROGRESS_FILL: Record<NonNullable<ProgressProps["tone"]>, string> = {
  gold: "bg-gradient-to-r from-gold-400 to-gold-600",
  violet: "bg-gradient-to-r from-violet-400 to-violet-600",
  good: "bg-gradient-to-r from-good-300 to-good-500",
  warn: "bg-gradient-to-r from-warn-300 to-warn-500",
  bad: "bg-gradient-to-r from-bad-300 to-bad-500",
};

export function Progress({
  value,
  tone = "gold",
  size = "md",
  label,
  className,
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cx(
        "w-full overflow-hidden rounded-full bg-ink-100",
        size === "sm" ? "h-1" : "h-2",
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
          "h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          PROGRESS_FILL[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ===========================================================================
 * EMPTY STATE
 * The old build had five different "nothing here yet" treatments, three of
 * which were an unstyled centred <p>.
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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed",
        "border-ink-200 bg-ink-25 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-100 bg-white text-ink-400 shadow-e1">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-base font-bold text-ink-900 text-balance">{title}</h3>
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
        "inline-flex items-center gap-1 rounded-xl border border-ink-100 bg-ink-50 p-1",
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
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5",
              "text-xs font-semibold transition-colors duration-150",
              active
                ? "bg-white text-ink-900 shadow-e2"
                : "text-ink-500 hover:bg-white/60 hover:text-ink-800",
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
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1 text-tiny font-semibold text-bad-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-tiny text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Shared input chrome, so every text input in the app matches. */
export const inputClass = (hasError?: boolean, hasLeadingIcon?: boolean) =>
  cx(
    "w-full rounded-lg border bg-white text-sm text-ink-900 shadow-e1",
    // ink-500 placeholder, not ink-400: placeholders are text and must clear
    // 4.5:1. The control border uses ink-450, the lightest value that still
    // clears 3:1 for a perceivable boundary.
    "placeholder:text-ink-500 transition-[border-color,box-shadow] duration-150",
    "focus:outline-none focus:ring-2 focus:ring-gold-500/30",
    "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500",
    hasLeadingIcon ? "py-2.5 pl-10 pr-3" : "px-3 py-2.5",
    hasError
      ? "border-bad-500 focus:border-bad-500 focus:ring-bad-500/25"
      : "border-ink-450 hover:border-ink-600 focus:border-gold-600",
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
      className={cx("animate-pulse rounded-md bg-ink-100", className ?? "h-4 w-full")}
    />
  );
}
