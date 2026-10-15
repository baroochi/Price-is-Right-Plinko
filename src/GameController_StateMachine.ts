/**
 * Plinko Game Module: GameController_StateMachine (RootView)
 * Webpack Module ID: 0x360
 * Original File: main.min.js
 */

import {
  SimpleViewBase,
  Inject,
  TestType,
  FontResourceItem,
  ResourceItem,
  ResourceItemType,
  JsonResourceItem,
  Environment,
  EnvironmentTypeEnum,
  IOCContainer,
  IArenaApi,
  Scope,
  AnalyticResources,
  Eagle,
  StorageManager
} from './framework/Core';
import { OptionsMenuHandlerView } from './views/OptionsMenuHandlerView';
import { GameAnalytics } from './analytics/GameAnalytics';
import { AnimateContents } from './constants/AnimateContents';
import { LoadingView } from './views/LoadingView';
import { LoadingAnimModel } from './models/LoadingAnimModel';
import { TitleScreenLayoutView } from './views/TitleScreenLayoutView';
import { IntroScreenModel } from './models/IntroScreenModel';
import { GameScreenLayoutView } from './views/GameScreenLayoutView';
import { GameplayModel, GameplayModeTypeIDs } from './GameProgression_Storage';
import { MainMenuModel } from './models/MainMenuModel';
import { SoundConstants } from './constants/SoundConstants';
import { BgHandlerView } from './views/BgHandlerView';
import { RotateScreenPopupView } from './views/RotateScreenPopupView';
import { HelpPopupView } from './views/HelpPopupView';
import { MSNArenaApi } from './api/MSNArenaApi';
import { EagleAuthApiManager } from './api/EagleAuthApiManager';
import * as PIXI from 'pixi.js';

/**
 * Root application controller and top-level scene state machine.
 * Coordinates transitions between LoadingView, TitleScreenLayoutView,
 * GameScreenLayoutView, OptionsMenuView, and HelpPopupView.
 */
export class RootView extends SimpleViewBase {
  private _options: any;
  private _gameplayModel: GameplayModel;
  private _introScreenModel: IntroScreenModel;
  private _mainMenuModel: MainMenuModel;
  private _loadingAnimModel: LoadingAnimModel;
  private _storageManager: StorageManager;
  private _arenaAPI: IArenaApi;
  private _analytics: GameAnalytics;
  private _eagleAuthApiManager: EagleAuthApiManager;
  private _eagleAPI: Eagle;

  private _lockScrimAlpha: number = 0.8;
  private _lockScreenAnimateTimeInitial: number = 0.167;
  private _lockScrim!: PIXI.Graphics;
  private _lockScreenAnimateTime: number = 0;
  private _lockScrimAnimationAlpha: number = 0;
  private _gamePlaySettings: any;

  public delay: (ms: number) => Promise<void> = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  constructor(
    @Inject options: any,
    @Inject gameplayModel: GameplayModel,
    @Inject introScreenModel: IntroScreenModel,
    @Inject mainMenuModel: MainMenuModel,
    @Inject loadingAnimModel: LoadingAnimModel,
    @Inject storageManager: StorageManager,
    @Inject arenaAPI: IArenaApi,
    @Inject analytics: GameAnalytics,
    @Inject eagleAuthApiManager: EagleAuthApiManager,
    @Inject eagleAPI: Eagle
  ) {
    super('RootView');
    this._options = options;
    this._gameplayModel = gameplayModel;
    this._introScreenModel = introScreenModel;
    this._mainMenuModel = mainMenuModel;
    this._loadingAnimModel = loadingAnimModel;
    this._storageManager = storageManager;
    this._arenaAPI = arenaAPI;
    this._analytics = analytics;
    this._eagleAuthApiManager = eagleAuthApiManager;
    this._eagleAPI = eagleAPI;

    this._analytics.appStarted();
    this._mainMenuModel.loadingAnimationData = this._loadingAnimModel;
    this._introScreenModel.loadingAnimationData = this._loadingAnimModel;
    this._gameplayModel.loadingAnimationData = this._loadingAnimModel;
    this._gameplayModel.mainMenuModel = this._mainMenuModel;

    console.log('SCORES', this._eagleAPI, this._options.authApi);
    this._eagleAuthApiManager.init(this._options.authApi);
    this._gameplayModel.loadFromStorage(true);
    this._gameplayModel.checkNewUser();
  }

