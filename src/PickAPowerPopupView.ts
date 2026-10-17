/**
 * Kinematics Simulation Module: GameConstants (PickAPowerPopupView)
 * Webpack Module ID: 0x6c6c
 * Original File: main.min.js
 */

import {
  AnimateViewBase,
  Inject,
  IArenaApi,
  MovieClipView,
  Tween
} from './framework/Core';
import { PlayerType } from './GameProgression_Storage';
import { PowerupButtonView } from './views/PowerupButtonView';
import { GameplayLogic } from './logic/GameplayLogic';
import { PickAPowerPopupInforSlideOutView } from './views/PickAPowerPopupInforSlideOutView';
import { GameUiButtonModel } from './models/GameUiButtonModel';
import { MathUtil } from './utils/MathUtil';
import { UiButtonView_AnimationFrameRollovers } from './views/UiButtonView_AnimationFrameRollovers';
import { GameAnalytics } from './analytics/GameAnalytics';
import { GameConstants } from './constants/GameConstants';

export interface IPickAPowerPopupOptions {
  isRewardAvailable: boolean;
  onShowScrim: () => void;
  onHideScrim: () => void;
}

/**
 * Controls the "Pick A Power" upgrade selection popup between rounds,
 * including weighted random powerup rolls, rewarded ad rerolls, and FUE arrows.
 */
export class PickAPowerPopupView extends AnimateViewBase {
  private _options: IPickAPowerPopupOptions;
  public gameLogic: GameplayLogic;
  private _analytics: GameAnalytics;
  private _arenaAPI: IArenaApi;

  private _powerupButtons: PowerupButtonView[] | undefined = undefined;
  private _rerollButton: GameUiButtonModel = new GameUiButtonModel();
  private _rerollDelay: number = 0;
  private _detailsButton: GameUiButtonModel = new GameUiButtonModel();

  private _isVerticalView: boolean = false;
  private _movementDirection: number = 1;
  private _rightWallPosition: number = 0;
  private _topWallPosition: number = 0;
  private _helperTimer: number = 0;
  private _savedPowerups: number[] | null = null;

  public firstResize: boolean = true;
  public gameScale: number = 1;
  public gameWidth: number = 1;
  public gameHeight: number = 1;

  private _infoPanelObject!: PickAPowerPopupInforSlideOutView;
  private _refreshIcon!: MovieClipView;
  private _arrows: MovieClipView[] = [];
  private _savedPosition!: { pos1: number; pos2: number };

  constructor(
    @Inject options: IPickAPowerPopupOptions,
    @Inject gameLogic: GameplayLogic,
    @Inject analytics: GameAnalytics,
    @Inject arenaAPI: IArenaApi
  ) {
    super('PickAPowerPopupView');
    this._options = options;
    this.gameLogic = gameLogic;
    this._analytics = analytics;
    this._arenaAPI = arenaAPI;
  }

