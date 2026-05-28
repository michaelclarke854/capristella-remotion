// Supabase Edge Function: cs-remotion-dispatch
//
// Replaces the Higgsfield seedance_2_0 call in the overnight Etsy video rollout.
// Picks up to 5 active products with no product_video_jobs row, inserts placeholder
// rows (status='generating', model='remotion'), then dispatches one GitHub Actions
// workflow_dispatch per listing — that workflow does the real Remotion render and
// updates the row when finished.
//
// Required secrets (set via supabase secrets set):
//   GITHUB_TOKEN          — fine-scoped PAT with workflow:write on the repo
//   GITHUB_OWNER          — Mike's GitHub username / org
//   GITHUB_REPO           — repo containing capristella-remotion/ + the workflow file
//                           (workflow path: .github/workflows/render-capristella-product.yml)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { db: { schema: "capristella" } }
);

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const GITHUB_OWNER = Deno.env.get("GITHUB_OWNER")!;
const GITHUB_REPO = Deno.env.get("GITHUB_REPO")!;
const WORKFLOW_FILE = "render-capristella-product.yml";
const BATCH_SIZE = 5;

Deno.serve(async () => {
  // 1. Pick the next batch of products with no product_video_jobs row.
  const { data: products, error: pickErr } = await supabase
    .from("featured_products")
    .select("listing_id, product_name, image_url, rotation_score")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .order("rotation_score", { ascending: false, nullsFirst: false })
    .limit(50);

  if (pickErr) return new Response(JSON.stringify({ error: pickErr.message }), { status: 500 });

  const { data: existing } = await supabase
    .from("product_video_jobs")
    .select("listing_id");
  const handled = new Set((existing ?? []).map((r) => r.listing_id));

  const queue = (products ?? [])
    .filter((p) => !handled.has(p.listing_id))
    .slice(0, BATCH_SIZE);

  if (queue.length === 0) {
    return Response.json({ ok: true, dispatched: 0, note: "catalog fully covered" });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const p of queue) {
    // 2. Insert placeholder row so concurrent runs skip this listing.
    const { error: insertErr } = await supabase.from("product_video_jobs").insert({
      listing_id: p.listing_id,
      product_name: p.product_name,
      source_image_url: p.image_url,
      model: "remotion",
      status: "generating",
      qa_status: "pending",
      generated_at: new Date().toISOString(),
    });

    if (insertErr) {
      results.push({ listing_id: p.listing_id, ok: false, stage: "insert", error: insertErr.message });
      continue;
    }

    // 3. Dispatch the GitHub Actions render workflow for this listing.
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            listing_id: String(p.listing_id),
            image_url: p.image_url,
            product_name: p.product_name,
          },
        }),
      }
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      await supabase
        .from("product_video_jobs")
        .update({ status: "failed", upload_error: `github_dispatch_failed: ${ghRes.status}` })
        .eq("listing_id", p.listing_id);
      results.push({ listing_id: p.listing_id, ok: false, stage: "dispatch", error: errText });
      continue;
    }

    results.push({ listing_id: p.listing_id, ok: true, stage: "dispatched" });
  }

  return Response.json({ ok: true, dispatched: results.filter((r) => r.ok).length, results });
});
