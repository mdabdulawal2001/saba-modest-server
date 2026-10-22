# SABA MODEST API

A Node.js 20+ and Express 5 REST API for the SABA MODEST modest-fashion catalog. It uses MongoDB Atlas through the official MongoDB driver and Better Auth for email/password sessions, with optional Google OAuth.

## Project structure

```text
index.js
src/
  app.js
  config/          env, MongoDB and Better Auth configuration
  controllers/     product HTTP handlers
  middleware/      authentication and centralized errors
  routes/          auth and product routes
  scripts/         idempotent demo catalog seed
  services/        product database operations
  utils/           response helpers
  validators/      product body and query validation
```

## Install and run

1. Use Node.js 20.19 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the required values.
4. Run `npm run dev` for development or `npm start` for production.
5. Check `GET /api/health`.

`npm run seed` inserts the eight sample catalog products. It does not delete or overwrite products and is safe to rerun.

## MongoDB Atlas

Create an Atlas database user, allow the application host in Atlas network access, and copy the driver's connection string to `MONGODB_URI`. Set `DB_NAME=saba_modest_db`; the product collection is `products`. Better Auth creates and manages its own authentication collections through its MongoDB adapter. Do not manually create a parallel user/session store.

On database connection, the server creates product indexes for owner/date, category/price, featured status and the unique demo `seedKey`. Database connection failures are logged without connection details. The HTTP server remains available so the health endpoint can report `503` until MongoDB is reachable; database-backed API requests return service errors rather than fabricated success responses.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `NODE_ENV` | No | `development`, `test` or `production`. |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI. |
| `DB_NAME` | No | Database name; defaults to `saba_modest_db`. |
| `BETTER_AUTH_SECRET` | Yes | Private Better Auth signing/encryption secret; use a random secret of at least 32 characters in production. |
| `BETTER_AUTH_URL` | No | Shared public origin for the frontend, API, CORS and Better Auth; defaults to `http://localhost:PORT`. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret; set together with the client ID. |

Never commit `.env` or production secrets. Keep the same stable `BETTER_AUTH_SECRET` across service restarts and deployments.

## Authentication

Better Auth is mounted at `/api/auth/*` and uses its email/password endpoints and session handling. Google login is registered only when both Google OAuth variables are configured. Use Better Auth's client package in the frontend, set its `baseURL` to the backend origin (Better Auth's default `basePath` is `/api/auth`), and enable credentialed requests:

```js
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://api.example.com",
  fetchOptions: { credentials: "include" },
});
```

Protected API requests must include the Better Auth session cookie; the backend obtains identity from `auth.api.getSession` and ignores client-supplied identity or roles.

CORS and Better Auth trusted origins are restricted to the exact `BETTER_AUTH_URL`. Set the frontend client's `credentials` option to `include` for cross-origin fetch requests. In production cookies use `Secure`, `HttpOnly` and `SameSite=None`; local development uses `SameSite=Lax`.

Separate Vercel and Render default domains are cross-site. Although `SameSite=None; Secure` is configured, browser third-party-cookie blocking can prevent sessions from persisting. Prefer custom frontend and backend domains under the same registrable site (for example, `shop.example.com` and `api.example.com`), configure the exact `BETTER_AUTH_URL`, and test login/session/logout in the target browsers. The backend does not claim cross-site cookies will work where browser policy blocks them.

For Google OAuth, configure the OAuth consent screen and credentials in Google Cloud. Add the Better Auth callback URL for your deployment (typically `<BETTER_AUTH_URL>/api/auth/callback/google`) to the authorized redirect URIs. Keep the credentials only in the backend environment.

## API

All JSON responses use `{ "success": true, "data": ... }`; list responses include `meta.pagination`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Server and database readiness (`503` if DB is unavailable). |
| `GET` | `/api/products` | Public | Search, filter, sort and paginate catalog. |
| `GET` | `/api/products/:id` | Public | Read one product by 24-character ObjectId. |
| `GET` | `/api/products/mine` | Session | List only products owned by the authenticated user. |
| `POST` | `/api/products` | Session | Create a product; owner comes from verified session. |
| `PATCH` | `/api/products/:id` | Session + owner | Update explicitly allowed product fields. |
| `DELETE` | `/api/products/:id` | Session + owner | Delete an owned product. |
| `*` | `/api/auth/*` | Better Auth | Better Auth email/password, session, sign-out and optional OAuth endpoints. |

`GET /api/products` accepts:

- `search`: case-insensitive title substring, max 100 characters.
- `category`: `Casual`, `Premium` or `Party Wear`.
- `minPrice`, `maxPrice`: non-negative BDT values.
- `sort`: `price_asc` or `price_desc` (default is newest first).
- `featured`: `true` or `false`.
- `page`: positive integer (default `1`).
- `limit`: `1`–`50` (default `12`).

Example:

```http
GET /api/products?search=Noor&category=Premium&minPrice=1000&sort=price_asc&page=1&limit=12
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "665000000000000000000001",
      "title": "Noor Embroidered Three Piece",
      "shortDescription": "Delicate embroidery for graceful everyday elegance.",
      "description": "Product description",
      "price": 2850,
      "category": "Premium",
      "image": "",
      "sizes": ["M", "L", "XL"],
      "stock": 12,
      "featured": true,
      "createdBy": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "isDemo": true
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
  }
}
```

The create request requires `title`, `shortDescription`, `description`, `price`, `category` and `stock`. `image`, `sizes` and `featured` are optional and default to `""`, `[]` and `false`. PATCH accepts only those writable product fields. `_id`, `createdBy`, `createdAt`, `updatedAt`, `seedKey` and role/identity fields cannot be set by clients. A missing or invalid session returns `401`; an attempt to manage another user's product returns `403`.

Seed records are explicitly demo/catalog entries (`isDemo: true`, `createdBy: null`) and have stable `seedKey` values. They appear in public product browsing but never in any user's `/mine` list. The null owner is reserved for these seed records and does not represent a Better Auth user.

## Render deployment

1. Create a Render Web Service for this repository, use the Node runtime, set build command to `npm install` and start command to `npm start`.
2. Set `MONGODB_URI`, `DB_NAME`, a generated `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (the shared Render/custom origin), `NODE_ENV=production`, and optional Google credentials in Render's environment settings.
3. Configure Atlas network access for the Render service and ensure its database user has access to `saba_modest_db`.
4. Deploy, then verify `GET /api/health` reports `"database":"connected"`.
5. Run `npm run seed` from a trusted deployment environment if the demo catalog is wanted.

Do not expose database credentials or OAuth secrets to the frontend. Use HTTPS for deployed domains.
