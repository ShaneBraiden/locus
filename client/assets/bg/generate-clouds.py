#!/usr/bin/env python3
"""
Generates the cloud layers used by the glass surfaces in `src/index.css`.

    python3 client/assets/bg/generate-clouds.py

Outputs, all RGBA PNGs:

    clouds-wide.png    1600x260   — the floating nav bar
    clouds-card.png     900x460   — panel headers and large surfaces
    clouds-auth.png     900x700   — the auth card
    clouds-soft.png     640x320   — drawn, not photographic; small cards

A CLOUD IS NOT THE WHITE PART
-----------------------------
The first version of this script masked the sky down to its bright pixels and
composited them as white. On a glass card — which is already 97% white — that
is white on white, and the result was invisible.

What makes a cloud legible is not the cloud. It is the blue *between* the
clouds. So these layers keep the whole sky, both the cloud and the gaps, and
carry it at low opacity: the gaps tint the card faintly blue, the clouds leave
it near-white, and the shapes appear as the difference between the two. The
layer is a rectangle rather than a cut-out, feathered at its edges so it can be
scaled or repositioned without showing where its bitmap stops.

TWO KINDS OF CLOUD
------------------
The photographic layers are cut from the same photograph as the page field, so
a card and the page behind it are lit by the same light — that is the whole
reason to use the real image rather than draw one. But a photograph carries
detail, and detail inside a 200px card competes with the content in it.

So the small-surface variant is drawn: same palette, same falloff, built from
summed radial blobs, with no structure to notice. It reads as cloud at a glance
and as nothing at all on inspection, which is what a background behind a data
table has to do.

THE PEAKS ARE A CONTRAST BUDGET
-------------------------------
Body copy sits on these surfaces. Each layer is composited onto the glass
colour it will actually be used over, and its peak opacity is solved — not
chosen — as the largest value that keeps the lightest text token in the system
at or above `MIN_RATIO` over the darkest resulting pixel.

Raising a peak by hand will break that. Change `MIN_RATIO` or a `CEILING` and
let the solver re-derive.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SRC = HERE / "source"

# The surface each layer is composited over when its opacity is solved.
#
# This is `--glass-tint` (0.72) white over the DARKEST pixel of the page field
# (#F0E3E4, in the warm corner) — not over the lightest, and not over an
# idealised white. Both of those were tried and both were wrong: the whole
# point of solving rather than eyeballing is that the number has to hold in the
# worst case that actually occurs on screen, and the worst case is a panel
# sitting in the maroon corner.
#
# Mirrors `--glass-tint` in index.css. If that token changes, this changes.
GLASS = np.array([0.983, 0.969, 0.970], dtype=np.float32)

# The reference text colour, and it is deliberately not `ink-500`.
#
# `ink-500` (#5D6672, L 0.1304) is the lightest *neutral* text, which made it
# the obvious choice and made it the wrong one. Three status colours are
# lighter still — `clay-500`, `good-500` and `warn-500` all sit at L 0.1350,
# having each been darkened to precisely the page's contrast floor in the
# previous revision. Solving against ink-500 therefore passed ink-500 and
# failed all three by about 0.15 of a ratio point.
#
# So the reference is the lightest text token in the system, whichever that
# is: clay-500. Everything darker follows for free.
REFERENCE_TEXT = np.array([0x99, 0x53, 0x4F], dtype=np.float32) / 255

# A hair above the 4.5 threshold. The margin covers JPEG quantisation in the
# field beneath, and the difference between the nav's tint and a panel's.
MIN_RATIO = 4.62

# Ceilings. The solver will not exceed these even if contrast allows, because
# past this point the cloud stops being ambient and starts being a picture.
CEILING = {"wide": 0.30, "card": 0.16, "auth": 0.34, "soft": 0.15}


def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(rgb: np.ndarray) -> np.ndarray:
    lin = srgb_to_linear(rgb)
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def fill(im: Image.Image, w: int, h: int, focus: float = 0.5) -> Image.Image:
    """Cover-crop. `focus` is the vertical centre of the crop, 0 = top."""
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1), Image.LANCZOS)
    left = (im.width - w) // 2
    top = int(np.clip((im.height - h) * focus, 0, im.height - h))
    return im.crop((left, top, left + w, top + h))


def feather(w: int, h: int, fx_frac: float = 0.14, fy_frac: float = 0.18) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    fx = np.clip(np.minimum(xx, w - 1 - xx) / (w * fx_frac), 0, 1)
    fy = np.clip(np.minimum(yy, h - 1 - yy) / (h * fy_frac), 0, 1)
    return (fx * fx * (3 - 2 * fx)) * (fy * fy * (3 - 2 * fy))


def solve_peak(rgb: np.ndarray, mask: np.ndarray, ceiling: float) -> float:
    """
    Largest peak opacity that keeps REFERENCE_TEXT at MIN_RATIO over the
    darkest composited pixel. Bisection, because luminance is not linear in
    opacity.
    """
    l_text = luminance(REFERENCE_TEXT.reshape(1, 1, 3))[0, 0]

    def ok(peak: float) -> bool:
        a = (mask * peak)[..., None]
        comp = rgb * a + GLASS * (1 - a)
        l_bg = luminance(comp).min()
        return (l_bg + 0.05) / (l_text + 0.05) >= MIN_RATIO

    if ok(ceiling):
        return ceiling
    lo, hi = 0.0, ceiling
    for _ in range(40):
        mid = (lo + hi) / 2
        if ok(mid):
            lo = mid
        else:
            hi = mid
    return lo


def write(rgb: np.ndarray, mask: np.ndarray, ceiling: float, path: Path, name: str) -> None:
    peak = solve_peak(rgb, mask, ceiling)
    alpha = mask * peak
    out = np.concatenate([rgb, alpha[..., None]], axis=-1)
    Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA").save(path, optimize=True)

    a = alpha[..., None]
    comp = rgb * a + GLASS * (1 - a)
    l_text = luminance(REFERENCE_TEXT.reshape(1, 1, 3))[0, 0]
    ratio = (luminance(comp).min() + 0.05) / (l_text + 0.05)
    hit = "ceiling" if abs(peak - ceiling) < 1e-6 else "contrast"
    print(f"{path.name:<18} peak {peak:.3f} ({hit}-limited)  ref-text {ratio:.2f}:1")


def photographic(w: int, h: int, focus: float, blur: float, lift: float, ceiling: float, path: Path) -> None:
    sky = Image.open(SRC / "sky.jpg").convert("RGB")
    rgb = np.asarray(fill(sky, w, h, focus).filter(ImageFilter.GaussianBlur(blur)), dtype=np.float32) / 255

    # Lift toward white and pull saturation down. The layer is a tint, not a
    # photograph — at full saturation the blue gaps read as a picture of a sky
    # rather than as the card catching light.
    grey = rgb.mean(axis=-1, keepdims=True)
    rgb = rgb * 0.72 + grey * 0.28
    rgb = rgb * (1 - lift) + lift

    write(rgb, feather(w, h), ceiling, path, path.stem)


def drawn(w: int, h: int, ceiling: float, path: Path, seed: int = 11) -> None:
    """
    Summed radial blobs in three horizontal bands, coloured on the same two-
    point ramp as the photograph: sky-200 in the gaps, near-white in the
    clouds. Deterministic, so the shape is stable across runs.
    """
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = xx / w, yy / h
    field = np.zeros((h, w), dtype=np.float32)

    for band_v, count, scale in ((0.30, 7, 0.20), (0.58, 6, 0.26), (0.84, 5, 0.17)):
        for _ in range(count):
            cx = rng.uniform(-0.05, 1.05)
            cy = band_v + rng.uniform(-0.07, 0.07)
            rx = scale * rng.uniform(0.65, 1.45)
            ry = rx * rng.uniform(0.32, 0.55)
            d = np.sqrt(((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2)
            field += np.clip(1 - d, 0, 1) ** 2

    field = np.asarray(
        Image.fromarray((np.clip(field / field.max(), 0, 1) * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(w * 0.018)
        ),
        dtype=np.float32,
    ) / 255
    t = np.clip((field - 0.10) / 0.70, 0, 1)
    t = (t * t * (3 - 2 * t))[..., None]

    gap = np.array([0.792, 0.871, 0.929], dtype=np.float32)   # sky-200, lifted
    cloud = np.array([1.000, 0.998, 0.994], dtype=np.float32)
    rgb = gap * (1 - t) + cloud * t

    write(rgb, feather(w, h, 0.16, 0.20), ceiling, path, path.stem)


def build() -> None:
    # Dimensions are small on purpose. Every layer is blurred past the point
    # where resolution carries information, and each is stretched to `cover`
    # by CSS, so a 1600px-wide bitmap is indistinguishable from a 2400px one
    # and a third of the bytes.
    #
    # `focus` picks which band of the source photograph gets used, and it
    # matters more than any other parameter here: the middle of that image is
    # open blue with no cloud in it at all, so a layer cropped from the centre
    # comes out as a flat wash. The crops below take the top and bottom bands,
    # where the cloud edges actually are.
    photographic(1600, 260, focus=0.16, blur=5.0, lift=0.30, ceiling=CEILING["wide"], path=HERE / "clouds-wide.png")
    photographic(900, 460, focus=0.90, blur=6.0, lift=0.42, ceiling=CEILING["card"], path=HERE / "clouds-card.png")
    photographic(900, 700, focus=0.62, blur=5.0, lift=0.26, ceiling=CEILING["auth"], path=HERE / "clouds-auth.png")
    drawn(640, 320, ceiling=CEILING["soft"], path=HERE / "clouds-soft.png")


if __name__ == "__main__":
    build()
