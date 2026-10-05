# line city

An isometric city that draws itself in ink, stroke by stroke, then comes alive with little people walking the sidewalks and outlined cars driving the streets. Three.js + WebGL + TypeScript, no textures, no models: every line is generated in code.

## Run it

```bash
npm install
npm run dev
```

Drag to turn the city, scroll to zoom, press **R** (or the button) to redraw a brand-new city.

## How it works

- **Isometric view**: an orthographic camera looking down the diagonal (`src/main.ts`).
- **Drawing, not wireframe**: every building is a paper-colored solid with ink lines on top. The solids hide the lines behind them, so you only see what a person would draw (`paperMaterial` in `src/city.ts`).
- **Draws itself**: all lines live in one buffer. Each line gets a start time, and a small shader reveals it from one end to the other as time passes (`src/ink.ts`). The city draws from the center outward, bottom to top.
- **Hand-drawn feel**: building edges overshoot their corners a little and some get a second, slightly offset pass, like an architect's sketch (`sketch()` in `src/ink.ts`).
- **Seeded**: every redraw picks a new seed, so cities are different but repeatable (`src/rng.ts`).

## Easy first tweaks

1. **Pen speed**: change `uDuration` in `src/ink.ts` (how long one stroke takes) or the `0.045` in `delayAt` in `src/city.ts` (how fast the drawing spreads).
2. **Colors**: swap `PAPER` and `INK` in `src/city.ts`. Try blueprint (`#1b3a6b` paper, `#e8f0ff` ink) and update the background in `index.html`.
3. **Taller downtown**: raise the `22` in the building height line in `src/city.ts`.
4. **More life**: bump the walker count (`90`) or car count (`16`) in `src/city.ts`.
5. **Sketchier**: raise the overshoot or the `0.14` jitter in `sketch()`.

Bigger ideas: draw-on for the people too, a day/night ink swap, hover a building to see it re-sketch, or export a frame as an SVG poster.
