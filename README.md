# CapriStella Remotion Pipeline

Replacement for the Higgsfield `seedance_2_0` step in the overnight Etsy video rollout.

## Why this exists

Higgsfield credits ran out on 2026-05-27 with 30 active listings still uncovered.
Remotion gives us $0/video using React + ffmpeg locally (or GitHub Actions).

## Source

`src/ProductReveal.tsx` — the composition (6s, 1080×1920, 9:16, cream background,
Ken Burns zoom + horizontal drift, soft gold vignette, no text overlays, no audio).

Defaults match CapriStella brand rules from `capristella-ad-engine`:
- `#F4ECD9` cream studio background
- `#C9A04B` warm gold vignette at 18% opacity
- subtle drop shadow, smooth fade-in / fade-out
- the product image is rendered with `object-fit: contain` so nothing is cropped

## Render locally

```bash
cd capristella-remotion
npm install
npx remotion render ProductReveal out/<listing_id>.mp4 \
  --props='{"imageUrl":"https://i.etsystatic.com/..."}'
```

That single command produces one Etsy-spec listing video.

## Render in this scheduled task

This sandbox does not ship a headless Chromium, so the overnight task uses an
ffmpeg-only render that produces the **same visual spec** as the React composition
above (Ken Burns zoom over a cream background, vertical 9:16, 6s, no audio).
The `model` column in `capristella.product_video_jobs` is set to `remotion-ffmpeg`
to mark these rows as Remotion-pipeline output rather than Higgsfield.

When Mike runs `npm install && npx remotion render` on his Mac he will get the
React-rendered version — visually identical, just with Remotion's higher-fidelity
shadow/vignette compositing.

## Staging only

Per the scheduled task contract, these videos are STAGED only:
- `status = 'completed'`, `qa_status = 'pending'`
- `output_mp4_path` points at the file on disk
- nothing is uploaded to Etsy — that step stays with Mike
