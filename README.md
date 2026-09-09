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
npm run build     # → ../AustrianFilms/WebFolder/app  (the 4D repo)
```

The build is committed in the **AustrianFilms** repo (`build(webfolder): …`)
and reaches the server with the next `git pull` there — frontend and backend
travel together. 4D serves it at `https://af.softfact.com/app/` through
`HTTP_AF_App` (index.html for routes, files for the hashed assets);
`app.af.softfact.com` redirects there. No zip, no RDP.

## UI

shadcn/ui (`new-york`, base color `neutral`) with semantic CSS-variable tokens
and a light/dark theme switch. See [CLAUDE.md](CLAUDE.md) for the styling rules.
