/**
 * Plinko Game Module: Games_Config_Languages
 * Webpack Module ID: 0xdf1c
 * Original File: main.min.js
 */

import {
  Game,
  AnalyticProviderEnum,
  ScreenOrientationEnum,
  EnvironmentTypeEnum
} from './framework/Core';
import { SoundConstants } from './constants/SoundConstants';
import { GameMain } from './GameMain';
import * as PackageVersion from './version';

export interface IGameLaunchConfig {
  resourcesRoot: string;
  gameId: string;
}

/**
 * Static bootstrapper class that configures supported locales, WebGL renderer options,
 * sound lists, and screen orientations before instantiating the `Game` engine.
 */
export class Games {
  public static startGame(
    gameConfig: IGameLaunchConfig,
    elementId: string = 'gamePlace',
    authApi: any = null,
    isRewardAvailable: boolean = false
  ): Game {
    return new Game({
      main: GameMain,
      options: {
        isRewardAvailable: isRewardAvailable,
        authApi: authApi || null
      },
      version: PackageVersion.version,
      supportLanguages: {
        languages: [
          { name: 'English', value: 'en', key: 'en-US' },
          { name: 'Deutsch', value: 'de', key: 'de-DE' },
          { name: 'Español', value: 'es', key: 'es-ES' },
          { name: 'Français', value: 'fr', key: 'fr-FR' },
          { name: 'Italiano', value: 'it', key: 'it-IT' }
        ],
        defaultLanguage: 'en-US',
        textPath: 'assets/texts/'
      },
      soundEngine: 'internal',
      sounds: SoundConstants.GenerateSoundList(),
      resourcesRoot: gameConfig.resourcesRoot,
      elementId: elementId,
      renderOptions: {
        noWebGL: false,
        backgroundColor: 0x020202,
        clearBeforeRender: true,
        transparent: false,
        showStats: false,
        disableContextMenu: true,
        fps: 60
      },
      analytic: {
        providers: [
          {
            appId: '',
            provider: AnalyticProviderEnum.CONSOLE
          }
        ]
      },
      gameId: gameConfig.gameId,
      orientations: [
        {
          orientation: ScreenOrientationEnum.PortraitAndLandscape,
          orientationEnvironment:
            EnvironmentTypeEnum.phone |
            EnvironmentTypeEnum.pc |
            EnvironmentTypeEnum.tablet
        }
      ]
    });
  }
}
