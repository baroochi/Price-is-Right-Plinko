/**
 * Kinematics Simulation Entry Module
 * Webpack Module ID: 0x4cf5
 * Original File: main.min.js
 */

import { addArena5 } from './api/Arena5Adapter';
import { setup } from './api/EnvironmentSetup';
import { Games } from './Games_Config_Languages';
import * as GameConfig from './config/GameConfig';

declare global {
  interface Window {
    ArenaXApi: any;
  }
}

window.ArenaXApi = undefined;

export interface IArenaGameEntry {
  game: any;
  options: any;
  eagleApi?: any;
  register: (arenaInstance: any, options: any) => void;
  render: (container: any, props: any, elementId: string) => void;
  destroy: () => void;
}

/**
 * External ArenaX host wrapper exposing `register`, `render`, and `destroy` lifecycle hooks.
 */
export const game: IArenaGameEntry = {
  game: undefined,
  options: undefined,

  /**
   * Registers the simulation with the host platform and dispatches `GAME_REGISTERED`.
   */
  register(arenaInstance: any, options: any): void {
    this.options = options;
    this.eagleApi = options.enviroment
      ? options.enviroment['@arkadium/eagle-user-client']
      : null;

    const arenaApi = window.ArenaXApi.init(arenaInstance, options);
    addArena5();
    arenaApi.dispatch({
      type: 'GAME_REGISTERED',
      payload: null
    });
  },

  /**
   * Sets up the runtime environment and boots the kinematics simulation inside the target DOM element.
   */
  render(container: any, props: any, elementId: string): void {
    setup({
      environment: this.options?.environment || this.options?.enviroment || {},
      gameKey: GameConfig.gameId
    });

    this.game = Games.startGame(
      GameConfig,
      elementId,
      this.eagleApi,
      this.options.rewardVideoAvailable
    );
  },

  /**
   * Cleans up and destroys the active game instance on unmount.
   */
  destroy(): void {
    if (this.game) {
      this.game.destroy();
      this.game = undefined;
    }
  }
};
