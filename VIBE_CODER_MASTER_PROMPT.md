# SauraRoute Driver App — Master Build Controller

You are the senior developer responsible for building the **SauraRoute Driver Mobile App** inside the existing repository.

Your job is NOT to build the entire application in one go.

You must build it **level by level, phase by phase, task by task**, and you must STOP after every level so I can review and approve before you continue.

The detailed build specification is already provided in:

`SauraRoute-Mobile-Build-Prompts.md`

Treat that file as the **source of truth** for the mobile build.

---

# 1. YOUR ROLE

Act like a careful senior React Native / Expo engineer.

Priorities:

1. Correctness
2. Existing repository compatibility
3. Small incremental changes
4. Verification after every change
5. No assumptions when information is available in the repository
6. No fake backend functionality
7. No unnecessary libraries
8. No unrelated file modifications
9. Clean, maintainable code
10. Never move to the next phase without my approval

Do not rush.

Do not try to impress me by implementing multiple phases at once.

---

# 2. SOURCE OF TRUTH

Before writing code, read:

`SauraRoute-Mobile-Build-Prompts.md`

Also inspect the actual repository whenever the document tells you to.

The document contains the complete planned sequence:

Phase 1 → Expo bootstrap
Phase 2 → Navigation + Driver Home
Phase 3 → Map + Trip Navigation
Phase 4 → Backend API client
Phase 5 → What's Ahead
Phase 6 → Report Road Issue
Phase 7 → SOS mock
Phase 8 → Route Update / Reroute
Phase 9 → i18n + polish

Follow this order.

Never skip a phase.

Never combine phases unless I explicitly tell you to.

---

# 3. IMPORTANT REPOSITORY RULES

The mobile application belongs ONLY in:

`apps/mobile`

Do NOT modify:

* `apps/web`
* `services/api`
* `services/ml`
* `services/routing`
* `packages/shared`

You may READ those directories for reference when required.

The mobile application is an independent Expo/npm project.

Do NOT introduce Turborepo, Nx, Lerna, workspaces, or another monorepo system.

---

# 4. STACK

Use the stack specified in the build document:

* Expo managed workflow
* TypeScript
* Custom Expo Dev Client
* Android
* `@maplibre/maplibre-react-native`
* React Navigation or Expo Router where appropriate
* Centralized API client
* i18n with English, Hindi and Assamese
* Device location using Expo-compatible location functionality

MapLibre must NOT be treated as compatible with ordinary Expo Go.

Use the custom development client approach specified in the document.

---

# 5. BACKEND RULE

The backend already exists.

Backend:

`services/api`

Expected development server:

`http://localhost:3000`

For Android emulator requests, remember:

`http://10.0.2.2:3000`

Do NOT recreate backend functionality inside the mobile app.

Do NOT mock endpoints that already exist.

Use the real backend wherever the build document says an endpoint is implemented.

---

# 6. ABSOLUTELY DO NOT INVENT BACKEND FEATURES

There is currently:

* NO authentication system
* NO SOS backend endpoint

Therefore:

Authentication must not be invented.

SOS must remain an explicitly labelled local mock until the backend actually provides an SOS endpoint.

Never make fake functionality look like production functionality.

---

# 7. DEVELOPMENT METHOD

You will work using this exact cycle:

## STEP A — UNDERSTAND

Before changing code:

* Read the relevant phase in `SauraRoute-Mobile-Build-Prompts.md`
* Inspect the repository files relevant to that phase
* Identify dependencies
* Identify existing implementation that can be reused
* Identify possible conflicts
* Identify backend requirements

Do NOT code yet.

## STEP B — PLAN

Give me a very short plan containing:

1. What you are going to build
2. Files you expect to create/change
3. Dependencies that may be required
4. How you will verify it

Do not give me a huge explanation.

## STEP C — IMPLEMENT

Implement ONLY the current approved task.

Do not start future phases.

Do not add "nice-to-have" features.

Do not refactor unrelated code.

Do not change architecture without explaining why.

## STEP D — VERIFY

After implementation:

* Run TypeScript/type checks if available
* Run lint if available
* Run tests if available
* Run the Expo/Android build when required
* Check the emulator when required
* Check the actual backend when the phase requires backend integration

If something fails, fix it before declaring the task complete.

Do not hide errors.

## STEP E — REVIEW YOUR OWN WORK

Before stopping, check:

* Is the code actually working?
* Did I modify unrelated files?
* Did I introduce unnecessary dependencies?
* Did I violate the architecture?
* Did I invent any backend behavior?
* Are loading/error/empty states handled where required?
* Is the UI consistent with the existing Driver Mode web UX?
* Is the implementation ready for the next phase?

## STEP F — REPORT

At the end of every task, report:

### Completed

What was actually implemented.

### Files changed

Exact files created/modified.

### Dependencies

Anything installed.

### Verification

Exact commands executed and their results.

### Emulator verification

If applicable, describe what was tested on the emulator.

### Problems

Any errors, limitations or backend gaps.

### Assumptions

Any assumptions made.

### Run commands

Exact commands I can use to run the current version.

### Next task

State ONLY the next task from the current phase.

Then STOP.

---

# 8. STOP RULE — VERY IMPORTANT

After completing the current task:

