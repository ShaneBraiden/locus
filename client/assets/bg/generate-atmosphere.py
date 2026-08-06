#!/usr/bin/env python3
"""
Generates the two atmosphere fields used by `src/index.css`.

    python3 client/assets/bg/generate-atmosphere.py

Inputs are the two source photographs in `source/`; outputs are
`atmosphere.jpg` (the page field) and `atmosphere-dark.jpg` (the inverse
sibling for `.atmos-hero`). Both are committed, so this only needs running if
the source images or the luminance floor change.

WHY THIS IS A SCRIPT AND NOT A CSS GRADIENT
-------------------------------------------
Three things here cannot be expressed in CSS, and each of them is the reason
the field reads as light rather than as a graphic:

  1. The blend follows the actual luminance of two photographs, so the falloff
     is irregular in the way real light is. A CSS radial-gradient is
     mathematically smooth and reads as a manufactured object.
  2. The grain is baked at source, at a fixed pixel size. An SVG `feTurbulence`
     overlay resamples with the viewport and the device pixel ratio, so the
     texture changes size between a laptop and a phone.
  3. The luminance floor below is enforced by measurement, not by eye — see
     LUMINANCE FLOOR. That is a numeric constraint on a whole image, which is
     not something a stylesheet can assert about itself.

LUMINANCE FLOOR
---------------
The design system puts content directly on the page rather than inside cards.
That means body copy at `ink-500` sits on the field itself, in every corner,
including the darkest part of the maroon pool. So the field carries a hard
constraint: no pixel may be dark enough to take `ink-500` below the WCAG AA
4.5:1 threshold.

`ink-500` (#5D6672) has a relative luminance of 0.1304, so the background must
stay at or above:

    (0.1304 + 0.05) * 4.5 - 0.05 = 0.762

`FLOOR` is set above that, to 0.87, to leave room for the two CSS gradients
that `body::before` layers on top of this image — those darken it further, and
the combined result is what the user actually reads against. The floor is
reached by lifting the entire field toward white by a solved constant rather
than by clamping the dark pixels, which would flatten the corner into a plateau
and put a visible edge where the clamp began.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SRC = HERE / "source"

W, H = 1920, 1280

# See LUMINANCE FLOOR above. Do not lower this without re-running the contrast
# check on ink-500 against the composited result.
FLOOR = 0.87


def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(rgb: np.ndarray) -> np.ndarray:
    lin = srgb_to_linear(rgb)
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def fill(im: Image.Image, w: int, h: int) -> Image.Image:
    """Cover-crop, centred."""
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1), Image.LANCZOS)
    left, top = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((left, top, left + w, top + h))


def lift_to_floor(rgb: np.ndarray, floor: float) -> np.ndarray:
    """
    Blend the whole field toward white by the smallest constant that brings its
    darkest pixel up to `floor`. Solved by bisection because luminance is not
    linear in the blend amount.
    """
    if luminance(rgb).min() >= floor:
        return rgb
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if luminance(rgb * (1 - mid) + mid).min() >= floor:
            hi = mid
        else:
            lo = mid
    return np.clip(rgb * (1 - hi) + hi, 0, 1)


def build() -> None:
    sky = Image.open(SRC / "sky.jpg").convert("RGB")
    maroon = Image.open(SRC / "maroon.png").convert("RGB")

    # Blurred hard enough that neither photograph reads as a photograph. What
    # survives is their light, which is the only part being used.
    sky_f = np.asarray(fill(sky, W, H).filter(ImageFilter.GaussianBlur(70)), dtype=np.float32) / 255
    maroon_f = np.asarray(fill(maroon, W, H).filter(ImageFilter.GaussianBlur(70)), dtype=np.float32) / 255

    yy, xx = np.mgrid[0:H, 0:W]
    u = xx / (W - 1)
    v = yy / (H - 1)

    # The maroon pools toward the lower right; the sky owns the upper left.
    # Reading order does the rest: the eye enters at the open blue and leaves
    # at the warm corner, which is the same order as "where you're going" then
    # "what you've built".
    d = np.sqrt(((u - 1.05) / 1.15) ** 2 + ((v - 1.10) / 1.05) ** 2)
    m = np.clip(1.0 - d, 0, 1) ** 1.35
    m = np.clip((m * 0.82 + np.clip(v - 0.30, 0, 1) ** 1.6 * 0.35) * 1.15, 0, 1)[..., None]

    base = sky_f * (1 - m) + maroon_f * m

    # Pull hard toward paper. This is an ambience, not a photograph.
    base = base * 0.162 + 0.838

    # Re-seat the hue the lift washes out, cool under the sky and warm under
    # the maroon, so the field keeps its two temperatures.
    cool = np.array([0.951, 0.970, 0.992], dtype=np.float32)
    warm = np.array([1.000, 0.951, 0.943], dtype=np.float32)
    base = base * 0.55 + (cool * (1 - m) + warm * m) * 0.45

    # Horizon: keep the top of the viewport open.
    base = base + (np.clip(0.55 - v, 0, 1) ** 2 * 0.030)[..., None]

    # Grain, baked at source so it never rescales. ~3% amplitude — enough to
    # break up banding on an 8-bit panel, far below the threshold where it
    # reads as a texture.
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 1, (H, W)).astype(np.float32)
    noise = np.asarray(
        Image.fromarray(((noise * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(0.55)
        ),
        dtype=np.float32,
    ) / 255
    grain = (noise - noise.mean())[..., None]

    light = lift_to_floor(np.clip(base + grain * 0.030, 0, 1), FLOOR)
    Image.fromarray((light * 255).round().astype(np.uint8)).save(
        HERE / "atmosphere.jpg", quality=88, optimize=True, subsampling=0
    )

    # The inverse sibling. Same field, same pool, read at night. No floor
    # applies: content on it is `content-invert`, so the constraint runs the
    # other way and is satisfied with room to spare.
    dark = np.clip(base, 0, 1) * np.array([0.16, 0.20, 0.26], dtype=np.float32) + np.array(
        [0.055, 0.068, 0.086], dtype=np.float32
    )
    dark = dark * (1 - m * 0.55) + (dark * np.array([1.35, 0.92, 0.90], dtype=np.float32)) * (m * 0.55)
    dark = np.clip(dark + grain * 0.020, 0, 1)
    Image.fromarray((dark * 255).round().astype(np.uint8)).save(
        HERE / "atmosphere-dark.jpg", quality=88, optimize=True, subsampling=0
    )

    print(f"atmosphere.jpg      min luminance {luminance(light).min():.4f}  (floor {FLOOR})")
    print(f"atmosphere-dark.jpg max luminance {luminance(dark).max():.4f}")


if __name__ == "__main__":
    build()
