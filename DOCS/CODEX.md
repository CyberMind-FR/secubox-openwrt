# SecuBox Codex Field Manual

**Version:** 1.0.0  
**Last Updated:** 2025-12-28  
**Status:** Active

---

## Context & Scope

SecuBox bundles fifteen+ security and network dashboards for OpenWrt with a unified build/validation toolchain and CI that ships `.ipk`/`.apk` artifacts automatically (see `README.md` for the module catalogue and CI badges, `README.md:7-34`). The documentation set is intentionally layered—`DOCS/DOCUMENTATION-INDEX.md` routes newcomers, AI assistants, and maintainers to the right depth, so always start requests there before diving into large guides (`DOCS/DOCUMENTATION-INDEX.md:15-31`).

Use this file when you need to brief Codex (or any automation agent) quickly about SecuBox expectations: what standards are immutable, how to craft prompts, where to get help, which decisions shaped today’s tree, and what TODOs should stay in sight during automation runs.

### Module & Documentation Map
- `README.md`: one-page overview, compatibility matrix, and “what’s new” callouts (`README.md:7-34`).
- `DOCS/QUICK-START.md`: critical rules, design tokens, commands, and error playbooks (`DOCS/QUICK-START.md:9-195`).
- `DOCS/DEVELOPMENT-GUIDELINES.md`: deep dive into architecture, RPCD, ubus, CSS/JS conventions, and deployment (see summary in `DOCS/DOCUMENTATION-INDEX.md:68-82`).
- `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` + `DOCS/FEATURE-REGENERATION-PROMPTS.md`: regeneration workflow plus ready-to-use prompts for all modules (`DOCS/DOCUMENTATION-INDEX.md:102-149`).
- `DOCS/CODE-TEMPLATES.md`: copy/paste-safe scaffolding for LuCI JS, RPCD scripts, and APIs (`DOCS/DOCUMENTATION-INDEX.md:153-159`).

---

## Best-Practice Snapshot

### Non-Negotiables (bake into every prompt or PR)
- RPCD filename **must** equal the ubus object (prevents `-32000 Object not found`, `DOCS/QUICK-START.md:11-18`).
- Menu JSON `path` **must** mirror the view path (avoids 404s, `DOCS/QUICK-START.md:20-26`).
- Permissions: RPCD 755, LuCI assets 644, otherwise RPCD won’t execute or LuCI returns 403 (`DOCS/QUICK-START.md:28-37`).
- Always run `./secubox-tools/validate-modules.sh` before opening PRs or tagging builds (reinforced in `README.md:18-23` and `DOCS/QUICK-START.md:122-134`).
- Keep design tokens consistent: dark palette (`#0a0a0f` base, `#6366f1→#8b5cf6` gradients), Inter + JetBrains Mono fonts, `.sh-*`/`.sb-*` components, and responsive grid widths defined in the quick start (`DOCS/QUICK-START.md:74-114`).

### Validation & Toolchain Flow
1. **Permissions Repair (local/remote):** `./secubox-tools/fix-permissions.sh --local|--remote` for automated chmod sanity (`DOCS/QUICK-START.md:55-66, 125-127`).
2. **Full Validation:** `./secubox-tools/validate-modules.sh` (runs seven structural checks including permission scan) (`DOCS/QUICK-START.md:122-134,185-189`).
3. **Module Builds:** `./secubox-tools/local-build.sh build <module>` for quick smoke tests or `make package/<module>/compile V=s` inside SDK (`DOCS/QUICK-START.md:135-143`).
4. **Deploy/Fix:** Copy to router via `scp`, normalize perms, flush `luci` caches, restart `rpcd`/`uhttpd` (`DOCS/QUICK-START.md:144-167`).
5. **Debug:** Validate ubus objects, inspect LuCI resources, and tail `logread` immediately after deployment (`DOCS/QUICK-START.md:156-167`).

### Design & UX Reminders
- Stats tiles minimum 130 px width, metrics 240 px, detail cards 300 px: encode these CSS grid rules to keep dashboards fluid on 720p+ viewports (`DOCS/QUICK-START.md:105-114`).
- Buttons, tabs, and cards expose `.sh-` utility classes; prefer gradient borders and neon states over inline styles for maintainability (same section).
- Align copy with README taxonomy (Core Control, Security & Monitoring, Network Intelligence, etc.) so documentation and UI stay in sync (`README.md:37-152` excerpt).

---

## Prompt Playbook

When drafting Codex/LLM prompts, supply enough structure so the assistant can reuse existing patterns instead of inventing them. Reuse this outline:

