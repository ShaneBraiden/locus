/**
 * NORTHR UI PRIMITIVES — PRECISION / GRAPHITE
 * ----------------------------------------------------------------------------
 * The small set of building blocks every view composes from. These exist so
 * that a "panel" or a "button" means exactly one thing across the app.
 *
 * Everything here reads from the tokens in `index.css`. No raw hex, no
 * arbitrary pixel type sizes.
 *
 * Five rules carry the current style through this file:
 *
 *   1. NOTHING HAS A CORNER. Every control the user can operate is a capsule —
 *      buttons, badges, inputs, tabs, avatars, progress tracks. Every surface
 *      is 16px or rounder, and the two that float free in the sky (the nav and
 *      the content canvas) are rounder still. The page behind all of it is a
 *      photograph of cloud, and a 90° corner is the one shape that does not
 *      occur anywhere in it.
 *   2. THE CAPSULE IS FOR CONTROLS, THE RADIUS IS FOR SURFACES. This is the
 *      distinction that keeps the app from turning into a bag of lozenges. If
 *      you click it, it is a pill. If you read inside it, it has a radius
 *      proportional to its size. A panel is never a capsule and a button is
 *      never a rounded rectangle.
 *   3. ELEVATION MEANS FLOATING. Shadows are shallow and wide — the shadow of
 *      something resting a few millimetres off the page. The one deep shadow
 *      in the system belongs to the canvas, which is genuinely held up in
 *      front of the sky.
 *   4. PADDING IS THE MINIMUM THAT KEEPS CONTENT OFF AN EDGE — plus whatever
 *      the curve costs. That last part is new and it is the one place this
 *      system spends space: a 20px radius eats into the top-left of a panel's
 *      content box, so panels carry 14px rather than 12px. No component's
 *      padding scales at a breakpoint — a wider screen should show more
 *      content, not more margin.
 *   5. INTERACTION IS A STATE CHANGE, NOT A PERFORMANCE. 150ms on colour and
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
 * IconType — the shape every icon slot in this file accepts.
 *
 * Lucide components take `strokeWidth` as well as `className`, and the flat
 * system sets it explicitly: the library default of 2 reads heavy and slightly
 * hand-drawn beside Inter at 13px. 1.75 is the weight that matches the type
 * without thinning into invisibility at 14px.
 *
 * Declared here rather than importing lucide's own type so the primitives stay
 * independent of the icon library.
 * ------------------------------------------------------------------------ */
export type IconType = React.ComponentType<{
  className?: string;
  strokeWidth?: number | string;
}>;

