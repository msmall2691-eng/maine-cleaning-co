# Media credits and licensing

Every file in this directory comes from the **U.S. National Park Service**,
which publishes it as a work of the federal government.

> No U.S. copyright. Federal NPS staff work (17 U.S.C. sec. 105).
> Licence marker: https://creativecommons.org/publicdomain/mark/1.0/

Works of the U.S. federal government are not subject to copyright protection
in the United States, so these may be used commercially, modified and
redistributed. **Attribution is not legally required**; the site credits them
anyway, on the photograph in the About section.

| File | Source clip | NPS park | Archive item |
|---|---|---|---|
| `coast-hero.mp4`, `coast-hero-poster.*` | *Enjoying the views on Isle au Haut* | Acadia National Park | `nps-video-acad-enjoying-the-views-on-isle-au-haut` |
| `waves-ambient.m4a`, `waves-ambient.ogg` | *Frenchman Bay Views* | Acadia National Park | `nps-video-acad-frenchman-bay-views` |
| `shore-boulders.webp` | *Enjoying the views on Isle au Haut* | Acadia National Park | `nps-video-acad-enjoying-the-views-on-isle-au-haut` |
| `shore-frenchman-bay.webp` | *Frenchman Bay Views* | Acadia National Park | `nps-video-acad-frenchman-bay-views` |
| `shore-tidepool.webp` | *Periwinkles* | Acadia National Park | `nps-video-acad-periwinkles` |

Mirrored at `https://archive.org/details/<item>`.

## How the derived files were made

The sources are 720p H.264 with AAC audio. Everything here is a cut and a
re-encode; nothing was retouched, recoloured or composited.

**`coast-hero.mp4`** — 1.9 MB, 5.7s, 1280×720, 24fps, silent.
The surf-on-cobble shot runs from 15.9s to 22.7s in the source, a little under
seven seconds, which is short for a hero. It loops seamlessly because the last
0.9s is cross-faded into the first 0.9s and the result starts after that
overlap, so the end of the file flows into the start of it:

```
ffmpeg -ss 16.9 -t 4.8 -i src.mp4 -ss 21.7 -t 0.9 -i src.mp4 -ss 16.0 -t 0.9 -i src.mp4 \
  -filter_complex "[0:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[body]; \
                   [1:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[tail]; \
                   [2:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[head]; \
                   [tail][head]xfade=transition=fade:duration=0.9:offset=0[seam]; \
                   [body][seam]concat=n=2:v=1:a=0[out]" \
  -map "[out]" -an -c:v libx264 -crf 29 -preset veryslow -r 24 \
  -pix_fmt yuv420p -movflags +faststart coast-hero.mp4
```

Only H.264 is shipped, not a WebM alongside it. VP9 at matching quality came
out *larger* than the 24fps H.264 here (2.1 MB against 1.9 MB), and H.264 in
MP4 plays everywhere, so a second file would have been 2 MB of repository for
nothing.

**`waves-ambient.m4a` / `.ogg`** — 0.45 MB, 33s, looping.
Thirty-three seconds from 5s–38s of the Frenchman Bay audio, cross-faded at
the seam, high-passed at 45 Hz to drop wind rumble, and normalised to
**−26 LUFS** — deliberately quiet, because it plays under a page rather than
being listened to. Two formats for codec coverage; the page offers AAC first.

The source was checked on a spectrogram before use: steady broadband noise
with a vertical streak per wave break, no speech formants, no music.

## Replacing any of this

Keep the filenames and the shapes and nothing in the code needs to change:

- the hero is 16:9, silent, and should loop seamlessly — a visible cut is far
  more distracting than a still would be
- the poster must be the same framing as the video's first frame, or the fade
  between them shows
- new audio must be normalised quiet (around −26 LUFS) and seam-faded
- if you swap in footage that is brighter on the **left**, re-check the hero
  text contrast: `.shore-scrim`'s copy wash is tuned to this plate, and
  `client/src/lib/__tests__/shorelinePalette.test.ts` does not measure
  composited video pixels
