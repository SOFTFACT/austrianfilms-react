# austrianfilms-react

React + TypeScript backoffice for **AustrianFilms** (4D REST API on port 8181).

## Setup

```bash
npm install
npm run dev
```

Dev server runs on <http://localhost:5181>; `/api`, `/mcp`, `/getimage` and
`/flags` requests are proxied to the 4D web server (`http://localhost:8181`).

## Build

```bash
npm run build     # → dist/
npm run lint
```

## Deploy

```bash
npm run deploy    # build → austrianfilms-react-dist.zip → reveal in Finder
```

Transfer the zip to the Windows prod box and unzip into
`C:\Caddy\austrianfilms-react`, where Caddy serves it as
`app.af.softfact.com` and proxies the API to the local 4D server.

## UI

shadcn/ui (`new-york`, base color `neutral`) with semantic CSS-variable tokens
and a light/dark theme switch. See [CLAUDE.md](CLAUDE.md) for the styling rules.