/** The one stroke weight for icons rendered by these primitives. */
export const ICON_STROKE = 1.75;

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
  /**
   * Secondary / comparison series — the maroon. Repointed from bronze, which
   * shared a warm-neutral cast with the accent and lost against it at
   * stroke width. The maroon differs in both hue and lightness, so the two
   * series separate under a colour-vision deficiency and in greyscale print.
   */
  clay: "#99534F",
  /** Third series, when two are not enough. */
  stone: "#3A6285",
  /** Axis labels and legend text — ink-500, so it clears 4.5:1 on the page. */
  axis: "#5D6672",
  /** Gridlines — the hairline, deliberately faint. */
  grid: "#DCE3EA",
  /** Unfilled track behind a gauge or bar. */
  track: "#E8EEF4",
  /**
   * Tooltip and chart surface. Stays fully opaque: a tooltip floats over the
   * data it describes, and the atmospheric surface treatment applies only to
   * things sitting in the document flow.
   */
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
 * A capsule. The previous revision of this file argued the pill out of the
 * system on the grounds that it has no corners to align to anything, which is
 * a problem at the end of a table row or flush against a field.
 *
 * That was true when the field and the table were square. Neither is any more,
 * so there is nothing left for a corner to align to — a 4px radius beside a
 * 20px panel edge inside a 40px canvas reads as an unfinished control, not as
 * a precise one. The alignment the argument was protecting is still protected,
 * because it was never done with corners: buttons line up on their baseline
 * and their outer edge, both of which a capsule has.
 * ======================================================================== */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "inverse";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap " +
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
 * Heights are unchanged — h-12 buttons are a marketing page's proportion and a
 * dense application reads as amateur at that scale. `md` is 34px, the standard
 * for a desktop toolbar; `lg` at 40px stays comfortably thumb-sized for the
 * mobile primary actions.
 *
 * The horizontal padding is up by roughly a step at every size, and that is a
 * consequence of the capsule rather than a change of taste. A pill's usable
 * width is its box minus its two end caps, so at `md` the 17px radius on each
 * side eats most of what 14px of padding was buying and the label ends up
 * sitting in the curve. The extra step buys it back.
 *
 * `icon` stays square in its box and round in its shape — a circle, which is
 * what a 34px capsule is.
 */
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-[2.125rem] px-4 text-sm",
  lg: "h-10 px-6 text-sm",
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
        seamless ? "pt-0 mt-0 border-0" : "border-t border-ink-200 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0",
        className,
      )}
      {...(rest as any)}
    >
      {(title || actions || eyebrow) && (
        <div className="mb-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
            {title && (
              <h2 className="text-lg font-bold text-ink-900 text-balance">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 max-w-prose text-sm text-ink-500 text-pretty">{description}</p>
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
 * grid, a chart with its own axis space, a sidebar module. It is a 20px radius
 * with no border at all — the light along its top edge and the shadow under it
 * are what find the boundary. It does not lift, tint, tilt or glow.
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
  /**
   * Atmospheric tint. This is a semantic choice, not a colour one:
   *
   *   "warm"  — RETROSPECTIVE. The panel describes something the user has
   *             already done: experience logged, a step completed, a
   *             credential held, history.
   *   "cool"  — PROSPECTIVE. The panel holds a recommendation, a projected
   *             path, a suggested next action.
   *   "flat"  — opts out of the translucent surface entirely. Use when a
   *             panel is nested inside another panel, where two translucent
   *             layers would double their tint.
   *
   * Left undefined, a panel is the neutral reading surface. Most are, and
   * should stay that way — the tints only read as meaningful while they are
   * rare.
   */
  tone?: "warm" | "cool" | "flat";
  /**
   * Puts a cloud layer inside the panel.
   *
   *   "soft"  — the drawn variant. No detail to notice. This is the one to
   *             reach for on an ordinary card.
   *   "card"  — photographic, cut from the same sky as the page field. For
   *             surfaces large enough to carry the detail without it
   *             competing: a hero block, a summary panel, an empty state.
   *
   * Off by default, and it should stay off for most panels. A cloud in every
   * card is wallpaper; a cloud in one card on a screen is weather.
   *
   * Never set this on a panel wrapping a table or a chart — the layer sits
   * behind the content at a contrast the generator solved for body text, not
   * for a 1px gridline.
   */
  cloud?: "soft" | "card";
  /** Restores a hairline boundary where the light does not draw one. */
  ruled?: boolean;
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

const PANEL_TONE: Record<NonNullable<PanelProps["tone"]>, string> = {
  warm: "surface-card--warm",
  cool: "surface-card--cool",
  flat: "surface-flat surface-ruled",
};

const PANEL_CLOUD: Record<NonNullable<PanelProps["cloud"]>, string> = {
  soft: "has-cloud",
  card: "has-cloud has-cloud--card",
};

export function Panel({
  interactive,
  flush,
  accent,
  muted,
  tone,
  cloud,
  ruled,
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
        "relative rounded-lg",
        // The surface comes from the glass layer in index.css rather than from
        // `bg-white` + `border`, so a panel sits *in* the field instead of on
        // top of it. There is no border by default: the tint, the lit top edge
        // and the shadow are what find the panel's boundary, and outlining it
        // as well is what makes glass read as a sticker. `ruled` puts the
        // hairline back where an edge is structural.
        //
        // `surface-card` always applies — the tone modifiers only override the
        // fill, and dropping the base class would take the blur, the lit edge
        // and the shadow with it.
        "surface-card",
        tone && PANEL_TONE[tone],
        muted && !tone && "surface-card--muted",
        ruled && "surface-ruled",
        cloud && PANEL_CLOUD[cloud],
        // Padding stays on the element itself (rather than on an inner
        // wrapper) so that the many call sites passing their own layout
        // classes — `flex`, `grid`, `space-y-*` — still apply to the children
        // they were written for.
        //
        // 14px, flat, and it does not grow at the `sm` breakpoint. A panel's
        // padding exists to keep content off the edge; scaling it with the
        // viewport just meant wider screens got more air, not more content.
        //
        // It was 12px under the old ramp and the extra 2px is the radius'
        // doing rather than a change of mind — at a 20px corner the diagonal
        // clearance from the content box to the curve is about 6px less than
        // the nominal padding, so 12px put the first character of a heading
        // visibly inside the arc.
        !flush && !hasHeader && "p-3.5",
        // The accent marker. It used to be a 2px bar running the full height of
        // a square panel, flush to the edge. That does not survive a 12px
        // radius — a full-height bar either clips into the corner curve or
        // pokes out of it. So it is now a rounded 3px capsule, inset from the
        // top and bottom, which reads as a deliberate marker at any radius.
        accent &&
          cx(
            "before:absolute before:left-1 before:top-2.5 before:bottom-2.5 before:w-[3px]",
            "before:rounded-full before:content-['']",
            ACCENT_EDGE[accent],
          ),
        accent && !flush && "pl-4",
        // Interactive panels lift rather than darken their border, since there
        // is no border to darken any more.
        interactive &&
          cx(MOTION, "hover:shadow-e2 focus-within:shadow-glow-moss"),
        className,
      )}
      {...(rest as any)}
    >
      {hasHeader ? (
        <>
          {/* The header strip is inset rather than full-bleed. A band that runs
              to the panel's edge has to be clipped by the panel's radius to
              look right, which means `overflow: hidden` on the panel — and
              that would clip the accent capsule and any popover a header
              action opens. Insetting it costs 4px and clips nothing. */}
          <div className="mx-1.5 mt-1 flex items-center justify-between gap-2 border-b border-ink-200 px-2 py-2">
            {title && (
              <h3 className="min-w-0 truncate text-sm font-bold text-ink-900">{title}</h3>
            )}
            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>
          <div className={cx(!flush && "p-3.5")}>{children}</div>
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
        "rounded-full",
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
  icon?: IconType;
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
        // A row's hover and selected fills are the widest blocks of colour in
        // a list view, so they are the ones that decide whether the list reads
        // as curvy or as a stack of bars. Rounded, and with the horizontal
        // padding raised to 12px so the text clears the new corner.
        "flex items-start gap-2.5 rounded-lg px-3 py-2",
        interactive && cx(MOTION, "cursor-pointer hover:bg-ink-50"),
        active && "bg-moss-50",
        className,
      )}
      {...rest}
    >
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" strokeWidth={ICON_STROKE} />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        {meta && <div className="mt-px text-xs text-ink-500">{meta}</div>}
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
 * A capsule. Uppercase letterforms at lowercase height, one weight of border.
 *
 * A badge is the smallest object in the app that has a fill, which makes it
 * the one where the shape is read fastest — at 18px tall there is no interior
 * to look at, only an outline. It is also never aligned to anything, since it
 * sits inline in a sentence or at the end of a row. Both of those point the
 * same way.
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-px",
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
  icon?: IconType;
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
        "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between",
        !bare && "border-b border-ink-200 pb-2",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          // A 26px disc. An icon beside a heading is a locator, not a feature —
          // it should not out-weigh the words, which is why it keeps the flat
          // fill and the hairline rather than picking up the accent.
          <span className="mt-px flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-ink-600">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
          <h2 className="text-lg font-bold text-ink-900 text-balance">{title}</h2>
          {description && (
            <p className="mt-0.5 max-w-prose text-sm text-ink-500 text-pretty">
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
  icon?: IconType;
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
    <div
      className={cx(
        "flex min-w-0 flex-col gap-0.5 rounded-lg bg-ink-50 px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            className={cx("h-3.5 w-3.5 shrink-0", STAT_TONE[tone])}
            strokeWidth={ICON_STROKE}
          />
        )}
        <span className="eyebrow truncate">{label}</span>
      </div>
      <div
        data-numeric
        className="text-xl font-bold leading-none tracking-tight text-ink-900"
      >
        {value}
      </div>
      {hint && <div className="truncate text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

/**
 * A row of stat tiles.
 *
 * This was a single framed strip with vertical rules between the cells, which
 * is the correct construction for a square system and cannot survive a round
 * one: a divider that runs the full height of a 20px-radius frame either
 * terminates in mid-air short of the curve or crosses it. Both look like a
 * rendering bug, and there is no third option — the rule and the corner are
 * describing the same edge in two different languages.
 *
 * So the rules are gone and the cells are separate sunken tiles on a small gap.
 * The strip still reads as one instrument panel, because what made it read that
 * way was never the dividers — it was that the labels share a baseline and the
 * figures share a scale, and those are untouched.
 */
export function StatRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid grid-cols-2 gap-1.5 sm:grid-cols-4", className)}>
      {children}
    </div>
  );
}

/* ===========================================================================
 * PROGRESS
 * A capsule track with a capsule fill.
 *
 * The square-ended version this replaces was there for a real reason: a round
 * cap on a 6px bar is ~3px wide at each end, so a 2% value renders as a dot
 * that looks identical to a 4% value. That objection is answered by the height
 * rather than by the shape — at `sm` the bar is 4px, so the cap is 2px, and
 * the fill is given a `min-width` equal to its own height so a non-zero value
 * always renders as a visible, correctly-proportioned lozenge instead of a
 * sliver. Zero stays empty, which is the distinction that actually matters.
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
        "w-full overflow-hidden rounded-full bg-ink-100",
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
          "h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          PROGRESS_FILL[tone],
        )}
        // `min-width` only applies once there is something to show. See the
        // note above the component: it is what keeps a round cap from turning
        // every small value into the same dot.
        style={{ width: `${pct}%`, minWidth: pct > 0 ? (size === "sm" ? 4 : 6) : 0 }}
      />
    </div>
  );
}

/* ===========================================================================
 * EMPTY STATE
 * ======================================================================== */
export interface EmptyStateProps {
  icon?: IconType;
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
        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed",
        // Was px-6 py-10. An empty state is a placeholder, not a feature — at
        // 40px of vertical padding it was reserving more room than the content
        // it stands in for would have taken.
        "border-ink-300 bg-ink-50 px-5 py-7 text-center",
        className,
      )}
    >
      {Icon && (
        // Bare, with no frame around it. The icon is a hint at what is missing,
        // and wrapping it in a chip made the absence of content look like a
        // component in its own right.
        <Icon className="h-4 w-4 text-ink-400" strokeWidth={ICON_STROKE} />
      )}
      <h3 className="text-sm font-bold text-ink-900 text-balance">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs text-ink-500 text-pretty">{description}</p>
      )}
      {action && <div className="mt-0.5">{action}</div>}
    </div>
  );
}

