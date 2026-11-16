# CollabMeet UI/UX Revamp Plan

Full modernization plan: toolchain, design system, motion, every screen, and file map.
Work phase by phase, committing after each. Do **not** change Redux, socket, API, or server
logic unless the phase explicitly says so.

---

## Phase 0 — Toolchain modernization (do first)

The current stack (react-scripts 4, webpack 4, MUI v4) causes the OpenSSL and
`timeago.js` parse errors. Upgrading removes the root cause instead of patching it.

| Change | From | To | Why |
|---|---|---|---|
| Build tool | `react-scripts@4.0.3` | `react-scripts@5.0.1` | Webpack 5, native Node 20/24 support -> no `ERR_OSSL_EVP_UNSUPPORTED` |
| Component lib | `@material-ui/*@4` | `@mui/material@5` + `@mui/icons-material@5` + `@emotion/react` + `@emotion/styled` | Modern theming (`sx`, `styled`), better a11y |
| Styling shim | - | `@mui/styles` (temporary) | Keeps existing `makeStyles` working during migration |
| Animations | none | `framer-motion@9` | React 17-compatible motion |
| Fonts | system | `@fontsource/inter` | Consistent modern type (used in Phase 1) |
| Toasts | none | `notistack@2` | Toasts/snackbars (used in Phase 3.6) |
| Cleanup | `cross-env` + `NODE_OPTIONS` | remove | No longer needed on webpack 5 |

Keep React 17. Do NOT redesign anything in Phase 0 — app must look the same.

---

## Phase 1 — Design system (single source of truth)

Create `client/src/theme.js` + `client/src/styles/tokens.js` and wire
`<ThemeProvider><CssBaseline/></ThemeProvider>` in `index.js`.

### Color palette (light)
| Token | Hex | Use |
|---|---|---|
| primary | `#5B5FC7` | Brand |
| primary.dark | `#4A4DA8` | Hover/pressed |
| primary.subtle | `#EDEEFB` | Selected rows, chips, focus fills |
| accent | `#7C84F5` | Gradients, highlights |
| bg.default | `#F6F7FB` | App background |
| bg.paper | `#FFFFFF` | Cards/panels |
| border | `#E6E8F0` | Dividers, outlines |
| text.primary | `#111827` | Headings/body |
| text.secondary | `#6B7280` | Meta/labels |
| success | `#10B981` | Online/joined |
| warning | `#F59E0B` | Raised hand, waiting |
| error | `#EF4444` | Leave call, errors |
| info | `#3B82F6` | Info chips |

### Color palette (dark)
`bg.default #0F1115` · `paper #171A21` · `elevated #1F2430` · `border #2A2F3A`
· `text.primary #F3F4F6` · `text.secondary #9CA3AF` · `primary #7C82E8`

### Type (Inter)
`12 / 14 / 16 / 18 / 20 / 24 / 30 / 36`, weights `400/500/600/700`.

### Spacing / shape / elevation
- Spacing base 4px (4, 8, 12, 16, 24, 32, 48).
- Radii: sm 8, md 12, lg 16, xl 24, pill 999.
- Shadows: sm `0 1px 2px rgba(16,24,40,.06)`, md `0 8px 24px rgba(16,24,40,.10)`,
  lg `0 24px 48px rgba(16,24,40,.16)`, plus `glow` on primary.
- No 1–2px black borders anywhere.

### Motion tokens (`client/src/styles/motion.js`)
| Token | Value |
|---|---|
| fast | 120ms |
| base | 200ms |
| slow | 320ms |
| slower | 500ms |
| standard easing | `cubic-bezier(0.4, 0, 0.2, 1)` |
| enter easing | `cubic-bezier(0, 0, 0.2, 1)` |
| spring | `{ type: 'spring', stiffness: 380, damping: 30 }` |

Reusable variants in `client/src/styles/variants.js`: `fadeIn`, `slideUp`, `scaleIn`,
`staggerContainer`, `staggerItem`, `drawerRight`, `modalPop`, `bubblePop`, `pressable`.

---

## Phase 2 — Layout architecture

New shell `client/src/components/layout/AppShell.jsx` replaces the lone black `TopBar`.

