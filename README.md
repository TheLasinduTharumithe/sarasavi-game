# Sarasavi Book Fair – Catch the Falling Books

A child-friendly, 30-second browser game created for a book-fair experience. Players move a basket, catch books, avoid distractions, save completed scores through Firebase, and compare today's top ten results. The application is installable and remains playable offline after its first successful load.

The interface uses text branding only: **SARASAVI BOOK FAIR**. All game illustrations and audio are original procedural assets; no commercial book covers or third-party brand artwork are included.

## Technology stack

- Vite and TypeScript
- Phaser 3 with Arcade Physics
- CSS and a small DOM player-name field
- Firebase modular Web SDK: Anonymous Authentication and Cloud Firestore
- `vite-plugin-pwa` and Workbox
- Node's lightweight built-in test runner for pure game logic
- Strict TypeScript checks for linting and static analysis

## Game rules

The round starts after a `3, 2, 1, GO!` countdown and lasts 30 seconds.

| Item | Result |
| --- | ---: |
| Normal book | +10 |
| Golden book | +30 |
| Phone | -10 |
| Coffee | -5 |

The score never drops below zero. The spawn interval shortens and falling speed increases smoothly as the round progresses. Controls are Left/Right Arrow, A/D, or horizontal basket dragging with a mouse or touch screen.

## Features

- Complete Home → Game → Result → Leaderboard flow
- Validated 2–20 character player names with local convenience storage
- Keyboard, mouse, and touch controls
- Original scalable basket, book, golden-book, phone, coffee, and bookshop visuals
- Persistent mute control with browser-safe audio activation
- Reduced-motion support and large touch targets
- Anonymous Firebase sign-in and one-document-per-round score submission
- Top-ten daily Firestore leaderboard
- Graceful Firebase/offline failure states
- Pending-score retry after connectivity returns
- Installable PWA with offline game shell

## Folder structure

```text
public/
  icons/                 PWA and favicon artwork
src/
  firebase/              Firebase app, authentication, score, leaderboard access
  game/
    logic/               Pure scoring, achievements, difficulty, serialization
    managers/            Audio, score, spawn, and timer managers
    objects/             Basket and falling item game objects
    config.ts             Phaser configuration
    constants.ts          Scores, probabilities, timing, thresholds
    presentation.ts       Shared bookstore-inspired scene artwork
    ui.ts                 Shared Phaser button factory
  network/               Online/offline indicator
  scenes/                Phaser scenes
  styles/                Global and responsive CSS
  main.ts                 Application startup
docs/
  MANUAL_QA.md            Browser, device, Firebase, and PWA checklist
firestore.rules           Firestore security rules
firestore.indexes.json    Required leaderboard index
vite.config.ts            Vite and PWA configuration
```

## Installation

Requirements: a current Node.js LTS release and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Development commands

```bash
npm run dev       # local Vite development server
npm run lint      # static analysis
npm run test      # pure game-logic tests
npm run build     # type-check and create production output
npm run preview   # serve the production output locally
```

## Environment variables

Create `.env` from `.env.example` and populate:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Only Firebase web-app configuration belongs here. Never place service-account credentials or admin SDK keys in frontend files. `VITE_FIREBASE_MEASUREMENT_ID` is reserved for optional analytics and is not currently used by the game.

## Firebase setup

1. Create or select a Firebase project.
2. Add a Web app in Project settings.
3. Copy the Web app values into `.env`.
4. Install the Firebase CLI if needed: `npm install --global firebase-tools`.
5. Sign in with `firebase login` and select the project with `firebase use --add`.

### Anonymous Authentication

In Firebase Console, open **Authentication → Sign-in method**, enable **Anonymous**, and save. The game uses the anonymous UID internally; players do not register or enter credentials.

### Cloud Firestore

Create a Firestore database. The game writes completed rounds to the `scores` collection with server timestamps. Do not manually create score documents for normal operation.

### Firestore rules

Review [firestore.rules](./firestore.rules), then deploy:

```bash
firebase deploy --only firestore:rules
```

Reads require an authenticated user. Creates require the submitted UID to match the authenticated UID and validate the result fields. Client updates and deletes are denied.

### Firestore indexes

The daily top-ten query uses the composite index in [firestore.indexes.json](./firestore.indexes.json). Deploy it with:

```bash
firebase deploy --only firestore:indexes
```

Index creation can take several minutes. Until it is ready, the leaderboard shows its temporary-unavailable state while gameplay continues normally.

## PWA and offline behavior

The production service worker precaches the HTML, JavaScript, CSS, manifest, and local icons. After one successful online production load, Home, How To Play, Game, and Result remain available offline. The timer and controls are entirely local. The leaderboard clearly reports that it is unavailable offline.

Completed scores that cannot be uploaded are stored in a small validated local queue and retried when connectivity returns. Stable round IDs prevent duplicate Firestore documents. A waiting application update is offered only outside an active game and is never forced during the 30-second round.

Service workers require HTTPS, except on `localhost`. Use `npm run preview` when validating the production PWA locally; the Vite development server is not an installability test.

## Production build

```bash
npm run lint
npm run test
npm run build
npm run preview
```

Deploy the generated `dist/` directory.

## Firebase Hosting deployment

The included [firebase.json](./firebase.json) serves `dist/` and rewrites navigation to `index.html`.

```bash
npm run build
firebase deploy --only hosting
```

Add the deployed domain to **Authentication → Settings → Authorized domains** if Firebase does not add it automatically.

## Vercel and Netlify notes

- Build command: `npm run build`
- Publish/output directory: `dist`
- Configure the same `VITE_FIREBASE_*` values in the provider's environment settings.
- Add the deployment domain to Firebase Authentication's authorized domains.
- Configure an SPA fallback to `/index.html` if the provider does not detect Vite automatically.
- HTTPS is required for production service-worker and installation behavior.

## Accessibility and responsive behavior

- Logical canvas: 1280×720 using Phaser `FIT` and `CENTER_BOTH`
- Landscape-first layout for Android tablets, laptops, and desktops
- Smartphone landscape view uses proportional scaling and enlarged touch controls
- Portrait phones show a rotate-device overlay and pause an active round until landscape returns
- Safe-area insets protect controls on notched mobile devices
- Large controls, high-contrast text, keyboard movement, and touch dragging
- Items use distinct silhouettes and marks, not color alone
- Reduced-motion preference suppresses basket shake and strong pulse transitions
- Sound is optional, persistent, and never required to play

## Known limitations

- Client-side games cannot be fully cheat-proof; Firestore rules validate shape and reasonable limits, not human play.
- Anonymous identities are browser/profile-specific and may be lost when site data is cleared.
- Pending scores use local storage and are limited to the ten most recent unsent rounds.
- The game is landscape-first; portrait phones must rotate before continuing.
- Audio is intentionally lightweight procedural Web Audio rather than recorded music.
- Analytics is not enabled.

## Future improvements

- Server-side score verification or App Check
- Optional multilingual copy
- Additional accessible control presets
- Curated seasonal book-fair themes
- Analytics with explicit privacy review and consent handling

## Final commands

```bash
npm install
npm run lint
npm run test
npm run build
npm run preview
```

Use [docs/MANUAL_QA.md](./docs/MANUAL_QA.md) before each public deployment.
