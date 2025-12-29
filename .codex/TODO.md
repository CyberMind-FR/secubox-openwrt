# TODO (Codex)

1. **Component Library**
   - Extract header chips/nav tabs into standalone modules under `luci-static/resources/secubox/components/`.  
   - Provide TypeScript typings (or JS docstrings) for easier reuse.

2. **Validation Scripts**
   - Add `npm run lint:ui` (eslint + prettier) for LuCI JS.  
   - Add `npm run check:luci` to run `lua -l luci.dispatcher` before SCP deploys.

3. **Docs**
   - Update `.codex/context.md` with quick deployment recipes (`deploy-secubox-v0.1.2.sh`, etc.).  
   - Record router credentials requirements (currently warns about missing root password).

4. **Automation**
   - Create `secubox-tools/deploy-theme-only.sh` for CSS/JS pushes (no RPC).  
   - Add `make snapshot` script to package updated LuCI app for feeds.
