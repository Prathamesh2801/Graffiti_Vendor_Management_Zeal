# Graffiti Campaign — CLAUDE.md

React 19 + Vite 7 SPA (JavaScript, no TypeScript) for managing wall-graffiti ad campaigns.
Backend is a separate **PHP API** (not in this repo). The vendor side is an **offline-first PWA**.

## Commands

```bash
npm run dev        # vite --host (reachable from phones on the LAN)
npm run lint       # must pass with 0 problems before committing
npm run build      # outputs dist/ (+ service worker)
npm run build:zip  # build and zip dist/ → dist.zip for upload to the PHP host
```

There are no tests. Verify changes with `npm run lint && npm run build`, then exercise the flow in the browser
(DevTools → Network → Offline for the vendor sync paths).

## Config

`config.js` (repo root) holds `BASE_URL` (PHP API) and `FRONTEND_BASE_URL` (used in campaign QR links).
Switch between the LAN dev server and production by swapping the commented lines. **Do not introduce `.env` files.**
Before `build:zip` for production, make sure the production lines are active.

## Roles & routes (`src/routes/MainRoute.jsx`)

Hash router (`/#/...`) because the PHP host has no SPA rewrites. The router is created once at module scope.

| Path | Who | Page |
|---|---|---|
| `/login`, `/register` | public (vendors: phone + SMS OTP) | `pages/auth/Login`, `VendorRegister` |
| `/admin-login` | public — **Admin & Client** (username + password) | `Login type="admin"` |
| `/geo?Campaign_ID=` | **public**, opened from QR codes | `pages/campaign/CampaignMap` (Leaflet) |
| `/app/campaigns` | admin, client | `CampaignList` (clients read-only, `isAdmin` gates actions) |
| `/app/campaigns/:id/submissions` | admin, client | `CampaignSubmissions` → `VendorSubmissions` (approve/reject) |
| `/app/user-auth` | admin | `UserAuth` (user CRUD) |
| `/app/vendor` | vendor | `VendorDashboard` |

Guards: `ProtectedRoute` (logged in), `RoleRoute` (role check), `PublicRoute` (bounces logged-in users),
`HomeRedirect` (role → landing page; edit `HOME_BY_ROLE` there). Admin/map pages are `React.lazy` chunks.
Logged-out redirects use `loginPath()` (`utils/userRoleLocalStorage.js`): the last role that signed in on the device
picks `/admin-login` (admin/client) or `/login` (vendor, the default). Keep the vendor page free of any staff links.

## Architecture

```
src/
  api/          one file per backend resource; ALL requests go through api/api.js (axios instance)
  context/      AuthContext — user state, login/logout, global 401 handling
  hooks/        useOfflineSync — vendor offline queue + network status + upload loop
  pages/        route-level components (own data fetching + state)
  components/
    layout/     AppLayout (Header + Sidebar drawer + <Outlet>)
    features/   campaign/* (admin/client), vendor/* (vendor)
  utils/        offlineQueue, indexedDB, compressImage, imageUrl, pwaPrompt, userRoleLocalStorage
```

### API conventions
- Add endpoints to the matching `src/api/*Api.js`, using the shared `api` instance. Don't use bare `axios` or `fetch`
  (exception: `CampaignMap` uses `fetch` because `/geo` is public).
- PHP responses look like `{ Status: boolean, Message?, Data? | Records? | Token? }` with **PascalCase** fields
  (`Campaign_ID`, `Wall_Image`, `Created_AT`). Always check `res.Status`, not only the HTTP code. Pages map them to
  camelCase where they keep local state (see `CampaignList.fetchCampaigns`).
- POST bodies are `FormData`; PUT bodies are JSON. Pass query values with `params: {}`, never string interpolation.
- Image paths come back as `../uploads/...`. Always render them through `utils/imageUrl.js`
  (`CampaignMap` uses a different `/test/` prefix from `map.php` and is the one exception).

### Auth
- The session is `localStorage.user = { username, token, role }`, with role lowercased (`admin|client|vendor`).
  Read it with `useAuth()` in components, or `getUserFromStorage()` outside React.
- On a 401 from an authenticated request, `api.js` calls the handler `AuthContext` registered. That handler logs out
  (clearing state and storage) and the guards redirect. **Pages must not handle 401 themselves**: just skip the
  error toast when `err.response?.status === 401`.
- `logout()` only clears state. Don't call `navigate`/`window.location` after it, because `ProtectedRoute` redirects.

