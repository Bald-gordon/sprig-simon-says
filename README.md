# Simon Says

A Simon Says memory game made for Hack Club Sprig.

Originally submitted as [hackclub/sprig#4360](https://github.com/hackclub/sprig/pull/4360).

## Sprig version

The original Sprig source is preserved in [`Simon-says.js`](./Simon-says.js).

### Sprig controls

- `W` — green
- `A` — yellow
- `S` — blue
- `D` — orange
- `J` — restart after game over
- `K` — pause/unpause
- `L` — mute/unmute

The sequence gets longer each round, and the display speed increases as your score rises.

## Browser web player

A self-contained browser version is included at [`index.html`](./index.html), with:

- keyboard controls (`W/A/S/D`, `J`, `K`, `L`)
- clickable/touch-friendly color pads
- score, best score, round, speed, pause, mute, and game-over state
- start/restart buttons and responsive layout for desktop/mobile

### Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

### Run tests

```bash
npm test
```

(Uses built-in `node --test`; no extra dependencies required.)

## GitHub Pages deployment

You can host the web player with GitHub Pages from this repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/** (root), then save.
4. After deployment, Pages will serve `index.html` as the web player.

## Credits

Inspired by [Nomis](https://sprig.hackclub.com/gallery/play/nomis).