  /**
   * Configures the 3 powerup choice buttons, reroll button, details toggle button,
   * FUE arrows, and slide-out info panel.
   */
  public getConfiguration(): any {
    this._detailsButton.visible = true;
    this._detailsButton.isDisabled = false;

    return {
      childViews: {
        DetailsButtonObj: {
          movieClipName: 'DetailsButtonObj',
          view: UiButtonView_AnimationFrameRollovers,
          model: this._detailsButton,
          options: {
            hasAlternateIcon: true,
            animateOnHover: false,
            isVisibleTrigger: true,
            onClick: () => {
              const isCurrentlyDisplayed = this._infoPanelObject.isDisplayed();
              this.$childViews.get('DetailsButtonObj').updateIcons(!isCurrentlyDisplayed);
              this._infoPanelObject.showPanel(!isCurrentlyDisplayed, false);
              this.resetHelperTimer();
            }
          }
        },
        powerupButton1: {
          movieClipName: 'PowerupButton1Obj',
          view: PowerupButtonView,
          model: this.$model,
          options: {
            powerupInfo: null,
            model: this.$model,
            onClick: (selectedPowerup: any) => {
              if (!this._rerollButton.isDisabled) {
                this._analytics.reward_rejected(this.$model);
              }
              this.gameLogic.postMessage('POWER_SELECTION', selectedPowerup);
              this._infoPanelObject.showPanel(false, false);
              this.$childViews.get('powerupButton1').display.interactive = false;
              this.$childViews.get('powerupButton2').alpha = 0.3;
              this.$childViews.get('powerupButton2').display.interactive = false;
              this.$childViews.get('powerupButton3').alpha = 0.3;
              this.$childViews.get('powerupButton3').display.interactive = false;
              this._rerollButton.isDisabled = true;
              this._detailsButton.isDisabled = true;
              this._analytics.upgrade_chosen(this._powerupButtons![0].GetPowerupInfo().name);
              this._options.onHideScrim();
              this.resetHelperTimer();
            }
          }
        },
        powerupButton2: {
          movieClipName: 'PowerupButton2Obj',
          view: PowerupButtonView,
          model: this.$model,
          options: {
            powerupInfo: null,
            onClick: (selectedPowerup: any) => {
              if (!this._rerollButton.isDisabled) {
                this._analytics.reward_rejected(this.$model);
              }
              this.gameLogic.postMessage('POWER_SELECTION', selectedPowerup);
              this._infoPanelObject.showPanel(false, false);
              this.$childViews.get('powerupButton2').display.interactive = false;
              this.$childViews.get('powerupButton1').alpha = 0.3;
              this.$childViews.get('powerupButton1').display.interactive = false;
              this.$childViews.get('powerupButton3').alpha = 0.3;
              this.$childViews.get('powerupButton3').display.interactive = false;
              this._rerollButton.isDisabled = true;
              this._detailsButton.isDisabled = true;
              this._analytics.upgrade_chosen(this._powerupButtons![1].GetPowerupInfo().name);
              this._options.onHideScrim();
              this.resetHelperTimer();
            }
          }
        },
        powerupButton3: {
          movieClipName: 'PowerupButton3Obj',
          view: PowerupButtonView,
          model: this.$model,
          options: {
            powerupInfo: null,
            onClick: (selectedPowerup: any) => {
              if (!this._rerollButton.isDisabled) {
                this._analytics.reward_rejected(this.$model);
              }
              this.gameLogic.postMessage('POWER_SELECTION', selectedPowerup);
              this._infoPanelObject.showPanel(false, false);
              this.$childViews.get('powerupButton3').display.interactive = false;
              this.$childViews.get('powerupButton1').alpha = 0.3;
              this.$childViews.get('powerupButton1').display.interactive = false;
              this.$childViews.get('powerupButton2').alpha = 0.3;
              this.$childViews.get('powerupButton2').display.interactive = false;
              this._rerollButton.isDisabled = true;
              this._detailsButton.isDisabled = true;
              this._analytics.upgrade_chosen(this._powerupButtons![2].GetPowerupInfo().name);
              this._options.onHideScrim();
              this.resetHelperTimer();
            }
          }
        },
        powerupButton_Reroll: {
          movieClipName: 'RerollButtonObj',
          view: UiButtonView_AnimationFrameRollovers,
          model: this._rerollButton,
          options: {
            onClick: (event: any) => {
              this.$model.refreshPowerups = false;
              if (this._rerollButton.counter <= 0) {
                this._rerollButton.isDisabled = true;
              } else {
                this._rerollButton.counter--;
                this._rerollButton.isDisabled = !GameConstants.USE_CHEATS;
                this._detailsButton.isDisabled = false;
                this.resetHelperTimer();

                if (this.$model.playerType !== PlayerType.SUBSCRIBER) {
                  if (this._rerollDelay <= 0) {
                    if (this.$model.showAdWithoutPopup) {
                      if (GameConstants.LOCALHOST) {
                        this.$model.refreshPowerups = true;
                      } else {
                        this.$model._arenaAPI.advShowReward().then(
                          () => {
                            this._analytics.reward_received(this.$model);
                            this.$model.refreshPowerups = true;
                          },
                          (err: any) => {
                            console.log('ADS error', err);
                            this.$model.refreshPowerups = true;
                          }
                        );
                      }
                      this.$model.refreshPowerups = false;
                    } else {
                      this.$model.refreshPowerVisible = true;
                    }
                    this._analytics.reward_accepted(this.$model);
                  }
                } else {
                  this.$model.refreshPowerups = true;
                }
              }
            },
            textMaxWidth: 145
          }
        },
        arrow_1: { movieClipName: 'arrow_1', view: MovieClipView },
        arrow_2: { movieClipName: 'arrow_2', view: MovieClipView },
        arrow_3: { movieClipName: 'arrow_3', view: MovieClipView },
        RefreshIcon: { view: MovieClipView, movieClipName: 'refresh_mc' },
        InfoPanelPopup: {
          movieClipName: 'InfoPanelObj',
          view: PickAPowerPopupInforSlideOutView,
          model: this.$model,
          options: {
            isRewardAvailable: this._options.isRewardAvailable
          }
        }
      },
      modelWatch: {
        refreshPowerups: (shouldRefresh: boolean) => {
          if (shouldRefresh) {
            this._rerollDelay = 0.1;
          }
        },
        pickAPowerVisible: (isVisible: boolean) => {
          if (isVisible) {
            this.visible = true;
            this._rerollDelay = 0;

            const btn1 = this.$childViews.get('powerupButton1');
            btn1.alpha = 1;
            btn1.display.interactive = true;

            const btn2 = this.$childViews.get('powerupButton2');
            btn2.alpha = 1;
            btn2.display.interactive = true;

            const btn3 = this.$childViews.get('powerupButton3');
            btn3.alpha = 1;
            btn3.display.interactive = true;

            this._rerollButton.isDisabled = this.$model.restoringProgress
              ? this.$model.userProgress.refreshed
              : this._rerollButton.counter <= 0;
            this.$model.restoringProgress = false;

            this._detailsButton.isDisabled = false;
            this._detailsButton.displayAlternateIcon = false;

            this.rerollPowerupButtons();
            this.alpha = 0;
            this._updatePanelPosition(this.alpha);
            this._movementDirection = 1;

            this._analytics.reward_proposed(this.$model);

            if (
              (GameConstants.VARIANT === 1 && this.$model.currentLevel === 0) ||
              (GameConstants.VARIANT === 2 && this.$model.currentLevel === 1)
            ) {
              this._options.onShowScrim();
            }
            this.checkFue();
          } else {
            this._movementDirection = -1;
            this._options.onHideScrim();
          }
        },
        playerType: (type: PlayerType) => {
          this._rerollButton.subscriber = type === PlayerType.SUBSCRIBER;
        }
      }
    };
  }

