# SauraRoute Driver App — Phase-by-Phase Build Prompts

This is a ready-to-use set of prompts for an AI coding agent (Claude Code, Cursor, etc.) working inside the `team-saura-sih26002` repo. I cloned the repo and read it before writing this, so the plan is based on what's actually there today, not on assumptions.

---

## 0. What's actually in the repo right now

- **`apps/mobile` is empty** — just a README saying "React Native, PLANNED, scaffolding only." No project has been started.
- **There is no monorepo tool.** No root `package.json`, no Turborepo/Nx/Lerna config. `apps/web` and `services/api` are two independent npm projects. The mobile app will be a **third, independent** npm/Expo project — not a workspace package.
- **`packages/shared` has no code**, only a README describing what it's *meant* to hold. There is nothing to actually import yet. The real API types currently live in `apps/web/src/types/api.ts`.
- **A full "Driver Mode" already exists — as a web view**, not a separate app: `apps/web/src/components/driver/` (`DriverMode.tsx`, `DriverHeader`, `DriverEtaBar`, `DriverManeuverCard`, `DriverNavigationCard`, `DriverRouteSummary`, `DriverSafetyBanner`, `DriverSafetyStatus`, `DriverBottomNav`, `DriverTripStart`). This is the UX reference the mobile app should feel consistent with.
- **Backend is real and running on `http://localhost:3000`** (Node/Express/TypeScript, `services/api`). Per `docs/api-contract.md`, these endpoints are implemented and working: `GET /api/health`, `GET /api/weather`, `GET/POST /api/incidents`, `PATCH /api/incidents/:id/status`, `GET /api/routes`, `POST /api/routes/optimize`, `POST /api/routes/reroute`, `GET /api/risk/point`, `GET /api/risk/route`, `GET /api/risk/zones`, `GET/POST /api/accessibility`, `PATCH /api/accessibility/:id/status`, `GET /api/alerts`.
- **There is no SOS endpoint anywhere in the backend.** The Phase-5 build doc that came with this project assumes one exists — it doesn't. This has to be built as a mock on the mobile side and flagged, not invented as if it were real.
- **There is no authentication.** The root README explicitly lists it as "Planned (later step)."
- Web app dependencies are React 19, TypeScript, `maplibre-gl`, `i18next`/`react-i18next` with `en`/`hi`/`as` translation files already written (`apps/web/src/i18n/`). The mobile app should reuse the same three languages.
- Setup scripts (`scripts/setup.ps1`, `start.ps1`) are **PowerShell/Windows-oriented**. If you're on macOS/Linux, the agent will need to start `services/api` manually (`cd services/api && npm run dev`) rather than relying on those scripts.

## 1. Decisions this plan locks in

You asked for **Expo (managed)** and **MapLibre React Native** for map parity with the web app. Those two answers actually conflict a little, so here's the resolution:

- **MapLibre React Native is a native module — it cannot run inside the plain "Expo Go" app** from the Play Store.
- The fix that keeps you inside Expo tooling (no full "bare" ejection, still use `app.json`/config plugins, still use `npx expo`) is: **Expo managed workflow + a custom Expo Dev Client.** You still get Expo's fast iteration and simple config; you just install your own dev-client build on the emulator once (via `npx expo run:android`) instead of using the generic Expo Go app. Every phase below assumes this setup.
- **Platform:** Android only for now, matching what you specified (Android Studio + emulator). iOS is not addressed.

## 2. How to use this document

1. Start a fresh Claude Code session **inside your local clone** of the repo.
2. Paste the **Ground Rules** block below once, at the start of the session.
3. Paste **Phase 1**. Let the agent finish and stop. Review the diff yourself (or have it summarized) before continuing.
4. Paste **Phase 2**, then **Phase 3**, and so on — one phase per message, in order. Don't paste two phases at once; the agent is instructed to stop after each one specifically so you stay in control.
5. If a phase's agent output disagrees with something stated here (e.g., it discovers Android Studio isn't installed, or an endpoint behaves differently than documented), let it stop and report rather than pushing through.

---

## GROUND RULES (paste this once, before Phase 1)