```text
Context:
- Target module + file(s) + desired change.
- Any relevant excerpts from CODE-TEMPLATES or existing JS/RPCD files.

Requirements:
- Restate non-negotiables (RPCD naming, menu path, permissions, design tokens).
- Mention validation commands Codex should run or assume.
- Call out API endpoints, ubus objects, or metrics to surface.

Deliverables:
- Files to touch (path + rationale).
- Expected tests/validations (e.g., run ./secubox-tools/validate-modules.sh).
- UX cues (colors, grid sizes, component classes) referencing QUICK-START.

Guardrails:
- Note TODO items or documentation standards (version headers, cross-links, etc.).
- Remind Codex where to log changes (README, module changelog, etc.).
```

Pair the template with module-specific prompts from `DOCS/FEATURE-REGENERATION-PROMPTS.md` and the workflow from `DOCS/MODULE-IMPLEMENTATION-GUIDE.md` (`DOCS/DOCUMENTATION-INDEX.md:102-149`). That combination lets Codex inherit existing layout structures, RPCD shells, and API modules without brittle guesswork.

---

## Help & Troubleshooting

- **Pre-deploy Sanity:** Run the overlay disk/permission SSH checks before copying files; they are scripted inside the quick start so you can paste directly into terminal sessions (`DOCS/QUICK-START.md:40-53`).
- **Common Error Fixes:** Keep the quick fixes near: HTTP 403 (chmod assets), “No space left” (purge `/tmp/*.ipk` and backups), ubus `-32000` (chmod 755 + ubus list). Automate via `secubox-tools` whenever possible (`DOCS/QUICK-START.md:55-70,171-180`).
- **Design Drift:** If CSS feels inconsistent, cross-check against the palette/fonts/components found in this manual and in the design section of the quick start (`DOCS/QUICK-START.md:74-114`).
- **Need Examples?:** Pull actual JS/RPCD snippets from `DOCS/CODE-TEMPLATES.md` or live modules under `luci-app-*` to keep generated code idiomatic (`DOCS/DOCUMENTATION-INDEX.md:153-159`).
- **Still Blocked?:** `DOCS/DEVELOPMENT-GUIDELINES.md` holds the long-form reasoning for every standard; cite relevant sections when escalating issues so maintainers see the source of truth quickly (`DOCS/DOCUMENTATION-INDEX.md:68-82`).

---

## History

- **2025-12-26 – Full Dev Guides Released:** README announces the arrival of the comprehensive dev guides set (README badge section, `README.md:7-16`).
- **2025-12-27 – Documentation Index v1.0.0:** Central index formalized the document map and AI workflow branches (`DOCS/DOCUMENTATION-INDEX.md:1-31`).
- **2025-12-28 – Documentation Improvement Plan:** `TODO-ANALYSE.md` generated to coordinate versioning, cross-links, and archival tasks (`TODO-ANALYSE.md:1-34,71-150`).
- **2025-12-28 – Codex Manual Drafted:** This CODEX field manual formalizes how automation agents should operate going forward.

---

## TODO Radar (keep Codex aligned)

1. **Standardize version headers & dates** – ensure every `.md` shows `Version/Last Updated/Status` with consistent `YYYY-MM-DD` formatting; DOCUMENTATION-INDEX must describe the policy once updates land (`TODO-ANALYSE.md:24-68`).
2. **Add “See Also” cross-links** – wire QUICK-START, PERMISSIONS-GUIDE, VALIDATION-GUIDE, and other quick refs back to their parent guides and vice-versa so AI/users don’t get orphaned instructions (`TODO-ANALYSE.md:71-116`).
3. **Archive historical docs** – create `docs/archive/`, move outdated references (COMPLETION_REPORT, MODULE-ENABLE-DISABLE-DESIGN, BUILD_ISSUES, etc.), and drop an archive README describing contents (`TODO-ANALYSE.md:120-153`).
4. **Future work (Monthly/Quarterly)** – new diagrams, TESTING/SECURITY/PERFORMANCE guides, automation for doc freshness, and i18n decisions are queued later in `TODO-ANALYSE.md`; mention them when prompts may impact scope or format downstream.

Codex should treat the TODOs above as guardrails: if a task touches documentation, prefer solutions that inch us toward these goals (e.g., add version headers while editing a doc, or cross-link when touching quick references).

---

## Quick Reference Checklist for Codex Runs

- [ ] Confirm the request references the right guide/template to minimize hallucinations (`DOCS/DOCUMENTATION-INDEX.md` paths).
- [ ] Copy/paste the non-negotiables + validation flow into the prompt.
- [ ] State which TODO radar items the change advances (or at least does not regress).
- [ ] Cite commands/scripts to run post-change.
- [ ] Capture findings in PR/commit descriptions referencing this CODEX manual when relevant.

Use this living manual as both a pre-flight briefing and a debrief log for automation work. Update it whenever the standards above evolve so every future Codex session starts with the correct mental model.