/* ===========================================================================
 * SEGMENTED CONTROL / TABS
 * A pill strip on a sunken capsule track.
 *
 * This was an underlined tab bar, which is the right control for a page built
 * out of rules and the wrong one for a page built out of curves: the underline
 * is a straight line terminating in two square ends, sitting on a straight
 * container border, and it was the last piece of the old vocabulary still
 * visible in a default view. Everything it was doing — mark one of n, cost no
 * elevation — a filled pill in a track does as well.
 *
 * `variant` is kept because roughly a dozen call sites pass it, but the two
 * variants are now the same object at two weights: `underline` (the default)
 * is the track with no frame, `boxed` is the track with a hairline round it
 * for use inside a toolbar where it needs to hold its own against a button.
 * ======================================================================== */
export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: IconType;
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
        "inline-flex items-stretch gap-0.5 rounded-full bg-ink-100 p-1",
        boxed && "border border-ink-200",
        // A scrolling track has to keep its end caps clear of the content, or
        // the first pill sits half-under the left curve at scroll offset 0.
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
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5",
              "text-xs font-semibold",
              MOTION,
              active
                ? // White rather than the accent fill. The selected tab is a
                  // location, not an action — filling it moss would put the
                  // brightest thing on the screen on something the user has
                  // already done rather than on what they can do next.
                  "bg-white text-ink-900 shadow-e1"
                : "text-ink-500 hover:text-ink-900",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={ICON_STROKE} />}
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
 * SOLID WHITE, and it stays solid white now that everything around it is not.
 * An earlier version of this system made the field translucent so the page
 * showed through; it was a nice detail and it made every form look like it was
 * printed on the page rather than something you could type into. That is even
 * more true against glass — a translucent control on a translucent surface has
 * no edge at all, and the one place in an interface where the user must be
 * certain where the boundary is, is the box they are about to type in.
 *
 * So the input is the exception: opaque fill, real border. It reads as the
 * solid object set into the glass, which is also what it is.
 */
