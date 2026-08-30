/**
 * REAL UNIVERSITY IMAGERY
 * ----------------------------------------------------------------------------
 * Every university card used to show a stock photograph. Not a stock photograph
 * OF that university — a stock photograph of *a* university, picked because it
 * looked like a campus. MIT's card showed a library in Prague. A student
 * comparing seven programmes was looking at seven pictures of nowhere.
 *
 * This module replaces them with the actual article imagery from Wikipedia, so
 * the card for Cambridge shows Cambridge.
 *
 * WHY WIKIPEDIA AND NOT AN IMAGE SEARCH
 * -------------------------------------
 * Three reasons, in order of how much they matter here:
 *
 *   1. It is keyed to an identity, not to a phrase. We ask for the media on
 *      the article `Massachusetts_Institute_of_Technology`, which is a thing,
 *      rather than searching the string "MIT campus", which is a guess. There
 *      is no scenario where this returns a photograph of a different school.
 *   2. The licensing is already settled. Everything on Commons is free to
 *      display with attribution, which the caller renders from `credit`.
 *   3. No key, no quota, no account. The REST API is open, sends
 *      `Access-Control-Allow-Origin: *`, and is served from the same CDN as
 *      the images themselves.
 *
 * TWO IMAGES, TWO ENDPOINTS, AND THE DISTINCTION MATTERS
 * ------------------------------------------------------
 * `summary` returns the article's lead image. For a university that is almost
 * always the coat of arms or the seal — which is exactly what the card wants
 * for its CREST, and exactly what it does not want for its HERO. Reaching for
 * the obvious endpoint gets you a 200x200 heraldic shield stretched across a
 * 400px banner, which is worse than the stock photo it replaced.
 *
 * So the hero comes from `media-list`, which returns every image on the page,
 * and is then filtered down to the ones that are photographs of the place. See
 * `scoreCandidate` for how, and for why the filter is a score rather than a
 * predicate.
 */

import React from "react";

/** What a card needs to render a university's imagery. */
export interface UniversityMedia {
  /** Campus photograph. Null when nothing on the article qualified. */
  hero: string | null;
  /** Coat of arms, seal or wordmark — the article's lead image. */
  crest: string | null;
  /** Commons file name behind `hero`, for the attribution line. */
  credit: string | null;
}

const EMPTY: UniversityMedia = { hero: null, crest: null, credit: null };

const REST = "https://en.wikipedia.org/api/rest_v1/page";

/** How long a resolved result stays good in `sessionStorage`. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = "northr.unimedia.";

/**
 * Give up rather than hold the card in a skeleton. The images are decoration
 * on top of data the view already has, so a slow network should cost the
 * student a photograph, not the comparison table they came for.
 */
const TIMEOUT_MS = 6000;

/* ---------------------------------------------------------------------------
 * FILENAME SCORING
 *
 * A university article carries thirty to eighty images and only some of them
 * are the university. The rest are the coat of arms, the flag of the country,
 * a locator map, a portrait of a founder, a diagram from a research group, and
 * the four or five interface icons MediaWiki injects into every page.
 *
 * We cannot look at the pixels, and `media-list` does not report dimensions, so
 * the filename is all there is. That sounds worse than it is: Commons filenames
 * for this category are unusually descriptive, because they are written by
 * people documenting a place.
 *
 * This is a SCORE rather than a filter, and that is the part worth explaining.
 * A hard predicate has to be either strict — and reject the one good photo on
 * an article that names it something unhelpful — or loose, and let a portrait
 * of a nineteenth-century benefactor through. A score lets the obvious wins
 * (a file with "campus" in the name) outrank the merely plausible without
 * either of them being a rule.
 * ------------------------------------------------------------------------ */

