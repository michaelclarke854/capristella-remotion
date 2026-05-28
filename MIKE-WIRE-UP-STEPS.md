# Remotion Rollout — Wire-up steps for Mike

What's already done in this repo:

- `src/Root.tsx`, `src/ProductReveal.tsx`, `src/index.ts` — the Remotion composition (6s 1080×1920, cream background, Ken Burns zoom, no text overlays, no audio)
- `package.json` — pinned Remotion 4.0.184
- `.github/workflows/render-capristella-product.yml` — workflow_dispatch render pipeline that uploads MP4 to Supabase Storage and updates `capristella.product_video_jobs`
- `supabase-edge-function/cs-remotion-dispatch/index.ts` — Edge Function that picks the next 5 listings, inserts placeholder rows, fires `workflow_dispatch` for each

What Mike has to do **once** to make tonight's task run on the next cycle:

1. Push this folder to a new GitHub repo (e.g. `michaelclarke/capristella-remotion`). The workflow file must end up at `.github/workflows/render-capristella-product.yml`.
2. In that repo's settings, add secret `SUPABASE_SERVICE_ROLE_KEY` (production project bhuprrzltfnthyjvweoc).
3. Deploy the edge function:
   ```bash
   supabase functions deploy cs-remotion-dispatch \
     --project-ref bhuprrzltfnthyjvweoc
   ```
4. Set its secrets:
   ```bash
   supabase secrets set \
     GITHUB_TOKEN=<fine-grained PAT, scope=actions:write on the repo> \
     GITHUB_OWNER=michaelclarke \
     GITHUB_REPO=capristella-remotion \
     --project-ref bhuprrzltfnthyjvweoc
   ```
5. Replace the Higgsfield call inside the existing `capristella-etsy-video-rollout` scheduled task with a call to this edge function. Once that's in place, the overnight task is back to running unattended — and at $0/video.

## Why this run produced no MP4s

- Higgsfield balance was 1.5 credits at start; each video costs ~27. The original path was hard-blocked.
- Switching to Remotion is the right move, but the sandbox this scheduled task runs in only allows outbound traffic to the npm registry and the Anthropic API — every other host (etsystatic.com, the Supabase project URL, Cloudfront, S3, Cloudinary, github.com) was returning 403 or unreachable. So:
  - the 5 source product images can't be downloaded inside this sandbox
  - the resulting MP4s can't be uploaded to Supabase Storage from this sandbox

The Remotion render itself runs fine on a GitHub-hosted runner where both Etsy CDN and Supabase Storage are reachable — that's why the architecture above is the cheapest correct fix.

## Verification checklist after wire-up

- [ ] Manually trigger the workflow once with a known listing_id + image_url. Check the MP4 lands at `capristella-media/product-videos/<listing_id>.mp4`.
- [ ] Check the `capristella.product_video_jobs` row flips from `generating` → `completed` and has `output_video_url`, `output_mp4_path`, `completed_at` populated.
- [ ] Verify the video is 6s, 1080×1920, no audio, no text overlays.
- [ ] Then enable the scheduled task again.