```
You are working in the existing "team-saura-sih26002" monorepo (SauraRoute, SIH26002).
You will build ONLY apps/mobile in this session, phase by phase, across multiple messages.
Do not touch apps/web, services/api, services/ml, services/routing, or packages/shared
except to read them for reference.

REPO REALITY (confirmed by inspection, don't re-derive or second-guess this):
- apps/mobile currently contains only a README. Nothing is scaffolded.
- There is no monorepo tool and no root package.json. apps/mobile will be its own
  standalone Expo/npm project, sibling to apps/web and services/api, not a workspace member.
- packages/shared has no actual code, only a README. Do not try to import from it.
  If you want shared types, copy/adapt them from apps/web/src/types/api.ts into
  apps/mobile's own types folder, and note that as a duplication to reconcile later.
- The backend (services/api) runs on http://localhost:3000 and is real — call it, don't
  mock it, for any endpoint documented as IMPLEMENTED in docs/api-contract.md.
- There is NO SOS endpoint in the backend and NO authentication anywhere in the system.
  Never write code that pretends either of these exists on the server. Any SOS or auth
  behavior must be an explicitly-labeled local mock, isolated in its own file/module,
  and you must say so out loud in your phase report.
- apps/web/src/components/driver/ is a working "Driver Mode" web UI already built for
  this product. Treat it as the UX/interaction reference for the mobile app's driver
  screens (information hierarchy, states, copy), not as code to literally port.

STACK FOR apps/mobile:
- Expo (managed workflow) with TypeScript, using a custom Expo Dev Client
  (npx expo run:android) — NOT plain Expo Go — because the map library needs native code.
- Map: @maplibre/maplibre-react-native (requires the config plugin + dev client rebuild;
  it will not run in the stock Expo Go app — do not try to make it work there).
- i18n: match the web app's three languages (English, Hindi, Assamese) — see
  apps/web/src/i18n/{en,hi,as}.json for the existing strings/keys to reuse or mirror.
- Networking: a single centralized API client module. No fetch() calls scattered in screens.
- Android emulator note: the emulator cannot reach the host machine via "localhost".
  Use http://10.0.2.2:3000 as the API base URL for emulator builds, and make this
  configurable (env var or config file) for real-device testing on the same LAN.

ARCHITECTURE RULE:
The mobile app is a CLIENT ONLY. Never re-implement routing, risk scoring, accessibility
rules, or ML logic on the mobile side — all of that stays server-side and is called
through the API client.

GIT RULES (hard constraints, no exceptions):
- Before any work: `git status` and `git diff`.
- Never run: git reset, git reset --hard, git restore (to discard), git checkout (to
  discard), git clean, git rebase, git commit --amend, force push, or any automatic push.
- Never touch unrelated files or rewrite existing history.
- Use strict Conventional Commits (feat:, fix:, chore:, docs:, test:, etc.), one logical
  commit per phase (or per sub-step if a phase is large).
- Before every commit: git status, git diff, run whatever test/build/typecheck commands
  exist for apps/mobile.
- After every commit: git status, git log -1 --oneline, list changed files, report
  test/build results, then STOP and wait for the next phase prompt. Do not proceed to
  the next phase on your own initiative.

REPORTING RULE:
At the end of every phase, explicitly report: (1) what you built, (2) what you verified
running (and how — emulator screenshot description, command output, etc.), (3) any
assumption you made, (4) any backend gap or repo inconsistency you hit, (5) exact
commands to run it yourself.
```

---

## PHASE 1 — Inspect, then bootstrap the Expo project