/** Never a photograph of the place, whatever else the name says. */
const DISQUALIFY = [
  /\.svg$/i,
  /\.(ogg|oga|ogv|webm|mp3|wav|pdf|djvu)$/i,
  /coat[ _-]?of[ _-]?arms/i,
  /\bcrest\b/i,
  /\bseal\b/i,
  /\blogo\b/i,
  /wordmark/i,
  /\bshield\b/i,
  /\bflag\b/i,
  /\bmap\b/i,
  /locator/i,
  /\bicon\b/i,
  /\bcommons-/i,
  /wiki(pedia|media|source|quote|data)/i,
  /\bedit[ _-]?icon\b/i,
  /question[ _-]?book/i,
  /ambox/i,
  /\bportrait\b/i,
  /\bsignature\b/i,
  /\bchart\b/i,
  /\bgraph\b/i,
  /\bdiagram\b/i,
  /organi[sz]ation/i,
];

/** Names that describe the place itself. Higher is more likely to be the shot. */
const PROMOTE: Array<[RegExp, number]> = [
  [/campus/i, 6],
  [/aerial/i, 5],
  [/panorama|skyline/i, 5],
  [/quad(rangle)?/i, 4],
  [/\bmain\b/i, 3],
  [/college|university|institut/i, 3],
  [/hall|building|library|tower|gate|court|chapel|dome/i, 3],
  [/view|exterior|front/i, 2],
  [/\.jpe?g$/i, 2], // a photograph, as opposed to a PNG of something drawn
];

/**
 * Real photographs of the right place that are nonetheless the wrong picture.
 *
 * These are almost all archival. A university article's best-named image is
 * very often its oldest — `..._campus_aerial_all_buildings_1921_US_Army` beat
 * `MIT_Main_Campus_aerial` on keywords alone, and put a sepia survey plate from
 * 1921 on the card. A four-digit year in a filename is a reliable tell for
 * that, because nobody date-stamps a photo they think of as current.
 */
const DEMOTE: Array<[RegExp, number]> = [
  [/\b1[6-9]\d{2}\b/, 10], // an explicit pre-1900s date
  [/\b20[01]\d\b/, 1], // merely a little dated; a nudge, not a veto
  [/\bold\b/i, 4],
  [/histor/i, 4],
  [/engraving|lithograph|painting|drawing|postcard/i, 10],
];

/**
 * The score a candidate has to beat to be used at all.
 *
 * A file that is simply a gallery JPEG with nothing place-like in its name
 * scores 4 — and so does every photograph of a person, which is what an
 * article's gallery is otherwise full of (alumni, founders, Nobel laureates).
 * The two are indistinguishable from the filename alone, so 4 is not good
 * enough: the floor is set just above it, meaning at least one word describing
 * a place had to match. Below that we fall back to the static image rather than
 * put a portrait of a dead benefactor on the card.
 */
const MIN_SCORE = 5;

/**
 * DO NOT REWRITE THE WIDTH IN A COMMONS URL.
 *
 * Commons thumbnails are addressed by pixel width in the path
 * (`.../640px-Name.jpg`), which makes it very tempting to swap that segment for
 * the size you actually want. It half works, which is worse than not working:
 * Wikimedia only serves widths it has already rendered, and refuses the rest
 * with a 400 to stop the CDN being used as a general-purpose image resizer.
 * Which widths those are is per-file and not discoverable — for `MIT_Seal.svg`,
 * 330 and 250 are served while 320, 256, 240 and 200 are all rejected.
 *
 * The API already answers this question. `media-list` gives a `srcset` with a
 * 1x and a 2x rendition, and `summary` gives a thumbnail; every one of those
 * URLs is a width that exists. So the rule is to pick from what is offered and
 * never to construct.
 *
 * This function therefore only normalises the scheme: the API returns
 * protocol-relative URLs, which resolve correctly in a browser and to nothing
 * anywhere else.
 */