  public onInitialize(): void {
    this.$childViews.get('powerupButton_Reroll').visible = this._options.isRewardAvailable;
    this._savedPowerups = this.$model.restoringProgress
      ? this.$model.userProgress.currentPowerupList
      : [];
    this._rerollButton.counter = this.$model.userProgress.refreshCounter;
    this._rerollButton.subscriber = this.$model.playerType === PlayerType.SUBSCRIBER;

    this._refreshIcon = this.$childViews.get('RefreshIcon');
    this._refreshIcon.visible = false;

    this.$model.pickAPowerVisible = false;
    this.visible = false;
    this.framerate = 35;
    this.scaleX = this.scaleY = 0.85;

    this.setUpArrows();
    this.alpha = 0;
    this._updatePanelPosition(this.alpha);
    this.gotoAndStop(0);
  }

  public setUpArrows(): void {
    this._arrows = [
      this.$childViews.get('arrow_1'),
      this.$childViews.get('arrow_2'),
      this.$childViews.get('arrow_3')
    ];
    for (let i = 0; i < this._arrows.length; i++) {
      const arrow = this._arrows[i];
      arrow.visible = false;
      arrow.gotoAndPlay(0);
    }
    this.setArrowsState(false);
  }

  /**
   * Checks First-Time User Experience (FUE) progression to display tutorial arrows.
   */
  public checkFue(): void {
    if (this.$model.fueState.steps[0] !== 1) {
      this.$model.fueState.steps[0] = 1;
      this.$model.saveFueState();
      this.setArrowsState(true);
    } else if (!this.$model.fueState.steps[1]) {
      this._helperTimer = 10;
    }
  }

