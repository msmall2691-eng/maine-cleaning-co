#!/usr/bin/env python3
"""
Build responsive WebP variants for every photograph in client/public/images.

Why: the source photographs are camera-sized — the kitchens are 2000x1500 —
and every one of them was being served at full resolution to a 390px phone.
That is roughly a 5x oversample: the browser downloads ~300KB, decodes it at
3 megapixels, and then throws 96% of those pixels away. On a phone that decode
is the thing that makes a scroll stutter, and it happens again for every image
that scrolls into view.

Widths are chosen for how these actually render: 480 covers a phone at DPR 1-2
in a half-width frame, 960 a phone at DPR 3 or a tablet, 1440 a desktop hero.
The original file stays put and stays the `src`, so anything that does not
understand `srcset` — and any consumer this script has not been wired into —
still gets a working image.

Run: python3 scripts/gen-responsive-images.py
"""
import json
import pathlib
import sys

from PIL import Image

WIDTHS = (480, 960, 1440)
QUALITY = 78
ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "client" / "public" / "images"

# Marks and badges, not photographs: they are already small, already sized for
# their slot, and re-encoding line art as lossy WebP is how you get fringing.
SKIP_PREFIXES = ("logo", "ahca-", "favicon")


def is_photo(path: pathlib.Path) -> bool:
    if path.suffix.lower() not in {".jpeg", ".jpg", ".png"}:
        return False
    return not path.name.startswith(SKIP_PREFIXES)


def main() -> int:
    if not IMG_DIR.is_dir():
        print(f"no image directory at {IMG_DIR}", file=sys.stderr)
        return 1

    manifest: dict[str, list[int]] = {}
    saved_before = saved_after = 0

    for src in sorted(IMG_DIR.iterdir()):
        if not is_photo(src):
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            native = im.width
            built: list[int] = []
            for w in WIDTHS:
                # Never upscale: a 480px-wide source gets no 960 variant, and
                # claiming one in a srcset would make the browser download a
                # blurry file in preference to the sharp original.
                if w > native:
                    continue
                out = IMG_DIR / f"{src.stem}-{w}.webp"
                im.resize((w, round(im.height * w / native)), Image.LANCZOS).save(
                    out, "WEBP", quality=QUALITY, method=6
                )
                built.append(w)
                saved_after += out.stat().st_size
            # The native width is only worth advertising if it beats our
            # largest variant; otherwise 1440 already is the full picture.
            if native > max(WIDTHS):
                out = IMG_DIR / f"{src.stem}-{native}.webp"
                im.save(out, "WEBP", quality=QUALITY, method=6)
                built.append(native)
                saved_after += out.stat().st_size

        if built:
            manifest[src.name] = built
            saved_before += src.stat().st_size
            print(f"  {src.name:52} {native:>5}px -> {built}")

    (ROOT / "client" / "src" / "lib" / "image-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    )
    print(f"\n{len(manifest)} photographs")
    print(f"originals {saved_before/1024:.0f}KB  ->  all variants together {saved_after/1024:.0f}KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