### Vendor offline flow (the delicate part)
1. Every submission, online or offline, is first **queued**. Metadata goes to `localStorage.vendor_offline_queue`
   (only through `utils/offlineQueue.js`). Compressed image blobs go to IndexedDB `vendorDB/images`, keyed by
   `imageIds` (`utils/indexedDB.js`).
2. `useOfflineSync().sync()` uploads `status: "ready"` items one at a time:
   success → removed from queue and IDB; server rejection → `status: "failed"` + `error` (vendor edits and resubmits);
   network error → stays `ready`, loop stops.
3. Sync runs on mount, on every offline→online transition, after submit, and on "Submit" from a card.
   A **ref lock** prevents concurrent runs. Never guard with React state, because stale closures caused duplicate uploads.
4. Queue writes are read-modify-write per item (`updateQueue`). Never write back a snapshot taken before an `await`,
   or items enqueued meanwhile are lost.
5. `SubmissionList` merges `queue` (shown as offline cards) with server `records`. It renders from props, so don't
   re-introduce `key={refreshKey}` remounts.
- Images are compressed client-side (`compressImage`: max 1200px wide, JPEG 0.7) in both `UploadForm` and `AddImagesModal`.
- Blob URLs: create them in `useMemo` and revoke them in effect cleanup, never in render.
- The online/sync status reaches the Header via `useOutletContext().setVendorMeta`.
- Location is fetched automatically on the upload step (`UploadForm`); the browser remembers the vendor's
  one-time "Allow". The last-known position is used **only** for weak/slow GPS, never when permission is
  denied (it could be a different wall). GPS needs https (or localhost).

### Vendor auth & PWA install
- Vendors log in with a 10-digit mobile number + SMS OTP (never expires). `Vendor/otp.php` registers a new
  number, and **re-sends the same OTP** for an existing one. It always requires `Fullname`, so "Forgot OTP"
  (`resendOtp`) sends the placeholder `"(OTP resend)"` (ignored for existing numbers). Stopgap: a mistyped,
  unregistered number becomes an account with that name; delete those in User Management. Proper fix is a
  backend resend mode that needs no name and rejects unknown numbers.
- Install help lives in `utils/pwaPrompt.js` + `components/features/vendor/InstallPrompt.jsx`:
  Android gets Chrome's install prompt as a dashboard card ("Not now" snoozes 3 days) plus an "Install app"
  menu item (the card is mounted in `AppLayout`; it pops up by itself only for vendors, while admins/clients,
  usually on desktop Chrome/Edge, get it from the menu item only); **iPhone gets the guide on the login/register pages**, because a Home Screen app on iOS has
  separate storage from Safari (login + offline queue don't carry over), so installing must come before
  signing in. In-app browsers (Instagram etc.) get "Open in your browser".

### Styling
- Tailwind 3 plus CSS variables defined in `src/index.css` (`--color-primary`, `--color-bg-card`, `--font-display`, …),
  exposed as Tailwind colors in `tailwind.config.js` (`bg-bg-card`, `text-text-secondary`, `text-primary`).
- Existing components use lots of inline `style={{ ... var(--color-x) }}`. For new code, prefer the Tailwind classes
  that map to the same tokens. Don't hardcode hex colors (`VendorRegister` still does; that's legacy).
- Animations use framer-motion; icons use lucide-react; toasts use react-hot-toast (`utils/ToasterOptions.jsx`).

### iPhone (iOS Safari / Home Screen app)
- Form fields are forced to 16px on touch devices (`index.css`) — below 16px iOS zooms the page on focus.
  Don't "fix" that with `maximum-scale=1` (it blocks pinch-zoom on Android). Narrow mobile fields must fit 16px text.
- Notch / Dynamic Island / home bar: `viewport-fit=cover` is on, so anything fixed or sticky to a screen edge
  must pad with `env(safe-area-inset-*)` (see Header, Sidebar, InstallPrompt, BulkBar, Toaster, CampaignMap).
  Use `100dvh`, not `100vh`, for full-screen layouts (iOS `100vh` hides content behind Safari's toolbar).

## Gotchas
- ESLint uses `react-hooks` v7 (React Compiler rules): no setState called synchronously in an effect body, no ref
  reads during render, no components defined inside components. Initial-load `fetchX()` calls in effects are allowed.
- `PWA` registerType is `autoUpdate`. `/Vendor/dashboard.php` is `NetworkOnly` in workbox; keep API calls out of
  the SW caches.
- `UserAuth` and `CampaignList` paginate/sort/filter on the client (full list fetched). Move this to the server once
  lists reach thousands of rows.
- `dist/` and `dist.zip` are build output and are git-ignored.