  /**
   * Registers global fonts, bitmap fonts, settings JSON, sound configuration, and arena harness tests.
   */
  public getConfiguration(): any {
    return {
      childViews: {},
      tests: {
        startGame: {
          run: () => {
            this._play();
          },
          type: TestType.StartGame
        },
        quitGame: {
          run: () => {
            this._arenaAPI.handleGameEnd({ score: 1 });
          },
          type: TestType.QuitGame
        }
      },
      resources: {
        font1: new FontResourceItem('Rockwell'),
        font2: new FontResourceItem('Ubuntu'),
        font3: new FontResourceItem('Roboto'),
        floating_points_default_font: new ResourceItem(
          'floating_points_default',
          '/assets/bitmap_fonts/floating_points_default.fnt',
          ResourceItemType.pixiTexture
        ),
        floating_points_golden_font: new ResourceItem(
          'floating_points_golden',
          '/assets/bitmap_fonts/floating_points_golden.fnt',
          ResourceItemType.pixiTexture
        ),
        floating_points_lucky_font: new ResourceItem(
          'floating_points_lucky',
          '/assets/bitmap_fonts/floating_points_lucky.fnt',
          ResourceItemType.pixiTexture
        ),
        floating_points_lucky_golden_font: new ResourceItem(
          'floating_points_lucky_golden',
          '/assets/bitmap_fonts/floating_points_lucky_golden.fnt',
          ResourceItemType.pixiTexture
        ),
        wall_light_font: new ResourceItem(
          'wall_light_font',
          '/assets/bitmap_fonts/wall_light_font.fnt',
          ResourceItemType.pixiTexture
        ),
        gamePlaySettings: new JsonResourceItem('gamePlaySettings', '/assets/settings/settings.json'),
        soundDataSet: SoundConstants.GenerateSoundConfig()
      }
    };
  }

  public onInitialize(): void {
    this._lockScrim = new PIXI.Graphics();
    this.display.addChild(this._lockScrim);
    this.setScrimState(false);
    this._initGameFromConfig();
    this._setupLoadingAnimation();

    if (Environment.type === EnvironmentTypeEnum.phone) {
      this.createRotateScreenPopup();
    }
  }

  public createRotateScreenPopup(): void {
    this.addChild(
      {
        animateContent: AnimateContents.GAMEPLAY_JSON,
        symbolName: 'Rotate_Screen_Popup_MC',
        view: RotateScreenPopupView,
        model: this._gameplayModel
      },
      'RotateScreenPopup',
      3
    );
  }

  public onSetLandscape(): void {}

  public onSetPortrait(): void {}

  public onFocus(focused: boolean): void {
    this._gameplayModel.isBroweserInFocus = true;
  }

  public onResize(width: number, height: number, scale: number): void {
    super.onResize(width, height, scale);
    const unscaledWidth = width / scale;
    const unscaledHeight = height / scale;

    this._lockScrim.clear();
    this._lockScrim.beginFill(0x000000, this._lockScrimAlpha);
    this._lockScrim.drawRect(
      -0.5 * unscaledWidth,
      -0.5 * unscaledHeight,
      unscaledWidth,
      unscaledHeight
    );
    this._lockScrim.endFill();
  }