  public setArrowsState(isVisible: boolean): void {
    if (this.gameWidth > this.gameHeight) {
      this._arrows[1].visible = isVisible;
    } else {
      this._arrows[0].visible = isVisible;
    }
  }

  public resetHelperTimer(): void {
    this._helperTimer = 0;
    this.setArrowsState(false);
  }

  public onUpdate(deltaTime: number): void {
    if (!this.visible) {
      return;
    }

    if (this._helperTimer > 0) {
      this._helperTimer -= deltaTime;
      if (this._helperTimer <= 0) {
        this._helperTimer = 0;
        this.$model.fueState.steps[1] = 1;
        this.$model.saveFueState();
        this.setArrowsState(true);
      }
    }

    if (this._rerollDelay > 0) {
      this._rerollDelay -= deltaTime;
      if (this._rerollDelay <= 0) {
        this._rerollDelay = 0;
        this.animateReroll();
      }
    }

    if (this._movementDirection !== 0) {
      this.alpha += 2 * deltaTime * this._movementDirection;
      if (this.alpha > 1) {
        this.alpha = 1;
        this._movementDirection = 0;
      } else if (this.alpha < 0) {
        this.alpha = 0;
        this._movementDirection = 0;
        this.visible = false;
      }
    }

    this._updatePanelPosition(this.alpha);
  }

  /**
   * Slides the panel in/out from the top wall (portrait) or right wall (landscape).
   */
  public _updatePanelPosition(alpha: number): void {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    const offset = 400 * MathUtil.easeInOutQuadratic(1 - this.alpha);

    if (this._isVerticalView) {
      this.y = this._topWallPosition - offset;
      this.x = 0;
    } else {
      this.x = this._rightWallPosition + offset;
      this.y = 0;
    }
  }

  public _buildChildrenButtons(): void {
    this._powerupButtons = [
      this.$childViews.get('powerupButton1'),
      this.$childViews.get('powerupButton2'),
      this.$childViews.get('powerupButton3')
    ];
    this._rerollButton.mainText.value = 'button.reroll';
    this._detailsButton.mainText.value = 'button.details';
    this._infoPanelObject = this.$childViews.get('InfoPanelPopup');
    this._infoPanelObject.showPanel(false, true);
    this._infoPanelObject.setVertical(this._isVerticalView);
  }