```
+-- rail (72-240px) --+----- content (flex) -----+
| logo                | list column | main pane   |
| Chats / Calls / ... | (320px)     | (1fr)       |
| avatar + menu       |             |             |
+---------------------+-------------+-------------+
```

- Rail: icon buttons with tooltips, active indicator (animated pill via `layoutId`),
  collapsible, user avatar menu at bottom.
- Responsive: >=1200 full 3-col -> 900-1200 rail collapses to icons -> <900 list/chat
  stacked views with animated route transitions; mobile bottom nav.
- Use flex/grid with `min-height:0` + `overflow:auto`; remove all
  `calc(100vh - Npx)` / `68vh` / `80vh` hardcoding.

New: `layout/AppShell.jsx`, `layout/Sidebar.jsx`, `layout/UserMenu.jsx`.
`App.js` wraps routes in `<AnimatePresence>`.

---

## Phase 3 — Screen-by-screen redesign (with animations)

### 3.1 Auth (`views/Auth.js`)
- Desktop split: left brand pane (animated gradient mesh/logo/tagline), right glass card;
  mobile single card.
- Inputs: floating labels, 12px radius, focus ring, inline validation + helper text.
- Animations: card `scaleIn`, blobs slow float, shake on invalid submit, button spinner,
  cross-fade Sign In <-> Sign Up (`AnimatePresence` + `layout`).
- Fix footer "MyApp"; unify to primary purple.

### 3.2 Chat list (`views/Chat.js` + `components/Conversation.jsx`)
- Header: title + live search + primary "New meeting" button -> dialog (fix dead form at
  `Chat.js:172-183`).
- Row: avatar (initials, hashed color), name, last-message preview, relative timestamp,
  unread dot, active row state with animated left indicator (`layoutId`).
- Animations: stagger on load, hover lift, skeleton shimmer, empty-state fade, press scale.
- Optional backend: add `lastMessage`/`lastMessageAt` (Phase 8).

### 3.3 Chat window (`views/Chat.js`, `Message.jsx`, `ChatTopBar.jsx`)
- Header: avatar + name + presence, call actions, overflow menu, sticky.
- Messages: flex column (remove `float` in `Message.jsx:14`); own = primary bubble right,
  others = surface bubble left; grouped consecutive, day separators, avatar on first of group.
- Animations: `bubblePop`, smooth auto-scroll, typing indicator, day-separator fade.
- Composer: rounded pill, auto-grow, inline send (morph to loading->sent), Enter-to-send.
- States: skeleton, empty, error + retry.

### 3.4 Video call (`views/VideoCall.js`)
- Dark stage (`#0F1115`): speaker tile + self-view PiP, participant grid.
- Floating translucent control dock (blur): mic, cam, share, hand, chat, people, leave.
- Name pills as overlay badges; remove black-bordered absolute Typography
  (`VideoCall.js:29-35`). Fix `Grid container xs={12}` misuse (`VideoCall.js:62-63`).
- Join screen + waiting state with pulsing rings.
- Animations: tile enter/layout reflow, PiP drag spring, icon cross-fade, hand pulse,
  dock slide-up, leave glow.

### 3.5 In-call side panels (`components/Chat.jsx`, `Participants.jsx`)
- Unify into ONE right drawer with tabs Chat / People (fix overlapping absolute panels).
  Drawer slides in, overlay fade, close on Esc/backdrop.
- Chat tab reuses redesigned Message + pill composer.
- People tab: avatar + name + role + raised-hand chip; empty state.

### 3.6 Notifications (`components/Notifications.jsx`)
- Incoming-call modal: pulsing avatar rings, Answer/Decline, ringtone (`ding.mp3`).
- Global toasts via `notistack`: link copied, waiting for host, call full, errors.
- Animations: `modalPop`, toast slide, decline shake.

### 3.7 Shell (`components/TopBar.jsx` -> absorbed into AppShell)
- Slim translucent header, logo + wordmark "CollabMeet" (fix "CollabMate" typo),
  avatar dropdown (Profile / Theme / Logout) with menu animation.

---

## Phase 4 — Animation system summary

