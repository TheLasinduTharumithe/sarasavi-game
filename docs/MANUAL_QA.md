# Manual QA Checklist

Record browser/device versions and attach screenshots or console output for failures.

## Chrome and Edge desktop

- [ ] Fresh load reaches Home without console errors.
- [ ] Valid player names are trimmed and retained after reload.
- [ ] Empty, one-character, over-20-character, and symbol-containing names are rejected.
- [ ] Buttons are readable, large, and respond once per click.
- [ ] Left/Right Arrow and A/D move the basket smoothly.
- [ ] Basket never crosses the playfield edges.
- [ ] The sound control works with mouse and keyboard focus.

## Core round

- [ ] Countdown shows 3, 2, 1, GO before the timer starts.
- [ ] Timer begins at 00:30 and ends at 00:00.
- [ ] Normal book adds 10 and increments books caught.
- [ ] Golden book adds 30 and increments golden books.
- [ ] Phone subtracts 10 and increments distractions.
- [ ] Coffee subtracts 5 and increments distractions.
- [ ] Score never falls below zero.
- [ ] Items become faster and spawn more often gradually.
- [ ] Items are recognizable without relying only on color.
- [ ] TIME'S UP stops spawning, collisions, scoring, and basket input.
- [ ] Result statistics match the completed round.

## Replay and lifecycle

- [ ] Play Again starts a fresh countdown, timer, score, and object set.
- [ ] Complete at least five replays without duplicate timers or listeners.
- [ ] Home returns to name entry normally.
- [ ] Memory and active falling-item counts remain bounded during repeated rounds.

## Tablet touch and orientation

- [ ] Test an Android tablet in both portrait and landscape using Chrome.
- [ ] Dragging starts only from the basket and remains horizontal.
- [ ] Fast drags remain inside the left/right boundaries.
- [ ] Load once in portrait and once in landscape; no rotate-device prompt is shown.
- [ ] HUD, basket, controls, and DOM name field remain visible.
- [ ] Browser zoom and address-bar resizing do not introduce page scrolling.

## Phone layout

- [ ] Test a representative narrow Android phone in portrait and landscape.
- [ ] Canvas stays fully visible without cropped HUD or buttons.
- [ ] Portrait mode uses the full native 9:16 game layout without asking the player to rotate.
- [ ] Score, timer, basket, falling items, and LEFT/RIGHT controls remain visible in portrait.
- [ ] Player-name keyboard does not permanently displace the layout.
- [ ] Touch targets remain practical and do not overlap.

## Audio and reduced motion

- [ ] Initial page load does not trigger an autoplay warning.
- [ ] First click/key safely enables background music.
- [ ] Normal, golden, negative, countdown, and game-over cues are distinct.
- [ ] Muting silences music and effects without changing gameplay.
- [ ] Mute state survives reload.
- [ ] With OS/browser reduced motion enabled, penalty shake and pulse effects are restrained.

## Firebase success path

- [ ] Anonymous Authentication is enabled and creates a UID.
- [ ] A completed round creates exactly one `scores` document.
- [ ] The document UID equals the authenticated UID.
- [ ] Replay creates a new result and does not resubmit the previous result.
- [ ] Leaderboard displays today's highest scores in descending order, maximum ten.
- [ ] First, second, and third rows are highlighted without casino styling.

## Firebase failure path

- [ ] Disable Firebase configuration or block requests.
- [ ] Home and gameplay still work.
- [ ] Result displays the friendly upload-failure message.
- [ ] Play Again and Home remain usable.
- [ ] Reconnect and confirm a pending result retries without a duplicate document.

## Offline and PWA

- [ ] Run a production build and open it once online over HTTPS or localhost.
- [ ] DevTools Application shows a valid manifest and controlling service worker.
- [ ] Install prompt/install menu recognizes the app.
- [ ] Installed app launches in standalone mode with the local icon.
- [ ] Switch DevTools Network to Offline and reload.
- [ ] Home, How To Play, Game, timer, and Result work offline.
- [ ] Leaderboard says `Leaderboard unavailable while offline.`
- [ ] Online/Offline indicator updates after connectivity changes.
- [ ] Restore connectivity and confirm leaderboard recovery and score retry.
- [ ] Deploy a new build during a round; confirm no forced reload interrupts play.

## Release gate

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] No unexpected console errors in current Chrome and Edge.