  /**
   * Selects 3 unique powerups to present to the player using either FUE fixed presets,
   * saved progress state, or weighted random probability based on `rarityCurrentWeight`.
   */
  public rerollPowerupButtons(isReroll: boolean = false): void {
    if (this._powerupButtons == null) {
      this._buildChildrenButtons();
    }

    const chosenIndices: number[] = [-1, -1, -1];
    const allPowerups = this.$model.ActiveLevelList.gameSpec.powerups;

    if (this.$model.newUser && this.$model.currentLevel <= 1 && !isReroll) {
      if (this.$model.currentLevel === 0) {
        chosenIndices[0] = 0;
        chosenIndices[1] = 18;
        chosenIndices[2] = 8;
      } else if (this.$model.currentLevel === 1) {
        chosenIndices[0] = 3;
        chosenIndices[1] = 13;
        chosenIndices[2] = 10;
      }

      for (let i = 0; i < 3; ++i) {
        const powerupDef = allPowerups[chosenIndices[i]];
        this._powerupButtons![i].UpdatePowerupInfo(powerupDef);
        this._infoPanelObject.updateButton(i + 1, powerupDef);
      }
    } else if (this._savedPowerups && this._savedPowerups.length > 0) {
      for (let i = 0; i < this._savedPowerups.length; i++) {
        const savedIdx = this._savedPowerups[i];
        const powerupDef = allPowerups[savedIdx];
        this._powerupButtons![i].UpdatePowerupInfo(powerupDef);
        this._infoPanelObject.updateButton(i + 1, powerupDef);
        chosenIndices[i] = savedIdx;
      }
      this._savedPowerups = [];
    } else {
      let totalWeight = 0;
      for (let i = 0; i < allPowerups.length; ++i) {
        totalWeight += allPowerups[i].rarityCurrentWeight;
      }

      const numPresented = this.$model.ActiveLevelList.gameSpec.powerupsPresented;
      for (let slot = 0; slot < numPresented; ++slot) {
        let randomRoll = Math.random() * totalWeight;
        for (let idx = 0; idx < allPowerups.length; ++idx) {
          const powerupDef = allPowerups[idx];
          randomRoll -= powerupDef.rarityCurrentWeight;
          if (randomRoll < 0) {
            if (idx === chosenIndices[0] || idx === chosenIndices[1]) {
              slot--;
              break;
            }
            chosenIndices[slot] = idx;
            this._powerupButtons![slot].UpdatePowerupInfo(powerupDef);
            this._infoPanelObject.updateButton(slot + 1, powerupDef);
            break;
          }
        }
      }
    }

    this.$model.saveProgress(false, {
      refreshCounter: this._rerollButton.counter,
      refreshed: this._rerollButton.isDisabled,
      currentPowerups: chosenIndices
    });

    if (isReroll) {
      this._analytics.reward_newSet(
        allPowerups[chosenIndices[0]].name,
        allPowerups[chosenIndices[1]].name,
        allPowerups[chosenIndices[2]].name
      );
    } else {
      this._analytics.round_start(
        this.$model,
        allPowerups[chosenIndices[0]].name,
        allPowerups[chosenIndices[1]].name,
        allPowerups[chosenIndices[2]].name
      );
    }
  }

  public onSetLandscape(): void {
    if (this.firstResize) {
      this.firstResize = false;
      this.onResize(this.gameWidth, this.gameHeight, this.gameScale);
    }
  }

  public onSetPortrait(): void {
    if (this.firstResize) {
      this.firstResize = false;
      this.onResize(this.gameWidth, this.gameHeight, this.gameScale);
    }
  }

  public onResize(width: number, height: number, scale: number): void {
    super.onResize(width, height, scale);
    this.gameScale = scale;
    this.gameWidth = width;
    this.gameHeight = height;
    this._rightWallPosition = this.gameWidth / scale / 2;
    this._topWallPosition = -this.gameHeight / scale / 2;
    this.setVertical(this.gameWidth < this.gameHeight);
  }

  public setVertical(isVertical: boolean): void {
    this._isVerticalView = isVertical;
    if (this._isVerticalView) {
      const scaledWidth = this.gameWidth / this.gameScale;
      const aspectRatio = this.gameHeight / this.gameScale / scaledWidth;
      this.gotoAndStop(aspectRatio > 1.6 ? 2 : 1);
    } else {
      this.gotoAndStop(0);
    }

    this._updatePanelPosition(this.alpha);
    if (this._infoPanelObject != null) {
      this._infoPanelObject.setVertical(isVertical);
    }
  }