  /**
   * Main root frame update: animates modal scrim overlay, syncs game speed and help menu flags,
   * processes scene transitions, and updates sound manager.
   */
  public onUpdate(deltaTime: number): void {
    if (this._lockScreenAnimateTime > 0) {
      this._lockScreenAnimateTime -= deltaTime;
      if (!this._lockScrim.visible) {
        this._lockScrim.visible = true;
        this._lockScrim.alpha = 0;
      }

      const progressRatio = this._lockScreenAnimateTime / this._lockScreenAnimateTimeInitial;
      this._lockScrim.alpha =
        this._lockScrimAnimationAlpha > 0
          ? this._lockScrimAlpha * (1 - progressRatio)
          : this._lockScrimAlpha * progressRatio;

      if (this._lockScreenAnimateTime <= 0) {
        this._lockScreenAnimateTime = 0;
        if (this._lockScrimAnimationAlpha > 0) {
          this._lockScrim.alpha = this._lockScrimAlpha;
          this.setScrimState(true);
        } else {
          this._lockScrim.alpha = 1;
          this.setScrimState(false);
        }
      }
    }

    this._gameplayModel.currentGameSpeed = this._mainMenuModel.currentGameSpeed;
    this._gameplayModel.helpVisible =
      this._gameplayModel.helpVisible || this._mainMenuModel.helpMenuRequested;
    this._mainMenuModel.helpMenuRequested = false;

    const isScreenFadeComplete =
      this._loadingAnimModel.screenFadeInfo.isFullyVisible &&
      this._loadingAnimModel.screenFadeInfo.velocity > 0;

    this._handleSceneSwitch(isScreenFadeComplete);
    SoundConstants.update(deltaTime);
  }

  /**
   * Handles state transitions between the Intro/Title scene and Gameplay scene.
   */
  public _handleSceneSwitch(isScreenFadeComplete: boolean): void {
    if (this._mainMenuModel.quitGameRequested) {
      this._gameplayModel.quitGameRequested = true;
      this._mainMenuModel.quitGameRequested = false;
    }

    if (this._introScreenModel.newGameRequested) {
      this._loadingAnimModel.loadingVisible = true;
      this._play();
    } else if (this._gameplayModel.exitGameRequested) {
      this._loadingAnimModel.loadingVisible = true;
      this.removeChildByName('IntroSceneRootObj');
      this.removeChildByName('GameplaySceneRootObj');
      this.removeChildByName('OptionsMenuView');
      this.removeChildByName('HelpPopupView');

      this._gameplayModel.FreeGeneratedElements();
      this._gameplayModel.loadFromStorage(true);
      this._addFrontendView();
      this._gameplayModel.ResetModel();
      this._gameplayModel.loadingAnimationData = this._loadingAnimModel;
      this._gameplayModel.mainMenuModel = this._mainMenuModel;
      this._gameplayModel.loadFromStorage(true);
      this._initGameFromConfig();
    }

    this._introScreenModel.resumeRequested = false;
    this._introScreenModel.newGameRequested = false;
    this._mainMenuModel.exitGameRequested = false;
    this._mainMenuModel.quitGameRequested = false;
    this._gameplayModel.exitGameRequested = false;
  }

  public _play(): void {
    this.removeChildByName('OptionsMenuView');
    this.removeChildByName('HelpPopupView');
    this._startPlayCommon();
  }

  public _startPlayCommon(): void {
    this.removeChildByName('IntroSceneRootObj');
    this._arenaAPI.handleGameStart();
    this._buildHamburgMenu();
    this._addGameplayView();
  }

  public _addFrontendView(): void {
    this._buildHamburgMenu();
    this._introScreenModel.loadFromStorage();
    this._introScreenModel.logoVisible =
      this._gamePlaySettings.general.showArkadiumLogo === 1;

    this.addChild(
      {
        animateContent: AnimateContents.GAMEPLAY_JSON,
        symbolName: 'IntroSceneLayout',
        view: TitleScreenLayoutView,
        model: this._introScreenModel,
        options: {
          mainMenuModel: this._mainMenuModel,
          gamePlayModel: this._gameplayModel
        }
      },
      'IntroSceneRootObj',
      1
    );
  }

  public _addGameplayView(): void {
    this.addChild(
      {
        view: GameScreenLayoutView,
        model: this._gameplayModel,
        options: {
          mainMenuModel: this._mainMenuModel,
          isRewardAvailable: this._options.isRewardAvailable
        }
      },
      'GameplaySceneRootObj',
      1
    );
  }

