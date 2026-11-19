# SESSIONSTATE — ogt-mockups

> **Read this first when picking up this repo.** Git-tracked, so it travels to every
> machine on `git pull`. Env-scope tags (from edge-envx/environments.yaml):
> `[all]` · `[prod]` · `[stream]` · `[dev]` · `[chaos]` · `[win-native]` · `[cloud]`.
> A tagged item applies ONLY to those env(s). Untagged ⇒ `[all]`.
> Standard: edge-envx/sessionstate-standard.md

**Owner persona:** ogtcoursecraft (review pages) · **Last updated:** 2026-11-18, from `stream` (coaching credit mockup)

## Environment scope for this repo
- Runs on: <env tags + one line each>
- Per-machine differences: <none material | describe>

## In flight
- `[all]` **Coaching credit mockup** (2026-11-18, stream, growogtx; owner: *"give me a mockup page on github ogt mockups with the course page and how we might suggest discounts"*). `courses/coaching-credit/index.html`: course money back as credit toward Small Group Coaching: Active ($2,997/yr). Three variants switch every panel: A 10× stacking, $1,000 cap (recommended); B first course only, $500; C a $24.97 lesson 1 → $250. Panels: sales page credit callout + path, store cards, coaching checkout calculator (tick courses), library banner, purchase-email paragraph, numbers table, open decisions (variant, cap, past buyers, Observer tier). Then (owner: *"assume we have promo for say 50% or 40% or 30% off"*) a seasonal-sale selector (none / 30 / 40 / 50%) and a credit-basis toggle (list price, recommended, vs price paid): sale bar, struck-through prices, 'never on sale' coaching card, and a sale × basis table (on price paid a 50% sale halves the credit and the cap takes 4 courses). Then courses at $49 (lesson $25), and a 'Pricing direction' note (owner: maximize total revenue with the options that maximize future sales; $1,000 as 1×$1,000 / 10×$100 / 100×$10, c better long term because it touches far more people; list too small for A/B/C tests) plus 'A first-time buyer judging quality': free samples on request instead of a first-buyer discount, with panel 1b (request form + the email that delivers chapter 1). Then 'How we find the right price' (owner's reply to the partner's note): 1 A/B/C split not now (21 buyers at 3% = ~7 per price; forwarding), 2 four-question price survey, 3 $9 first course as fallback, 4 free chapter on request + follow-up (day 7 reminder at $49, day 14 one 72-hour offer alternating $29 / $19, day 30 done) as the targeted price test; panel 1c with the timeline and an example 'revenue per request' table. Then panel 0, the price survey: the invite email and form (the four standard price-sensitivity questions about one course, plus optional topics and years trading) and a results chart (four lines with the accepted band, balance point, $49 marker, hover, table) on made-up answers. Mockup only; nothing on the live site.
- `[all]` **Tortoise Capital redirect mockup** (2026-11-17, stream). `tortoise-redirect/index.html`. tortoisecapital.net (Bluehost) returns WordPress "critical error" HTTP 500 on every PHP route; static files, cPanel and webmail are up; MX on Bluehost. Proposal: static archive on an owlgrouptrading.com subdomain (name TBD, owner decision) plus a same-path 301 in Bluehost `.htaccess`. URL list from the Wayback CDX index (222 paths, 2007-03-13 to 2025-02-26) is embedded in the page. Open: subdomain name, A vs B, and getting the WP content out for the archive.
- `[all]` **Owl Group Foundations on S2 Desktop — mockup for owner review** (2026-09-23, win-native).
  `courses/owl-foundations-s2/index.html`, also published as a claude.ai artifact the same day.
  Shows the Foundations course (free course of the `owl` method pack, SD-011) as Learn-tab lessons on
  the 0.1.0 Viewer: 5 units / 19 lessons, four live sheets on real Norgate IWM + SPY bars (578 sessions,
  2024-06-03 → 2026-09-22, embedded), indicators recomputed in-page from tortoise-0.1.3 `guide.json` rules
  (production = indicators.js mirror, TD-003). Check kinds proposed beyond Tortoise's read/find/count:
  measure, place, frame, checklist, drill, journal, reflect. Owner decisions taken 2026-09-23: (1) Foundations
  is free with the pack; (2) no Ken clips in this course; (3) lesson 1.2 SPY overlay is an experiment — two
  variants to be built in this shell, owner picks. Rail now shows the real store roster (US Core 100 carries
  SPY + IWM). Sheet 8 added: phased plan + handoff boundary; full plan in
  `ogt-coursecraft/courses/owl-foundations/plan.md`. Not committed yet — push to publish on GitHub Pages.

## Recently shipped
- `[all]` 2026-11-07 PD-1082: `courses/owl-foundations-s2/build.py` drops a dead `io._open(...) if False` branch (F821, the one live finding in the workspace ruff sweep).

## Watch out
- `[all]` 2026-11-07 PD-1082: `courses/owl-foundations-s2/build.py` drops a dead `io._open(...) if False` branch (F821, the one live finding in the workspace ruff sweep).
