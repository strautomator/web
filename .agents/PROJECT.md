# Strautomator: Web

Web frontend and API of Strautomator. Depends on the `strautomator-core` to work.

## Stack

- TypeScript + Firestore, running with Node.js.
- Nuxt 5 (nightly) with Vue 3 (Composition API only), Vuetify 4 and Pinia on the frontend (`app/`).
- Nitro (Nuxt's server engine) for the API, OAuth, MCP and middleware (`server/`). There's no Express server anymore.
- Runs on GCP (Cloud Run + Cloud Firestore), exposed behind Cloudflare.

## Structure

- `app/`: Nuxt frontend (pages, layouts, components, composables, Pinia store in `app/stores`).
- `server/api/`: API routes, one file per route and method, mounted at `/api/`.
- `server/routes/`: auth, MCP OAuth and well-known routes.
- `server/middleware/`: startup, security headers, rate limiting / Cloudflare, redirects and sessions (run in filename order).
- `server/utils/`: shared server helpers (auth, sessions, request / response helpers, business logic shared by the API and MCP).
- `server/mcp/`: MCP server logic.

## Install and deploy

- To clear and install everything from scratch: `make clean update`.
- To just update dependencies: `make update`.
- To deploy: `make deploy-git`. This will create a new GIT tag and trigger a new build on GCP.

## Notes and known issues

- Running on a Nuxt 5 nightly build. The `@pinia/nuxt` module is replaced by a local plugin (`app/plugins/00.pinia.ts`) because nightly versions fail the module compatibility check.
- TypeScript 7 has no JS API, so `vue-tsc` can't run against it. Server types are checked with `npm run typecheck`.
