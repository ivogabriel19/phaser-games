# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

There is no build step. The game runs directly via a static file server since `index.html` loads Phaser from CDN and uses native ES modules (`type="module"`).

Serve with any static HTTP server, for example:
```bash
npx serve .
# or
npx http-server .
```

There are no tests configured (`npm test` exits with an error).

## Architecture

**Entry point:** `src/index.js` → calls `launchGame()` from `src/game.js`, which instantiates `Phaser.Game` with the config and starts `roadScene`.

**Config:** `src/config/gameConfig.js` — Phaser game config (800×600, arcade physics, FIT scaling). Note: this file references `roadScene` and `Phaser` without importing them; it relies on global scope and must be kept in sync manually.

**Scene:** `src/scenes/roadScene.js` — the only scene. It implements a pseudo-3D Outrun-style road renderer entirely with Phaser's `Graphics` API (no sprites for the road). Key internals:
- `this.segments[]` — array of 500 road segments, each with `z`, `curve`, and `y` fields
- `renderRoad()` — iterates `drawDistance` (300) segments from the camera position, projects world coords to screen using a simple `scale = cameraDepth / z` perspective formula, accumulates `dx` per segment to produce the curve offset
- `drawSegment()` / `drawQuad()` — draws grass, rumble strips, and road as trapezoids using `fillPath`
- Player position is `this.playerX` (range −1 to +1), updated via arrow key input each frame

**Assets:** `assets/` contains two F1 car sprite sheets (`f1_sprite_256.png`, `f1_sprite_1024.png`) — not yet loaded or used in the scene.