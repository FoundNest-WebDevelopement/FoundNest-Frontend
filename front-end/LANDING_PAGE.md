# FoundNest public landing page

Served at `/` (signed-in users are sent on to `/login`, which forwards them to their home, as before).

## Files

| File | Purpose |
|---|---|
| `src/pages/LandingPage.jsx` | Header, hero, How It Works, QR features, warm banner, final CTA, footer |
| `src/landing/landing.css` | Design tokens (`--fn-*`), buttons, focus, reveal and carousel styles, scoped to `.fn-landing` |
| `src/landing/config.js` | Env-driven settings, map settings, nav links, **sample** preview items |
| `src/landing/OfficeLocator.jsx` | Office list + Leaflet map using `GET /api/offices` |
| `src/landing/RecentItems.jsx` | Accessible carousel of recent found items |
| `src/landing/Vignettes.jsx` | The three "How It Works" visuals |
| `src/landing/ui.jsx`, `scroll.js` | Scroll-reveal wrapper, smooth in-page scrolling |

## Backend data used

* `GET /api/offices` — public. Active offices only (`status !== false`) within `MAX_OFFICE_DISTANCE_KM` (3 km) of the
  campus centre, so a test/off-campus record cannot zoom the map out.
* `GET /api/found-reports/public` **requires a signed-in user** (401 without a token). No backend change was made, so
  the "Browse Recent Found Items" carousel shows illustrative examples (`PREVIEW_ITEMS` in `config.js`), not live records.

## Configuration

No landing-page environment variables. "DOWNLOAD THE APP" first asks for confirmation, then starts a direct download of the APK attached to the
repository's `application` release (`APP_DOWNLOAD_URL` in `src/landing/config.js`, currently `app-release.apk`).
Re-publish the APK to that release under the same file name each time; if the file name ever changes, update the constant.

Map tiles use the same Google hybrid tile URL as the in-app Map screen (no API key).

## Routes reused

`/login` (Submit a Lost Report, Login, QR sign-in), `/find` (Browse All Items, footer).
These stay behind the existing `UserRoute`, so signed-out visitors are redirected to the login page.
