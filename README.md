# 🔴 The Price is Right: Plinko Pegs

A complete, self-contained, offline HTML5 revival of the official *The Price is Right: Plinko Pegs* web game (Arkadium Arena / PixiJS / Planck Box2D physics).

---

## 🚀 How to Run the Game (1-Click)

Double-click **`start-game.bat`**.

It automatically:
1. Starts the local Node.js web server at `http://localhost:8080/`.
2. Launches your default web browser directly into the game.

---

## 📁 Project Structure

```
game/
├── assets/                  # Complete audio, sound effects, level configurations, and textures
├── animate/                 # PixiAnimate / CreateJS symbol vector scenes
├── build/                   # Web fonts and icons
├── fonts/                   # Fonts (Rockwell, Ubuntu, Roboto)
│
├── src/                     # 100% CLEAN, UNOBFUSCATED TYPESCRIPT SOURCE CODE
│   ├── GameBoardView_Collisions.ts      # Board collision shapes & bucket triggers
│   ├── PickAPowerPopupView.ts          # Upgrade cards, probabilities & rerolls
│   ├── LevelRootView_Physics_Box2D.ts  # Planck.js (Box2D) physics simulation loop
│   ├── GameProgression_Storage.ts      # GameplayModel, scores, and bucket payouts
│   ├── GameController_StateMachine.ts  # Scene controller (Title -> Gameplay -> Help)
│   ├── GameMain.ts                     # Main entry class & URL cheat parser
│   ├── Games_Config_Languages.ts       # Multilingual settings & WebGL options
│   ├── PriceIsRightPlinkoGame_Entry.ts # SDK lifecycle hooks
│   └── WEBPACK_MODULE_MAP.md           # Module ID mapping reference
│
├── index.html               # Main game launcher & Box2D dependency injection shims
├── main.min.js              # Base runtime engine bundle
├── piece_defs.js            # Embedded offline physics collision polygon definitions
├── server.js                # High-performance local Node.js static server
└── start-game.bat           # 1-click launch batch script
```

---

## 🎮 Cheats & Developer Parameters

You can add query parameters to the URL in your browser:

- **`http://localhost:8080/?cheats=true`** — Enables developer cheat mode (instant powerup rerolls).
- **`http://localhost:8080/?new=1`** — Simulates a first-time player (restarts tutorial).
- **`http://localhost:8080/?locale=fr-FR`** — Switches language (`de-DE`, `es-ES`, `it-IT`, `fr-FR`, `en-US`).
- **`http://localhost:8080/?variant=1`** — Switches game ruleset variant.
