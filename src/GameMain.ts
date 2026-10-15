/**
 * Plinko Game Module: GameMain
 * Webpack Module ID: 0x13428
 * Original File: main.min.js
 */

import { GameBase, Inject } from './framework/Core';
import { RootView } from './GameController_StateMachine';
import { GameConstants, BuildType } from './constants/GameConstants';

/**
 * Main game entry class that initializes the RootView and parses URL query parameters
 * for development cheats, locale overrides, and A/B test variants.
 */
export class GameMain extends GameBase {
  private _options: any;

  constructor(@Inject options: any) {
    super();
    this._options = options;

    if (GameConstants.BUILD_TYPE === BuildType.DEVELOPMENT) {
      this.setCheats();
    }
  }

  public getConfiguration(): any {
    return {
      childViews: {
        root: {
          view: RootView,
          model: this.$model,
          options: {
            authApi: this._options.authApi,
            isRewardAvailable: this._options.isRewardAvailable
          }
        }
      }
    };
  }

  public onSetLandscape(): void {}

  public onSetPortrait(): void {}

  public onInitialize(): void {}

  /**
   * Parses URL parameters (`?cheats=true`, `?locale=en-US`, `?new=1`, `?variant=2`)
   * and checks if running on a local development server.
   */
  public setCheats(): void {
    const cheatsParam = this.gup('cheats');
    if (cheatsParam && cheatsParam === 'true') {
      GameConstants.USE_CHEATS = true;
    }

    const localeParam = this.gup('locale');
    if (
      localeParam &&
      (localeParam === 'de-DE' ||
        localeParam === 'it-IT' ||
        localeParam === 'es-ES' ||
        localeParam === 'fr-FR' ||
        localeParam === 'en-US')
    ) {
      GameConstants.LOCALE = localeParam;
      this.localizationManager.setLocale(localeParam);
    }

    if (this.gup('new')) {
      GameConstants.CHEAT_NEW_USER = true;
    }

    const variantParam = this.gup('variant');
    if (variantParam && !isNaN(parseInt(variantParam, 10))) {
      GameConstants.VARIANT = parseInt(variantParam, 10);
    }

    const href = location.href;
    if (
      href.indexOf('localhost') === 7 ||
      href.indexOf('localhost') === 8 ||
      href.indexOf('192.168.1.61') === 7 ||
      href.indexOf('192.168.1.61') === 8 ||
      href.indexOf('192.168.50.11') === 7 ||
      href.indexOf('192.168.50.11') === 8
    ) {
      GameConstants.LOCALHOST = true;
    }
  }

  /**
   * Extracts a query string parameter value from `window.location.href` by name ("Get URL Parameter").
   */
  public gup(paramName: string): string | null {
    const url = location.href;
    const escapedName = paramName.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp(`[\\?&]${escapedName}=([^&#]*)`);
    const match = regex.exec(url);
    return match == null ? null : match[1];
  }
}
