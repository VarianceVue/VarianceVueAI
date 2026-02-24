# VueLogic CPM Scheduler UI — ECEPCS integration

This folder is the **VueLogic CPM Scheduler** UI (from your provided interface files). It is wired to the ECEPCS FastAPI backend.

## Backend wiring

- **`services/backendBridge.ts`** calls:
  - `POST /api/chat` for processing project data (XER/scope/specs) and for generating narratives.
  - Uses the same session as the rest of the app (`vuelogic_session_id` in localStorage).

## Build and run

1. **Install Node.js** (LTS) from https://nodejs.org/ if you don’t have it.
2. **Build the UI** (from project root):
   ```bat
   build_ui.bat
   ```
   This runs `npm install` and `npm run build` in `vuelogic-ui`, then copies the built files into `schedule_agent_web/static/`.
3. **Start the app**:
   ```bat
   run_desktop.bat
   ```
   Open http://localhost:8000 — you’ll see the VueLogic CPM Scheduler UI (login, dashboard, CPM integration, Gantt, etc.).

## Manual build

```bash
cd vuelogic-ui
npm install
npm run build
```

Then copy `vuelogic-ui/dist/*` into `schedule_agent_web/static/` so the desktop server serves this UI at `/`.