function absolute(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/** The largest rendition the API offered for this file. */
function widestSrc(item: MediaListItem): string | null {
  const set = item.srcset;
  if (!set?.length) return null;
  // Entries are ordered 1x, 2x. Scale is a string ("1x"), hence the parseFloat.
  const best = set.reduce((a, b) =>
    parseFloat(b.scale ?? "1") > parseFloat(a.scale ?? "1") ? b : a,
  );
  return best.src ? absolute(best.src) : null;
}

/** `File:Great Court, Trinity College.jpg` → `Great Court, Trinity College` */
function fileLabel(title: string): string {
  return title
    .replace(/^File:/i, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

interface MediaListItem {
  title?: string;
  type?: string;
  showInGallery?: boolean;
  srcset?: Array<{ src?: string; scale?: string }>;
}

function scoreCandidate(item: MediaListItem): number {
  const raw = item.title ?? "";
  if (item.type !== "image") return -1;
  if (!item.srcset?.[0]?.src) return -1;

  // Commons filenames are word-separated by underscores, and an underscore is
  // a word character — so `\b1921\b` does not match `..._buildings_1921_US_...`
  // and `\bmain\b` does not match `MIT_Main_Campus`. Normalising the separators
  // before matching is what makes every `\b` in the tables above mean what it
  // reads as. Skipping this silently disables about half of them, which is a
  // failure that looks like a working heuristic with poor taste.
  const title = raw.replace(/[_-]+/g, " ");

  if (DISQUALIFY.some((re) => re.test(title))) return -1;

  // Gallery images are the ones laid out in the article body rather than
  // pulled into an infobox or a navigation template, which correlates well
  // with "someone chose this picture to show you the place".
  let score = item.showInGallery ? 2 : 0;
  for (const [re, weight] of PROMOTE) {
    if (re.test(title)) score += weight;
  }
  for (const [re, weight] of DEMOTE) {
    if (re.test(title)) score -= weight;
  }
  return score;
}

/* ---------------------------------------------------------------------------
 * FETCHING
 * ------------------------------------------------------------------------ */

async function getJSON(url: string, signal: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
      // The REST API is public and cacheable; sending credentials would only
      // defeat the CDN and trip the wildcard CORS policy.
      credentials: "omit",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // AbortError, offline, DNS, a corporate proxy that eats Wikipedia — all of
    // them mean the same thing to the caller, which is "no image".
    return null;
  }
}

/**
 * Resolve one university's imagery.
 *
 * Never throws and never rejects. A university whose article has been renamed,
 * or whose images are all heraldry, resolves to nulls and the card falls back
 * to whatever static image it was given.
 */
export async function fetchUniversityMedia(
  wikipediaTitle: string,
): Promise<UniversityMedia> {
  if (!wikipediaTitle) return EMPTY;

  const cached = readCache(wikipediaTitle);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const path = encodeURIComponent(wikipediaTitle.replace(/ /g, "_"));

  try {
    // Both requests at once. They are independent, they hit the same CDN
    // connection, and the crest is not worth a second round trip on its own.
    const [mediaList, summary] = await Promise.all([
      getJSON(`${REST}/media-list/${path}`, controller.signal),
      getJSON(`${REST}/summary/${path}`, controller.signal),
    ]);

    let hero: string | null = null;
    let credit: string | null = null;

    const items: MediaListItem[] = Array.isArray(mediaList?.items) ? mediaList.items : [];
    let best: MediaListItem | null = null;
    let bestScore = MIN_SCORE - 1;
    for (const item of items) {
      const score = scoreCandidate(item);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    if (best) {
      hero = widestSrc(best);
      if (hero) credit = fileLabel(best.title ?? "");
    }

    // The lead image, which for a university is usually the arms or the seal.
    //
    // USUALLY, not always — and the exception has to be caught here. ETH
    // Zurich's article leads with a photograph of the Hauptgebäude, so taking
    // the lead image unconditionally put a 4MB building photo inside a 28px
    // disc, which reads as a smudge and downloads the whole file to do it.
    //
    // The tell is the file type. A coat of arms, a seal or a wordmark is
    // vector art and is stored on Wikipedia as an SVG, served as a rasterised
    // `.svg/<width>px-....png`. A photograph never is. So an SVG-derived
    // thumbnail is a mark and anything else is a picture — and where it is a
    // picture we render the initials instead, which at least look deliberate.
    //
    // `thumbnail` before `originalimage`: for a seal the thumbnail is the
    // rendition that exists at a sane size, and the original may be enormous.
    const crestSrc: string | undefined =
      summary?.thumbnail?.source ?? summary?.originalimage?.source;
    const crest = crestSrc && /\.svg\//i.test(crestSrc) ? absolute(crestSrc) : null;

    const media: UniversityMedia = { hero, crest, credit };
    writeCache(wikipediaTitle, media);
    return media;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------------
 * CACHE
 *
 * Two layers, and the in-memory one is not redundant. A grid of seven cards
 * mounts seven effects in the same tick, so without a synchronous check they
 * all miss `sessionStorage` (which is populated asynchronously, after the
 * fetch resolves) and fire seven duplicate requests. `inflight` holds the
 * promise itself so the second caller awaits the first caller's request.
 * ------------------------------------------------------------------------ */

const memory = new Map<string, UniversityMedia>();
const inflight = new Map<string, Promise<UniversityMedia>>();

function readCache(key: string): UniversityMedia | null {
  const hit = memory.get(key);
  if (hit) return hit;

  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; media: UniversityMedia };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    memory.set(key, parsed.media);
    return parsed.media;
  } catch {
    // Private browsing, a full quota, or a payload from an older shape of this
    // module. None of them are worth reporting; the fetch below is the answer.
    return null;
  }
}

function writeCache(key: string, media: UniversityMedia): void {
  memory.set(key, media);
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ at: Date.now(), media }),
    );
  } catch {
    /* Quota or private mode. The in-memory copy still holds for this session. */
  }
}