```
PHASE 1 ONLY. Do not start Phase 2 content.

Step A — Inspect before touching anything:
1. git status && git diff
2. List apps/mobile (confirm it's just the README) and read that README.
3. Read apps/web/package.json and skim apps/web/src/components/driver/*.tsx for UX reference.
4. Read docs/api-contract.md sections relevant to Driver functionality (routes, routes/optimize,
   routes/reroute, risk, accessibility, alerts, incidents).
5. Check what's already installed on this machine: node -v, npm -v, java -version,
   whether Android Studio / an Android SDK / ANDROID_HOME is configured, and whether any
   Android emulator (AVD) already exists (`emulator -list-avds` if the `emulator` command
   exists). Report exactly what's missing — do not attempt to silently install Android
   Studio itself (it's a GUI installer); tell me precisely what I need to install by hand,
   and install only what's genuinely CLI-automatable (Node packages, Expo CLI, EAS CLI if
   needed).

Step B — Bootstrap:
1. From the repo root, create the Expo project inside apps/mobile using the TypeScript
   template (`npx create-expo-app@latest apps/mobile --template` with the TS blank template,
   or equivalent — pick current best-practice Expo TS scaffolding and say which command
   you used and why).
2. Set the app name/slug to reflect SauraRoute Driver.
3. Install @maplibre/maplibre-react-native and add its Expo config plugin to app.json/app.config,
   per MapLibre's official Expo setup docs. Do not attempt to render a map yet — that's Phase 3.
   Just get the plugin correctly configured so the dev-client build succeeds.
4. Build and install the custom dev client on an Android emulator:
   `npx expo run:android` (this will fail loudly and clearly if Android SDK/emulator aren't
   set up — if so, stop, report exactly what's missing, and wait for me rather than guessing).
5. Confirm the default screen boots in the dev client.

Step C — Report:
- Exact Node/Expo/Java versions used.
- Exact commands to reproduce the boot from a clean machine.
- Screenshot description or emulator log confirming the app launched.
- Whatever is still missing on my machine that I need to install myself.

Then commit (`feat(mobile): bootstrap expo dev-client project with maplibre plugin`),
follow the Git Rules reporting steps, and STOP.
```

---

## PHASE 2 — Navigation shell + Driver Home screen

```
PHASE 2 ONLY.

Goal: app-wide navigation structure, and the first real screen — Driver Home.

1. Add React Navigation (or Expo Router, your call — state which and why) with a simple
   stack: Driver Home → Trip/Navigation → What's Ahead → Report Road Issue → SOS →
   Route Update. Don't build the destination screens yet, just routes/placeholders.
2. Establish a small design system module first: colors, spacing, and type scale as
   constants (not a full theme library) — optimized for a driver glancing at the screen
   in motion: large touch targets, high contrast, minimal text. Look at
   apps/web/src/components/driver/DriverHeader.tsx and DriverBottomNav.tsx for the
   information hierarchy already established on web, and keep the mobile version
   consistent in *meaning*, not necessarily identical in pixels.
3. Build the Driver Home screen with:
   - Current trip status (empty state when there's no active trip)
   - "Start Trip" action (can just navigate to a stub Trip screen for now — real trip
     start logic comes in Phase 4 once the API client exists)
   - Route summary placeholder
   - Risk/accessibility status placeholder
   Use realistic placeholder data clearly marked as such (a constant, not a fetch),
   since the API client doesn't exist until Phase 4.
4. Add bottom navigation matching DriverBottomNav.tsx's set of destinations conceptually.

Verify on the emulator dev-client build from Phase 1, screenshot/describe the result,
commit (`feat(mobile): add navigation shell and driver home screen`), report, and STOP.
```

---

## PHASE 3 — Trip / Navigation screen with the map

```
PHASE 3 ONLY.

Goal: the map-based Trip screen, still with placeholder route data (real data arrives
in Phase 4).

1. Implement the MapLibre map view on the Trip/Navigation screen: initial camera over
   the Guwahati–Shillong corridor (the prototype's demo route, per the project
   description — origin ~26.1445, 91.7362, destination ~25.5788, 91.8933) as a
   reasonable default center, not a hardcoded destination.
2. Render a static placeholder route line (LineString) and origin/destination markers,
   using dummy coordinates shaped exactly like what /api/routes and /api/routes/optimize
   actually return (see docs/api-contract.md) so swapping in real data in Phase 4 is a
   drop-in change, not a rewrite.
3. Add the surrounding chrome: ETA/distance bar, next-maneuver card, route progress
   indicator, hazard-warning slot, accessibility-status slot — as UI only, fed by the
   same placeholder data object. Mirror DriverEtaBar.tsx, DriverManeuverCard.tsx,
   DriverNavigationCard.tsx, DriverSafetyBanner.tsx, DriverSafetyStatus.tsx from the web
   app for what information belongs in each element.
4. Request device location permission (expo-location) and show the user's live position
   as a marker if permission is granted. Handle: permission denied, GPS unavailable,
   loading, and no-network states explicitly with visible UI states — do not silently
   fail. If you simulate movement for demo purposes, isolate that simulation in one
   clearly-named module/file that is trivial to delete, and never present simulated
   coordinates as if they were live GPS in the UI copy.

Verify on-device/emulator, commit (`feat(mobile): add map-based trip screen with device
location`), report exactly what you tested and how, and STOP.
```