  public _addCommonBg(): void {
    this.addChild(
      {
        animateContent: AnimateContents.GAMEPLAY_JSON,
        symbolName: 'BgTemplate_MC',
        view: BgHandlerView,
        model: this.$model,
        options: {
          levelPath: '/assets/gfx/',
          onLoaded: () => {}
        }
      },
      'BgPanel',
      0
    );
  }

  /**
   * Loads settings from `settings.json` and configures platform-specific Arena APIs (such as MSN).
   */
  public _initGameFromConfig(): void {
    this._gamePlaySettings = undefined;
    const settingsResource = this.$resources.get('gamePlaySettings');

    if (settingsResource != null && settingsResource.getResource() != null) {
      this._gamePlaySettings = settingsResource.getResource().data;
      if (this._gamePlaySettings != null) {
        this._gameplayModel._gamePlaySettings = this._gamePlaySettings;

        const validSavedState = this._storageManager.loadData('VALID');
        if (validSavedState != null && validSavedState.toUpperCase() === 'TRUE') {
          const savedType = this._storageManager.loadData('TYPE');
          if (savedType != null) {
            parseInt(savedType, 10);
          }
        }

        this._gameplayModel.useArenaScoring = this._gamePlaySettings.general.useArenaScoring;

        if (this._gamePlaySettings && this._gamePlaySettings.general.clientAPI === 'msn') {
          IOCContainer.bind(IArenaApi).to(MSNArenaApi).scope(Scope.Singleton);
          this._arenaAPI = new MSNArenaApi(this.soundManager);
          this._arenaAPI.registerAction('quit', () => {
            this.onQuit();
          });
          IOCContainer.get(AnalyticResources).arenaName = this._arenaAPI.getArenaName();
        }
      }
    }
  }

  public onQuit(): void {
    this._mainMenuModel.quitGameRequested = true;
    this._arenaAPI.handleGameEnd({ score: 1 });
  }

  public onMute(): void {
    this.$sounds.muteMusic(this.soundManager.musicOn);
    this.$sounds.muteSoundEffects(this.soundManager.soundOn);
  }

  public _buildHamburgMenu(): void {
    this._mainMenuModel.reset();
    this._mainMenuModel.logoVisible =
      this._gamePlaySettings.general.showArkadiumLogo === 1;

    this.addChild(
      {
        symbolName: 'OptionsMenuView',
        model: this._mainMenuModel,
        view: OptionsMenuHandlerView,
        options: {}
      },
      'OptionsMenuView',
      2
    );

    this.addChild(
      {
        symbolName: 'HelpPopup',
        model: this._gameplayModel,
        view: HelpPopupView,
        options: {
          onOpen: () => {
            this._lockScrim.alpha = 0;
            this.appearScrim();
          },
          onClose: () => {
            return this.disappearScrim();
          }
        }
      },
      'HelpPopupView',
      3
    );
  }

  public async _setupLoadingAnimation(): Promise<void> {
    this.addChild(
      {
        animateContent: AnimateContents.LOADING_ANIM_JSON,
        symbolName: 'LoadingView',
        view: LoadingView,
        model: this._loadingAnimModel,
        options: {
          onLoaded: () => {
            this._addCommonBg();
            this._addFrontendView();
          }
        }
      },
      'LoadingAnimSceneRootObj',
      1
    );
  }

  public setScrimState(isActive: boolean): void {
    this._lockScrim.interactive = isActive;
    this._lockScrim.visible = isActive;
  }

  public appearScrim(force: boolean = false): void {
    if (this._lockScrim.alpha !== 1) {
      this._lockScrimAnimationAlpha = this._lockScrimAlpha;
      this._lockScreenAnimateTime = this._lockScreenAnimateTimeInitial;
    }
  }

  public disappearScrim(): void {
    if (this._lockScrim.visible) {
      this._lockScrimAnimationAlpha = 0;
      this._lockScreenAnimateTime = this._lockScreenAnimateTimeInitial;
    }
  }
}
