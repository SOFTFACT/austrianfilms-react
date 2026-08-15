# CLAUDE.md — AustrianFilms React Backoffice

React + TypeScript frontend for **AustrianFilms** (4D film-industry database).

**Lives OUTSIDE the 4D project — its own Git repo.** Sister of `ecoline-react`
and `mds-praxis-react`, built on the shared **API4D** auth component.

Before starting, read `../4d-claude-standards/CLAUDE-REACT.md` — the frontend
rules shared across the fleet: error handling, auth failures, the supported-
browser floor and the test policy. They are behaviour rules rather than shared
code, so they hold here whether or not this project consumes
`@softfact/api4d-react`.


```
~/Documents/GitHub/
├── AustrianFilms/          ← 4D backend + REST API (:8181)
└── austrianfilms-react/    ← THIS PROJECT
```

> **Why separate?** node_modules, sources and sourcemaps must never end up
> inside the 4D project. The frontend ships as its own static bundle.

## Stack
- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`)
- React Router 7 · TanStack Query (+ react-virtual)
- `fetch` only — shared API4D client, no axios
- Exports: `write-excel-file` (XLSX) + `jspdf`/`jspdf-autotable` (PDF)

## Dev
```bash
npm install
npm run dev     # Vite :5181, proxies /api + /mcp + /getimage + /flags → 4D :8181
```

## Backend / Auth
AustrianFilms REST API at `/api/v1` on port **8181**. Log in as `designer`
(admin/MCP account; mutating `/admin/*` routes require the "Designer" group).

Auth lives in `src/lib/api4d/` (shared component layer):
- single JWT **Bearer** + rotating refresh token
- stored in `localStorage` under the `austrianfilms` prefix →
  `austrianfilms_token`, `_user`, `_expires_at`, `_refresh_token`
- RFC 7807 problem bodies surfaced via `ApiError.detail`
- terminal 401 → `forceLogout()` → redirect `/login`

## Deployment — Caddy
Caddy on the Windows prod box (`app.af.softfact.com`) serves the static build
and proxies `/api` + `/mcp` + `/getimage` to the 4D server on `localhost:8181`.

```bash
npm run deploy   # build → zip → reveal in Finder (scripts/deploy.mjs)
```

Transfer `austrianfilms-react-dist.zip` via TeamViewer/RDP and unzip into
`C:\Caddy\austrianfilms-react`.

## Structure
```
src/
  lib/api4d/   shared auth + client layer (client, AuthContext, ApiHealth, config)
  lib/utils.ts cn() helper · exportTable.ts · fetchAllPages.ts · format.ts
  api/         one file per resource — films, festivals, itineraries, persons, auth, llm
  hooks/       TanStack Query wrappers + filter/form state
  components/  Layout, LoginPage, list/detail pages, modals, filter panels
  components/ui/  shadcn/ui primitives (own code, Radix-based)
  contexts/    theme.ts (+ ThemeContext/useTheme) — light/dark switch
  types/       domain types — film, festival, itinerary, person
```

## Conventions
- Components PascalCase · API modules + hooks camelCase
- Path alias `@/` → `src/`
- English for code, comments and UI strings (matches the 4D project)
- **No `Co-Authored-By`** in commits

## UI / Styling — shadcn/ui is the component system

**Binding baseline (decision 2026-07-23):**

- **shadcn/ui** (style `new-york`, base color `neutral`) is the **only**
  component system. Primitives live as own code in `src/components/ui/`
  (Radix-based). Configuration: `components.json`.
- **Semantic CSS-variable tokens** in `src/index.css` — `:root` (light) +
  `.dark` (dark), oklch. App components use **tokens**
  (`bg-background`/`bg-card`/`bg-muted`, `text-foreground`/`text-muted-foreground`,
  `border-border`, `bg-primary`, `bg-destructive`, `ring-ring`), **not** raw
  `slate-*`/`gray-*` pairs. The `dark:` variant runs off the `.dark` class
  (set by `contexts/theme.ts`) — so token utilities need no `dark:` variants.
- **Primary is deliberately neutral** (shadcn default), not a brand hue. It can
  be swapped in `index.css` without touching a single component.
- **The sidebar is intentionally dark in both themes** (`sidebar-*` tokens) —
  same convention as ecoline/mds-praxis.
- New primitives: `npx shadcn@latest add <name>`. The root `tsconfig.json`
  carries `baseUrl`/`paths` **only** for tooling — without it the CLI writes
  into a literal `@/` folder instead of `src/`.
- **Deliberate literal colours (do NOT tokenize):** itinerary status badges
  (emerald/blue/rose — they encode status, not surface), festival rating stars
  (amber), the "Editing film" warning banner (amber), the sidebar avatar
  gradient, and hyperlinks (`text-blue-600 dark:text-blue-400` — link
  affordance would vanish against a neutral primary). Literal colours carry
  explicit `dark:` variants since they cannot follow the token flip.
- `src/components/ui/**` is exempt from `react-refresh/only-export-components`
  in `eslint.config.js`: shadcn deliberately exports cva variant objects and
  `useSidebar` alongside the components — that is its public API.
