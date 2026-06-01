# ecoline-react

React + TypeScript Frontend für ECOline (4D REST API).

**Lebt AUSSERHALB des 4D-Projekts** — eigenes Git-Repo, Schwester von
`mds-praxis-react` und `artdimensions-react`. Aufgebaut als Zwilling von
`mds-praxis-react` (gleiche Auth-Component API4D, Auth angeglichen).

## Stack
- **Vite** + React 19 + TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/vite`, kein `tailwind.config.js`)
- **React Router 7** (Routing)
- **TanStack Query** (Server-State)
- **fetch** (eigener `apiClient`, kein axios)

## Dev
```bash
npm install
npm run dev       # Vite dev-server :5173, Proxy /api → :8282
```

## Backend / Auth
4D REST API auf Port **8282** (ECOline).
Auth = **einzelner JWT-Bearer-Token** (kein access/refresh-Paar),
geliefert von der API4D-Component:
- `POST /api/v1/auth/login` `{ username, password }` → `{ token, user? }`
- `GET  /api/v1/auth/me` → `CurrentUser`
- Token in `localStorage` unter `ecoline_token`, als `Authorization: Bearer`
- 401 → Token verwerfen + Redirect `/login`

## Struktur
```
src/
  api/        client.ts (fetch-Wrapper, RFC-7807-Fehler), auth.ts
  contexts/   auth.ts (Token + Context), AuthContext.tsx (Provider), useAuth.ts
  components/ LoginPage, ProtectedRoute, Layout
  types/      auth.ts
```

## Konventionen
- Komponenten: PascalCase · API-Module: camelCase
- Deutsch für Domänen-Begriffe, Englisch für Tech (siehe Backend-CLAUDE.md)
- Pfad-Alias `@/` → `src/`
- Kein `Co-Authored-By` in Commits

## Nächste Schritte
Kunden-Resource (`/api/v1/kunden`) als erste Daten-Anbindung — analog
`mds-praxis-react` (api/kunden.ts + hooks/useKunden.ts + KundenListe/KundeForm).