/** De-duplicated entry point. This is what callers should use. */
export function loadUniversityMedia(wikipediaTitle: string): Promise<UniversityMedia> {
  if (!wikipediaTitle) return Promise.resolve(EMPTY);

  const cached = readCache(wikipediaTitle);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(wikipediaTitle);
  if (existing) return existing;

  const request = fetchUniversityMedia(wikipediaTitle).finally(() => {
    inflight.delete(wikipediaTitle);
  });
  inflight.set(wikipediaTitle, request);
  return request;
}

/* ---------------------------------------------------------------------------
 * REACT BINDING
 * ------------------------------------------------------------------------ */

/**
 * Resolve a university's imagery for a component, with a fallback that renders
 * immediately.
 *
 * `hero` is never null while the component is mounted — it starts as
 * `fallbackHero` and is replaced when the real photograph arrives. That
 * ordering is deliberate: an image that swaps once is better than a grey
 * rectangle that resolves into an image, because the card's layout is settled
 * from the first frame either way and only the picture changes.
 *
 * `isReal` says which of the two is on screen, so the view can hold the
 * attribution line back until there is something to attribute.
 */
export function useUniversityMedia(
  wikipediaTitle: string | undefined,
  fallbackHero: string,
): UniversityMedia & { isReal: boolean } {
  const [media, setMedia] = React.useState<UniversityMedia>(
    () => (wikipediaTitle ? readCache(wikipediaTitle) : null) ?? EMPTY,
  );

  React.useEffect(() => {
    if (!wikipediaTitle) return;

    let live = true;
    loadUniversityMedia(wikipediaTitle).then((next) => {
      if (live) setMedia(next);
    });
    return () => {
      live = false;
    };
  }, [wikipediaTitle]);

  return {
    hero: media.hero ?? fallbackHero,
    crest: media.crest,
    credit: media.credit,
    isReal: Boolean(media.hero),
  };
}
