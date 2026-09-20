#!/usr/bin/env python3
"""
add_origin_loom_boxes.py — inject Origin Loom cross-sell boxes into The Yarn pages.

Idempotent: skips pages already containing the 'origin-loom-box' marker.
Renders a box ONLY when the matched mapping has a real Payhip slug (non-null).
With all-null slugs (Day-1 state) this script is a safe dry structure: it
reports what WOULD match so the map can be tuned before slugs land (Day 4).

Usage:
  python3 add_origin_loom_boxes.py --site /home/Drevik/vault/Affiliate/site
  python3 add_origin_loom_boxes.py --site ... --dry-run
  python3 add_origin_loom_boxes.py --site ... --force-visible   # ignore null slugs (testing only)

Run as Drevik (cron user). Chown not needed if run as Drevik.
"""

import argparse
import json
import re
import sys
from pathlib import Path

MARKER = "origin-loom-box"
BOX_TEMPLATE = """
<aside class="origin-loom-box" data-product="{product}">
  <div class="loom-box-inner">
    <span class="loom-badge">FROM THE YARN WORKSHOP</span>
    <h4>{title}</h4>
    <p>{blurb}</p>
    <a href="https://payhip.com/b/{slug}" class="loom-cta" rel="nofollow sponsored">Get it on Origin Loom &rarr;</a>
  </div>
</aside>
"""

TITLE_OVERRIDES = {
    "devops-llm-prompt-library": "The LLM Prompt Library",
    "humanization-toolkit": "The Humanization Toolkit",
    "youtube-gap-method": "The YouTube Gap Method",
    "dnd-oneshot-collection-vol1": "One-Shot Collection Vol. 1",
}


def load_map(path):
    data = json.loads(Path(path).read_text())
    return data["mappings"]


def match_mapping(dir_name, mappings):
    low = dir_name.lower()
    for m in mappings:
        if any(k in low for k in m["match_any"]):
            return m
    return None


def build_box(mapping, force_visible):
    slug = mapping.get("slug")
    if not slug and not force_visible:
        return None
    title = TITLE_OVERRIDES.get(mapping["product"], mapping["product"])
    return BOX_TEMPLATE.format(
        product=mapping["product"], title=title,
        blurb=mapping["blurb"], slug=slug or "SLUG_PENDING")


def insertion_point(html):
    """Prefer before </article>; fall back to before <footer."""
    for marker in ("</article>", "<footer"):
        idx = html.rfind(marker)
        if idx > 0:
            return idx
    return -1


def process_page(path, mappings, dry_run, force_visible):
    html = path.read_text()
    if MARKER in html:
        return "skip-marked"
    dir_name = path.parent.name
    m = match_mapping(dir_name, mappings)
    if not m:
        return "no-match"
    box = build_box(m, force_visible)
    idx = insertion_point(html)
    if idx < 0:
        return "no-insert-point"
    if dry_run:
        return f"would-insert ({m['product']}, slug={m.get('slug')})"
    new_html = html[:idx] + box + html[idx:]
    path.write_text(new_html)
    return "inserted"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True)
    ap.add_argument("--map", default=str(Path(__file__).parent / "origin_loom_map.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force-visible", action="store_true",
                    help="Render even with null slugs (SLUG_PENDING) — testing only")
    args = ap.parse_args()

    site = Path(args.site)
    mappings = load_map(args.map)
    counts = {}
    for page in sorted(site.glob("*/index.html")):
        res = process_page(page, mappings, args.dry_run, args.force_visible)
        counts[res] = counts.get(res, 0) + 1
    for k, v in sorted(counts.items()):
        print(f"{k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())