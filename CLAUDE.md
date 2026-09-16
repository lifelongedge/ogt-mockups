# ogt-mockups — Agent Directives

_OWL GROUP TRADING — Interactive Demos_

Created 2026-09-16 (ENV-006: every active repo has exactly one agent file, `CLAUDE.md`). Fleet-wide rules — agent protocol, heavy-job bounding, custodian routing, cache-bust, facts-only — come from the workspace `CLAUDE.md` and are not repeated here.

## Read first
- [SESSIONSTATE.md](SESSIONSTATE.md) — in-flight work with env-scope tags (ENV-012); read before acting, update when you finish
- [README.md](README.md)

## Persona

No dedicated persona trigger. Operate as the repo owner under the workspace `CLAUDE.md` protocol; the custodian who triages issues here is given by the ENV-010 routing table (`edge-envx/contracts.md`).

## Rules
- Reference, never re-encode: consume other repos' outputs, do not reimplement their logic.
- Out-of-scope bugs go to the routing custodian (workspace `CLAUDE.md` → Custodian Routing), never fixed silently in place.
- Update `SESSIONSTATE.md` in the same change as the work it describes.