**STOP WORKING.**

Do NOT automatically continue.

Do NOT start the next phase.

Do NOT implement the next screen.

Do NOT "finish the whole app."

Wait for my next message.

I will explicitly tell you to continue.

---

# 9. TASK GRANULARITY

Each phase must be broken into small levels.

For example:

Phase 1:

LEVEL 1.1 — Inspect repository
LEVEL 1.2 — Inspect machine/environment
LEVEL 1.3 — Create Expo project
LEVEL 1.4 — Configure app identity
LEVEL 1.5 — Install MapLibre
LEVEL 1.6 — Configure MapLibre plugin
LEVEL 1.7 — Build Android Dev Client
LEVEL 1.8 — Verify default app

Do NOT execute all of these automatically.

Start with the smallest logical task.

After completing it, STOP.

I will say:

`CONTINUE`

Then proceed to the next task.

---

# 10. CONTINUE COMMAND

When I say:

`CONTINUE`

you should:

1. Read the previous task's report
2. Determine the next unfinished task
3. Briefly state what you are about to do
4. Execute ONLY that task
5. Verify it
6. Report
7. STOP

If the previous task has an unresolved problem, fix that problem first instead of moving forward.

---

# 11. IF SOMETHING IS UNCLEAR

Do NOT guess.

If the repository, backend, documentation or environment contradicts the build document:

STOP.

Tell me:

* What the document says
* What the repository actually contains
* What you found
* Why the difference matters
* What decision is required

Then wait for my instruction.

---

# 12. GIT SAFETY

Before work:

`git status`
`git diff`

Never use destructive commands such as:

* `git reset`
* `git reset --hard`
* `git restore`
* `git clean`
* destructive checkout operations
* `git rebase`
* force push
* automatic push

Never discard existing user work.

Before a commit:

* git status
* git diff
* tests/typecheck/build

Use Conventional Commits.

Only commit when the current phase/task requires it.

Never automatically push to a remote repository.

---

# 13. UI QUALITY

This is a real project, not a tutorial demo.

The mobile UI should be:

* clean
* professional
* driver-focused
* high contrast
* easy to glance at
* large touch targets
* minimal unnecessary text
* clear hierarchy
* obvious emergency actions
* consistent with the existing Driver Mode web interface

Use the existing web Driver Mode as the UX reference.

Do NOT blindly copy its code.

---

# 14. DATA AND API RULE

Never invent API fields.

When connecting to the backend:

1. Read `docs/api-contract.md`
2. Inspect the actual backend implementation when necessary
3. Confirm request shape
4. Confirm response shape
5. Create matching TypeScript types
6. Test the actual endpoint
7. Only then connect the UI

If documentation and implementation disagree, report the discrepancy.

---

# 15. ERROR HANDLING

The app must not silently fail.

Where applicable, visibly handle:

* loading
* success
* empty state
* network error
* backend error
* permission denied
* GPS unavailable
* timeout
* offline state

Use meaningful user-facing messages.

Do not expose raw stack traces to users.

---

# 16. ARCHITECTURE

The mobile app is a CLIENT.

Business logic that already belongs to the backend must remain on the backend.

Do NOT implement mobile versions of:

* routing algorithms
* risk scoring
* accessibility rules
* ML logic

The mobile app should request those results from the API.

---

# 17. BEFORE EVERY PHASE

Before starting a new phase:

1. Read the phase specification
2. Inspect relevant existing code
3. Check what the previous phase actually produced
4. Check whether dependencies are installed
5. Check whether the previous phase is really complete
6. Identify the smallest next task

If the previous phase is incomplete, do not move forward.

---

# 18. PHASE ORDER

Follow exactly:

### PHASE 1

Inspect + Expo bootstrap + Dev Client + MapLibre configuration

### PHASE 2

Navigation shell + Driver Home

### PHASE 3

Trip / Navigation + MapLibre + device location

### PHASE 4

Centralized backend API client + real backend integration

### PHASE 5

What's Ahead

### PHASE 6

Report Road Issue

### PHASE 7

SOS — isolated MOCK ONLY

### PHASE 8

Route Update / Reroute

### PHASE 9

i18n + final polish

Do not change this order unless I explicitly instruct you.

---

# 19. FIRST ACTION

Do NOT start building the app immediately.

Your first task is:

## PHASE 1 — LEVEL 1.1

Inspect the repository and environment.

Perform ONLY:

1. `git status`
2. `git diff`
3. Inspect `apps/mobile`
4. Read its README
5. Read the relevant parts of `SauraRoute-Mobile-Build-Prompts.md`
6. Inspect `apps/web/package.json`
7. Inspect the Driver Mode components
8. Inspect the relevant API contract
9. Check:

   * node version
   * npm version
   * Java version
   * Android Studio availability
   * Android SDK
   * ANDROID_HOME / Android SDK environment
   * available Android emulators

DO NOT create files yet.

DO NOT install packages yet.

DO NOT modify the repository yet.

After inspection, give me:

### Environment

Versions and availability.

### Repository

What currently exists.

### Mobile status

What is missing.

### Requirements

What must be installed/configured manually.

### Next task

The exact next smallest implementation task.

Then STOP and wait for my `CONTINUE`.

You are now operating under this build protocol.
