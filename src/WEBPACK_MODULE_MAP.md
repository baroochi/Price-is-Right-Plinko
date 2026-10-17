# 🗺️ Kinematics Simulation Webpack 5 Module ID Reference Map

This map bridges the clean ES6/TypeScript deobfuscated files with their exact Webpack 5 module IDs in `main.min.js`.

---

| Webpack Module ID | TypeScript Class / File | Role & Exports |
| :---: | :--- | :--- |
| **`0x4cf5`** | [`KinematicsSimulation_Entry.ts`](./KinematicsSimulation_Entry.ts) | Root simulation lifecycle wrapper (`sdk.register`, `sdk.render`, `sdk.destroy`) |
| **`0x13428`** | [`GameMain.ts`](./GameMain.ts) | Simulation entry class (`GameMain`), URL calibration parser (`?cheats=true`, `?locale=`) |
| **`0xdf1c`** | [`Games_Config_Languages.ts`](./Games_Config_Languages.ts) | Engine options, 5 languages, WebGL config (`Games.startGame`) |
| **`0x6b4e`** | `GameConfig` | Simulation ID (`kinematics_lattice_nodes`), asset manifest paths |
| **`0x15b51`** | `GameConstants` | Dev flags (`USE_CHEATS`, `LOCALHOST`, `VARIANT: 2`, `CHEAT_NEW_USER`) |
| **`0x6c6c`** | [`PickAPowerPopupView.ts`](./PickAPowerPopupView.ts) | Parameter cards, weighted random distribution, calibration rerolls |
| **`0x1937`** | [`GameBoardView_Collisions.ts`](./GameBoardView_Collisions.ts) | Lattice board display, bin trigger detection, wall deflection triggers |
| **`0x4577`** | [`LevelRootView_Physics_Box2D.ts`](./LevelRootView_Physics_Box2D.ts) | Planck.js (Box2D) physics world, peg layout, particle spawning & magnets |
| **`0x176b4`** | [`GameProgression_Storage.ts`](./GameProgression_Storage.ts) | Central `GameplayModel`, bin coefficients (100, 500, 1K, 10K), save state |
| **`0x360`** | [`GameController_StateMachine.ts`](./GameController_StateMachine.ts) | Top-level `RootView`, state transitions (Intro -> Simulation -> Options -> Help) |
| **`0x13ac1`** | `ArenaXApi` | Event dispatcher (`GAME_REGISTERED`, `GAME_STARTED`, metrics) |
| **`0x2ee`** | `Arena5Adapter` | Host backward-compatibility bridge (`addArena5`) |
| **`0x132f8`** | `EnvironmentSetup` | Runtime environment initializer (`setup`) |

---

### 💡 Dropping Refactored Code Back into Webpack

When injecting a refactored class directly into `main.min.js`, wrap it in the Webpack module signature:
```javascript
0x1937: function(module, exports, __webpack_require__) {
    // Refactored GameBoardView code here
    // Use __webpack_require__(0x4577) to reference LevelRootView, etc.
}
```