export const inputClass = (hasError?: boolean, hasLeadingIcon?: boolean) =>
  cx(
    // A capsule, and the height is up from 34px to 38px because of it. A pill
    // input at 34px with a 17px cap on each end has almost no straight run
    // left for the text to sit on, so the caret at position 0 lands in the
    // curve. 38px is the shortest height at which it does not.
    "w-full h-[2.375rem] rounded-full border bg-white text-sm text-ink-900",
    // ink-500 placeholder, not ink-400: placeholders are text and must clear
    // 4.5:1. The border uses ink-300 at rest, which clears 3:1 for a
    // perceivable boundary (WCAG 1.4.11).
    "placeholder:text-ink-400",
    "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
    // A 1px inset ring in the accent, not a diffuse halo — the border simply
    // gets heavier and changes colour.
    "focus:outline-none focus:ring-1",
    "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500",
    // LITERAL VALUES, DELIBERATELY. Every Tailwind spacing step from 6 upward
    // is remapped at the foot of `index.css` — `pl-10` resolves to 24px there,
    // not 40px. That compression is correct for layout padding, which is what
    // it was written for, and wrong for this: the leading inset is not a
    // spacing choice, it is the width of the icon that sits in it. A 16px icon
    // at `left-4` ends at 32px, so anything under that puts the placeholder
    // underneath the glyph — which is exactly what `pl-9` and `pl-10` both did.
    //
    // 2.5rem clears the icon with 8px of air. 2.75rem on the right clears a
    // 32px trailing button at `right-2`. Neither can be expressed in the scale
    // without picking a step the compression block will silently rewrite.
    hasLeadingIcon ? "pl-[2.5rem] pr-4" : "px-4",
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
      className={cx("animate-pulse rounded-full bg-ink-100", className ?? "h-3.5 w-full")}
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
