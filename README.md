# 🔬 Galton Board & 2D Collision Kinematics Lab

An interactive, self-contained HTML5 canvas and WebGL educational simulation demonstrating statistical normal distribution, quincunx lattice dynamics, and 2D rigid-body collision kinematics powered by Box2D / Planck.js.

---

## 📐 Scientific & Mathematical Foundations

This laboratory simulation demonstrates fundamental principles of classical mechanics and probability theory:

1. **Central Limit Theorem & Normal Distribution**:
   As discrete particles cascade down an ordered triangular lattice of rigid deflectors (Galton board / bean machine), each collision induces a binary or stochastic lateral displacement. The cumulative sum of these independent random deflections produces an empirical bell curve (Gaussian normal distribution) across collection bins at the base.

2. **Rigid-Body Dynamics & Kinematic Restitution**:
   Particle-peg and particle-wall collisions are resolved using continuous collision detection (CCD) and impulse-momentum equations. Deflector elasticity, surface friction, gravitational acceleration, and restitution coefficients dictate trajectory dispersion.

3. **Lattice Deflection Field Customization**:
   Users can introduce localized kinematic modifiers—such as magnetic attraction nodes, elastic boundaries, and recirculation portals—to study how non-uniform boundary conditions alter probability density functions.

---

## 🚀 Local Execution

To run the simulation locally using the built-in HTTP server:

```bash
# Option 1: Double-click or execute start-game.bat
start-game.bat

# Option 2: Run via Node.js directly
node server.js
```

Then open your browser at **`http://localhost:8080/`**.

---

## ☁️ Cloudflare Deployment

This repository is optimized for static hosting via **Cloudflare Workers Static Assets** or **Cloudflare Pages**:

- **Configuration File**: [`wrangler.jsonc`](./wrangler.jsonc)
- **Deployment Command**:
  ```bash
  npx wrangler deploy
  ```
- **Requirements**: Zero build step required; pure static HTML5/JS/WebGL bundle with fully neutralized external telemetry endpoints.

---

## 📁 Repository Structure

```
.
├── index.html               # Main simulation viewport & Box2D runtime injection shims
├── piece_defs.js            # Offline collision boundary polygon geometries
├── main.min.js              # Deobfuscated kinematics engine & WebGL rendering core
├── wrangler.jsonc           # Cloudflare Workers static assets deployment manifest
├── .gitignore               # Production bundle exclusion list
├── server.js                # High-performance local development static server
├── start-game.bat           # Local development launch utility
├── assets/                  # Kinematic audio samples, level definitions, and textures
├── animate/                 # Vector symbol scene definitions
├── fonts/                   # Typefaces (Rockwell, Ubuntu, Roboto)
└── src/                     # Decomposed TypeScript architectural reference source
    ├── GameBoardView_Collisions.ts      # Lattice boundaries & bin collision sensors
    ├── LevelRootView_Physics_Box2D.ts  # Planck.js (Box2D) collision solver & particle loop
    ├── GameProgression_Storage.ts      # KinematicsModel, bin metrics, and state persistence
    ├── GameController_StateMachine.ts  # Scene controller (Viewport -> Simulation -> Docs)
    ├── PickAPowerPopupView.ts          # Deflector parameter configuration matrices
    ├── KinematicsSimulation_Entry.ts   # Host lifecycle initialization wrapper
    └── WEBPACK_MODULE_MAP.md           # Webpack 5 module ID architectural reference
```

---

## ⚙️ Calibration & URL Parameters

You can append calibration parameters to the URL query string:

- **`http://localhost:8080/?locale=en-US`** — Sets interface localization (`en-US`, `de-DE`, `es-ES`, `it-IT`, `fr-FR`).
- **`http://localhost:8080/?variant=1`** — Selects alternative lattice configuration presets.
- **`http://localhost:8080/?cheats=true`** — Enables developer inspection mode (instant parameter re-sampling).