  /**
   * Animates the outer powerup buttons collapsing into the center button before spinning the refresh icon.
   */
  public animateReroll(): void {
    this.setButtonsState(false);
    if (this.$model.currentLevel === 0) {
      this._options.onShowScrim();
    }

    const centerCoord = this._isVerticalView
      ? this._powerupButtons![1].x
      : this._powerupButtons![1].y;

    this._savedPosition = {
      pos1: this._isVerticalView ? this._powerupButtons![0].x : this._powerupButtons![0].y,
      pos2: this._isVerticalView ? this._powerupButtons![2].x : this._powerupButtons![2].y
    };

    const tweenState = {
      pos1: this._savedPosition.pos1,
      pos2: this._savedPosition.pos2,
      textAlpha: 1
    };

    new Tween(tweenState)
      .to({ pos1: centerCoord, pos2: centerCoord, textAlpha: 0 }, 200)
      .onUpdate(() => {
        this._powerupButtons![0].setTextAlpha(tweenState.textAlpha);
        this._powerupButtons![1].setTextAlpha(tweenState.textAlpha);
        this._powerupButtons![2].setTextAlpha(tweenState.textAlpha);

        if (this._isVerticalView) {
          this._powerupButtons![0].x = tweenState.pos1;
          this._powerupButtons![2].x = tweenState.pos2;
        } else {
          this._powerupButtons![0].y = tweenState.pos1;
          this._powerupButtons![2].y = tweenState.pos2;
        }
      })
      .onComplete(() => this.animateRefreshIcon_alpha())
      .start();
  }

  public animateRefreshIcon_alpha(): void {
    this._refreshIcon.alpha = 0;
    this._refreshIcon.visible = true;

    const tweenState = { alpha: 0, rotation: 0 };
    new Tween(tweenState)
      .to({ alpha: 1, rotation: -2 }, 200)
      .onUpdate(() => {
        this._refreshIcon.alpha = tweenState.alpha;
        this._refreshIcon.rotation = tweenState.rotation;
      })
      .onComplete(() => this.animateRefreshIcon_rotation())
      .start();
  }

  public animateRefreshIcon_rotation(): void {
    let hasRerolledMidSpin = false;
    const tweenState = {
      rotation: this._refreshIcon.rotation,
      progress: 0
    };

    new Tween(tweenState)
      .to({ rotation: this._refreshIcon.rotation - 10, progress: 1 }, 1000)
      .onUpdate(() => {
        this._refreshIcon.rotation = tweenState.rotation;
        if (tweenState.progress > 0.5 && !hasRerolledMidSpin) {
          hasRerolledMidSpin = true;
          this.rerollPowerupButtons(true);
        }
      })
      .onComplete(() => this.animateRerollBack())
      .start();
  }

  /**
   * Animates the 3 powerup buttons back out to their original positions after a reroll.
   */
  public animateRerollBack(): void {
    const centerCoord = this._isVerticalView
      ? this._powerupButtons![1].x
      : this._powerupButtons![1].y;

    const buttonTweenState = {
      pos1: centerCoord,
      pos2: centerCoord,
      textAlpha: 0
    };

    new Tween(buttonTweenState)
      .to(
        {
          pos1: this._savedPosition.pos1,
          pos2: this._savedPosition.pos2,
          textAlpha: 1
        },
        200
      )
      .onUpdate(() => {
        this._powerupButtons![0].setTextAlpha(buttonTweenState.textAlpha);
        this._powerupButtons![1].setTextAlpha(buttonTweenState.textAlpha);
        this._powerupButtons![2].setTextAlpha(buttonTweenState.textAlpha);

        if (this._isVerticalView) {
          this._powerupButtons![0].x = buttonTweenState.pos1;
          this._powerupButtons![2].x = buttonTweenState.pos2;
        } else {
          this._powerupButtons![0].y = buttonTweenState.pos1;
          this._powerupButtons![2].y = buttonTweenState.pos2;
        }
      })
      .start();

    const iconTweenState = {
      alpha: 1,
      rotation: this._refreshIcon.rotation
    };

    new Tween(iconTweenState)
      .to({ alpha: 0, rotation: this._refreshIcon.rotation - 2 }, 200)
      .onUpdate(() => {
        this._refreshIcon.alpha = iconTweenState.alpha;
        this._refreshIcon.rotation = iconTweenState.rotation;
      })
      .onComplete(() => {
        this._refreshIcon.visible = false;
        this.setButtonsState(true);
      })
      .start();
  }

  public setButtonsState(isInteractive: boolean): void {
    this.$childViews.get('powerupButton1').display.interactive = isInteractive;
    this.$childViews.get('powerupButton2').display.interactive = isInteractive;
    this.$childViews.get('powerupButton3').display.interactive = isInteractive;
  }
}
