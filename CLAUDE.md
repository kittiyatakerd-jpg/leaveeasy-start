# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeaveEasy — an online leave-request system (พนักงานยื่นใบลา → หัวหน้าพิจารณา → บันทึกผล), built as a
weekly teaching project for ADT-RAISE Non-Degree Batch 2, Module 2 (สัปดาห์ที่ 6–9). It is intentionally
a **document-first, no-build-step** static site: plain HTML/CSS/JS, no framework, no bundler, no test suite.

**`leaveeasy-spec.md` is the source of truth** for the data model, field names, user stories, business
rules, and — critically — **which week each feature belongs to**. Read it before making non-trivial
changes; do not implement a future week's scope early (see "Weekly scope discipline" below).

## Commands

There is no build, lint, or test tooling in this repo (no test files, no linter config, `package.json`
only declares a `dev` script).

- **Local dev server:** `package.json`'s `dev` script is `serve -l 3000 .`, but this requires Node/npm,
  which may not be installed on the dev machine. When Node is unavailable, `.claude/launch.json` runs
  `python3 -m http.server` instead (port 5173) — use whichever is actually available.
- Because this is plain HTML with no bundler, pages can also be opened directly via `file://`, but the
  Firebase SDK network calls work more reliably served over `http://localhost`.
- No automated tests exist. Verify changes by loading the affected page in a browser and checking the
  console for errors.

## Architecture

### No build step, so script order is load order

Every page's `<head>` lists its own `<script defer>` tags explicitly (no bundler resolves imports).
**Order matters**: deferred scripts execute in document order, and later scripts depend on globals set by
earlier ones. The standard order is:

```
firebase-app-compat.js → firebase-firestore-compat.js → js/firebase-config.js → js/util.js → js/nav.js → js/<page>.js
```

`js/firebase-config.js` calls `firebase.initializeApp(...)` and defines the global `db` (a
`firebase.firestore()` instance) that every page script reads directly — there are no imports/exports,
everything is global.

### Firestore data model (see leaveeasy-spec.md §5 for full detail)

Collections: `users`, `leaveTypes`, `leaveRequests` (with a nested subcollection `leaveRequests/{id}/approvals`).

- Foreign keys are denormalized on purpose: e.g. `leaveRequests` stores both `requesterId` and
  `requesterName` (copied from `users`) because Firestore has no JOIN. When writing code that creates or
  edits a `leaveRequests`/`approvals` document, always populate both the id and the name field together.
- Field names are case-sensitive and must match exactly across the codebase (`status` vs `Status` would
  silently create a second field). Cross-check field names against leaveeasy-spec.md §5.2 before adding new ones.
- `status` on a leave request is one of exactly three Thai strings: `รอพิจารณา` / `อนุมัติ` / `ไม่อนุมัติ`.
  These are not internal enums — they're used verbatim in Firestore, in JS, and as CSS class suffixes
  (`.badge-รอพิจารณา` etc. in `css/style.css`), so don't translate or rename them.
- Status transitions are one-way (`รอพิจารณา` → `อนุมัติ`|`ไม่อนุมัติ`, never back), and updating status must
  only write the `status` field — never overwrite the rest of the document. Setting status to `ไม่อนุมัติ`
  requires at least one existing document in that request's `approvals` subcollection first.
- `role` on a `users` document is one of the English values `employee` / `manager` / `hr` (unlike `status`,
  this one stays in English because Security Rules in a later week key off it).

### Shared conventions

- Identifiers (variables, function names) are written in **Thai** throughout the JS files
  (e.g. `ค่าจากURL`, `แสดงตาราง`, `เวลาตอนนี้`). Match this style in this codebase rather than switching to
  English names.
- `js/util.js` holds cross-page helpers: `esc()` (HTML-escape before interpolating into innerHTML),
  `ป้ายสถานะ()` (renders a status badge, depends on the CSS class names above), `เวลาตอนนี้()` (timestamp in
  `YYYY-MM-DD HH:mm`, stored as a plain string so it sorts and displays without parsing), `ค่าจากURL()`
  (reads a `?query=param`).
- `js/nav.js` renders the top nav from a single hardcoded menu array — that's the one place to edit to
  change the site-wide menu. It also exports `showConfigWarning()` for pages to call before Firebase is configured.
- `seed.html` / `js/seed.js` is a one-off dev utility for writing the sample dataset from
  leaveeasy-spec.md §7 into Firestore. It is **not** one of the app's 5 real pages and is not linked from `nav.js`.

### Weekly scope discipline

The spec (leaveeasy-spec.md §8) gates features by week, and going out of order breaks the course's
grading checkpoints — **do not build ahead of the current week** unless explicitly asked to:

- **Week 6**: 5 pages + home, Firestore created with seed data, only the leave-requests list reads live
  data (read-only).
- **Week 7**: full CRUD against Firestore, Firebase Authentication (signup/login/logout,
  `requesterId` = the logged-in user's uid), a single rule requiring auth for all reads/writes, Firebase
  Hosting deploy.
- **Week 8**: per-role Security Rules (an `employee` can't read another employee's requests; only
  `manager`/`hr` can change status), an AI-assist button, a reviewer agent.
- **Week 9**: automated testing, bug fixes, a demo clip.

When in doubt about whether something belongs in the current week, check leaveeasy-spec.md §8 rather than
assuming.