---

## PHASE 4 — Centralized backend API client

```
PHASE 4 ONLY.

Goal: one real, typed API layer — this is what turns every placeholder from Phases 2–3
into real data.

1. Create a single API client module (e.g. apps/mobile/src/api/) with one function per
   backend endpoint actually needed by the driver app:
   - getRoute / getOptimizedRoute -> GET /api/routes, POST /api/routes/optimize
   - getReroute -> POST /api/routes/reroute
   - getRouteRisk -> POST /api/risk/route
   - getPointRisk -> GET /api/risk/point (if needed for "What's Ahead" in Phase 5)
   - getAccessibility -> GET /api/accessibility
   - getAlerts -> GET /api/alerts
   - getWeather -> GET /api/weather
   - createIncident / listIncidents -> POST and GET /api/incidents
   Base every request/response TypeScript type on the exact shapes documented in
   docs/api-contract.md (adapt from apps/web/src/types/api.ts where the shape matches;
   do not invent fields the backend doesn't return).
2. Base URL must be configurable: default to http://10.0.2.2:3000 for the Android
   emulator, overridable via an env/config value for real-device LAN testing. Document
   both in a short README inside apps/mobile.
3. Centralize error handling: network unreachable, non-2xx response, timeout — each as
   a distinct, typed result the UI can branch on, not a thrown string.
4. Wire this into the Driver Home and Trip screens from Phases 2–3, replacing the
   placeholder data with real calls. Handle loading and error states visibly.
5. Before doing anything else in this phase, actually start the backend
   (`cd services/api && npm run dev`, confirm `GET /api/health` responds) so you can
   verify these calls for real rather than assuming shapes match the docs.

Verify against the running backend, commit (`feat(mobile): add backend API client and
wire it into driver home and trip screens`), report which endpoints you hit and what
they actually returned, and STOP.
```

---

## PHASE 5 — What's Ahead screen

```
PHASE 5 ONLY.

Goal: the "What's Ahead" screen — hazards, restrictions, and reported incidents near
the driver's current position on the active route, with clear distance/context.

1. Using the API client from Phase 4, combine GET /api/accessibility (for
   RESTRICTED/CLOSED corridors), GET /api/alerts (for active ROAD_CLOSURE/
   ROAD_RESTRICTION alerts), and GET /api/incidents (for reported incidents) into one
   screen, filtered/sorted by proximity to the driver's current location or route
   progress.
2. Each item should show: what it is, how far ahead, and severity (reuse the
   CRITICAL/WARNING vocabulary already used in the backend's alert model — don't invent
   a different severity scale).
3. Empty state: when nothing is ahead, say so plainly rather than showing a blank screen.
4. Keep this screen read-only — no actions here beyond viewing (reporting is Phase 6).

Verify against the live backend, commit (`feat(mobile): add what's ahead hazard and
accessibility screen`), report, and STOP.
```

---

## PHASE 6 — Report Road Issue

```
PHASE 6 ONLY.

Goal: let the driver report a road issue, hitting the REAL, already-working
POST /api/incidents endpoint.

1. Build a form: issue type (Landslide, Fallen Rocks — match the values the backend's
   incident `type` field actually accepts; check services/api source if the two listed
   types aren't the full enum), description, location (auto-filled from device GPS,
   editable/confirmable by the driver), timestamp (auto), and a photo attachment if
   `POST /api/incidents` supports it — check the actual backend implementation; if photo
   upload isn't actually wired up server-side, don't fake a working upload, disable or
   omit that part and say so.
2. Submit to POST /api/incidents via the Phase 4 API client. Show explicit success and
   failure states, including offline/network-failure handling (queue-and-retry is a fine
   stretch goal, but don't claim offline queuing works unless you actually build and
   test it in this phase).
3. On success, offer a way back to Driver Home or What's Ahead.

Verify by actually submitting an incident and confirming it appears via GET /api/incidents,
commit (`feat(mobile): add report road issue screen`), report, and STOP.
```

---

## PHASE 7 — SOS (backend gap, mock only)