| Interaction | Animation |
|---|---|
| Route change | fade + slight slide (`AnimatePresence`) |
| Lists | staggered fade/slide up |
| Message send/receive | bubble pop + smooth scroll |
| Buttons | press scale 0.97, hover lift |
| Drawer/dialog | slide or scale+fade with backdrop |
| Hand raise / incoming call | pulse rings |
| Loading | MUI Skeleton + shimmer |
| Theme toggle | CSS variable cross-fade |
| Icon toggles | rotate/cross-fade |
| Active/reorder | shared-layout morph (`layoutId`) |

Honor `prefers-reduced-motion`.

---

## Phase 5 — UX improvements

- Feedback: spinners/skeletons, success toasts, inline validation, disabled/busy buttons.
- Empty & error states everywhere.
- Keyboard: Enter send, Shift+Enter newline, Esc closes, `/` focus search.
- Confirmations for destructive actions (leave call, logout).
- Auto behaviors: scroll-to-bottom, focus composer, persist selected chat, unread indicators.
- A11y: aria-labels, focus-visible rings, contrast-checked palette, keyboard nav,
  reduced motion.
- Fix: `index.js` `./reducers` -> `./reducer`; hardcoded `/MS-Teams-Clone#/video-call/`
  in `ChatTopBar.jsx:38` -> origin/router based.

---

## Phase 6 — Responsive + dark mode

- Breakpoints 1200 / 900 / 600; mobile bottom nav + list/chat views; condensed call dock.
- Dark mode via toggle + `prefers-color-scheme`, persisted in `localStorage`; all colors
  from tokens; ~200ms theme transition.

---

## Phase 7 — File change map

**New**
`src/theme.js`, `src/styles/tokens.js`, `src/styles/motion.js`, `src/styles/variants.js`,
`src/components/layout/AppShell.jsx`, `Sidebar.jsx`, `UserMenu.jsx`,
`src/components/ui/` (Avatar, ToastHost, ConfirmDialog, EmptyState, SkeletonList,
IconButtonStyled).

**Rewrite**
`index.js`, `App.js`, `index.css`, `TopBar.jsx`, `views/Auth.js`, `views/Chat.js`,
`views/VideoCall.js`, `components/Conversation.jsx`, `Message.jsx`, `ChatTopBar.jsx`,
`components/Chat.jsx`, `Participants.jsx`, `CallSettings.jsx`, `Notifications.jsx`,
`Input.jsx`.

**Untouched (logic)**: `SocketContext.js`, `actions/*`, `reducer/*`, `api/*`, `server/*`
(except optional Phase 8).

---

## Phase 8 — Optional backend polish

- `Conversation`: add `lastMessage`, `lastMessageAt`; populate in `GET /api/conversations`.
- Return populated messages to reduce round-trips.
- Fix auth routes' missing `return` after error responses (`routes/auth.js`).

---

## Phase 9 — Roadmap (estimates)

| Phase | Deliverable | Effort |
|---|---|---|
| 0 | Toolchain upgraded, builds clean | 0.5-1 d |
| 1 | Theme, tokens, motion, fonts, CssBaseline | 0.5 d |
| 2 | AppShell + responsive layout | 0.5-1 d |
| 3.1 | Auth redesign | 0.5 d |
| 3.2-3.3 | Chat list + chat window | 1.5 d |
| 3.4 | Video call stage | 1-1.5 d |
| 3.5-3.6 | Drawers + notifications/toasts | 1 d |
| 4-6 | Animation/a11y/dark/responsive polish | 1-1.5 d |
| QA | QA + build | 0.5 d |

---

## Phase 10 — Acceptance criteria

- `npm run build` clean; `npm start` no compile errors.
- Full flow works: signup/login -> create meeting -> send/receive (two tabs) -> join call
  -> screen share -> raise hand -> leave.
- Layout correct at 1440 / 1024 / 768 / 375 px; light + dark; reduced-motion on/off.
- No hardcoded hex left in components (all via theme/tokens).
- Keyboard-only walkthrough passes; aria-labels on all icon buttons.
- Lighthouse a11y >= 95 (target).

---

## Risks & mitigations

- MUI v4->v5 touches every component: migrate imports in one pass, verify build, then restyle.
- react-scripts 4->5 may surface new warnings: upgrade first, fix build, then restyle.
- Animation overuse: keep durations <=320ms, honor reduced-motion.