```
PHASE 7 ONLY.

IMPORTANT CONTEXT: there is no SOS endpoint anywhere in services/api. Confirm this
yourself by searching the backend source and docs/api-contract.md before writing any
code. Do not invent a fake production implementation.

1. Build the SOS screen UI: a prominent, hard-to-miss SOS action, a confirmation step
   (to avoid accidental triggers), and a payload preview showing location, timestamp,
   and vehicle/driver context that would be sent.
2. Implement submission against a clearly isolated MOCK adapter (e.g.
   apps/mobile/src/api/sos.mock.ts), never mixed into the real API client module from
   Phase 4. The mock should simulate a network call (latency + success/failure) so the
   UI states are real, but the module name, a code comment, and the on-screen copy must
   make it unambiguous to anyone reading the code or using the app that this does not
   reach a real backend yet.
3. Write down, in apps/mobile/README.md or a new docs note, exactly what a real
   POST /api/sos (or similar) endpoint would need to accept for this screen to be wired
   up for real — this becomes a concrete, scoped ask for whoever owns services/api next.

Verify the mock flow end-to-end on the emulator, commit (`feat(mobile): add SOS screen
with isolated mock backend adapter (no real SOS API exists yet)`), report clearly that
this is mock-only and why, and STOP.
```

---

## PHASE 8 — Route Update / Reroute

```
PHASE 8 ONLY.

Goal: surface backend-driven reroute recommendations to the driver.

1. Call POST /api/routes/reroute (via the Phase 4 API client) with the driver's current
   route, on a reasonable polling interval or triggered by relevant state changes
   (don't hammer the backend on every location tick).
2. When `rerouteRecommended: true` comes back, show a distinct "Route Update" UI state
   (not the normal Trip screen) that explains what changed (use the `reason` and
   `metrics` fields from the actual response shape in docs/api-contract.md), shows the
   updated ETA/distance, and lets the driver accept the new route or keep the current one.
3. On accept, swap the active route data used by the Trip screen from Phase 3 with the
   `recommendedRoute` from the response.

Verify against the live backend (you may need to seed a CLOSED/RESTRICTED corridor via
POST /api/accessibility first to actually trigger a reroute recommendation — check
docs/api-contract.md section 9 for the request shape), commit (`feat(mobile): add route
update / reroute screen`), report exactly how you triggered and verified it, and STOP.
```

---

## PHASE 9 — i18n and polish (do this last, and only after 1–8 are approved)

```
PHASE 9 ONLY.

1. Add react-i18next (or expo-localization + i18next) supporting English, Hindi, and
   Assamese, reusing the existing keys/strings from apps/web/src/i18n/{en,hi,as}.json
   wherever the same concept appears in the mobile app, rather than re-translating from
   scratch. Keep any mobile-only strings in a mobile-specific namespace.
2. Add a language switcher, consistent with apps/web/src/components/LanguageSwitcher.tsx.
3. Pass over all screens built in Phases 2–8 for consistent spacing, touch-target size,
   and contrast per the original UX requirements (large touch targets, high contrast,
   minimal text, obvious emergency action).
4. Do not add anything not already built in a prior phase — this phase is about
   consistency, not new features.

Commit (`feat(mobile): add multilingual support and UI polish pass`), report, and STOP.
```

---

## Appendix — gaps you will hit, and how to talk about them honestly

- **SOS has no backend.** Phase 7 handles this with an explicit mock; don't let a later
  phase quietly start treating it as real.
- **No auth.** Every phase above assumes an unauthenticated driver session, matching the
  actual state of the backend. If auth gets added to `services/api` later, the mobile
  API client in Phase 4 is the one place that will need to change.
- **`packages/shared` is a placeholder.** Types are duplicated between `apps/web` and
  `apps/mobile` for now. Worth a follow-up ticket to actually build that shared package
  once both frontends stabilize — not something to solve inside this mobile build.
- **Setup scripts are Windows/PowerShell-only.** On macOS/Linux, start `services/api`
  manually with `npm run dev` from that folder; don't rely on `scripts/*.ps1`.
- **The root README's tech-stack table says the web app uses TailwindCSS**, but
  `apps/web/package.json` has no Tailwind dependency — it appears to be hand-written CSS
  (`apps/web/src/index.css`). Worth a quick sanity check with whoever wrote that README,
  but it doesn't block the mobile build either way.
