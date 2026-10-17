/**
 * Kinematics Simulation Module: LevelRootView_Physics_Box2D
 * Webpack Module ID: 0x4577
 * Original File: main.min.js
 */

import {
  AnimateViewBase,
  Inject,
  IArenaApi,
  PIXIRenderer,
  ContainerView,
  Environment,
  EnvironmentTypeEnum,
  Tween,
  Easing
} from './framework/Core';
import { GameplayLogic } from './logic/GameplayLogic';
import { AnimateContents } from './constants/AnimateContents';
import { PhysicalObjectBase } from './views/PhysicalObjectBase';
import { KinematicsPuckModel } from './models/KinematicsPuckModel';
import { LatticePegModel } from './models/LatticePegModel';
import { BottomBucketAssemblyView } from './views/BottomBucketAssemblyView';
import { PegElementView } from './views/PegElementView';
import { PhysicalObjectModel } from './models/PhysicalObjectModel';
import { gamePuckElementView } from './views/gamePuckElementView';
import { gamePuckTrailView } from './views/gamePuckTrailView';
import { playfieldWallView } from './views/playfieldWallView';
import { PlayfieldWallModel } from './models/PlayfieldWallModel';
import { FloatingPointsView } from './views/FloatingPointsView';
import { PegParticleBurstView } from './views/PegParticleBurstView';
import { GameBoardView } from './GameBoardView_Collisions';
import { ChipDroperAssemblyView } from './views/ChipDroperAssemblyView';
import { GenericEffectView } from './views/GenericEffectView';
import { MessageTextEffectView } from './views/MessageTextEffectView';
import { ChipMessageTextEffectView } from './views/ChipMessageTextEffectView';
import { WallMultiplierTextView } from './views/WallMultiplierTextView';
import { TeleportStartEffectView } from './views/TeleportStartEffectView';
import { ChipBreaksEffectView } from './views/ChipBreaksEffectView';
import { PocketScoreEffectView } from './views/PocketScoreEffectView';
import { InstantMultEffectView } from './views/InstantMultEffectView';
import { GameAnalytics } from './analytics/GameAnalytics';
import { FueArrow } from './views/FueArrow';
import { GameConstants } from './constants/GameConstants';
import * as Planck from 'planck-js';

/**
 * Manages the active kinematics lattice playfield, Planck.js (Box2D) physics world simulation,
 * collision event routing, magnetic peg forces, chip spawning, and visual effects.
 */
export class LevelRootView extends AnimateViewBase {
  private _options: any;
  public gameLogic: GameplayLogic;
  private _arenaAPI: IArenaApi;
  private _analytics: GameAnalytics;
  public pixiRenderer: PIXIRenderer;

  public timeFromLastLogicFrame: number = 0;
  public registeredPuckSpawns: number[] = [];
  public loadedElementDefinition: any = undefined;
  public worldCenterPointX: number = 0;
  public worldCenterPointY: number = 0;
  public levelScale: number = 1;
  public levelBasePositionX: number = 0;
  public levelBasePositionY: number = 0;

  public notLoadedYet: boolean = true;
  public waitingForChildren: boolean = true;
  public currentBallIndex: number = 0;
  public currentTime: number = 0;
  public currentPointsIndex: number = 0;
  public deadObjArray: any[] = [];
  public currentPhysicsWorld: Planck.World | undefined = undefined;

  public firstResize: boolean = true;
  public gameScale: number = 1;
  public gameWidth: number = 1;
  public gameHeight: number = 1;
  public screenSizeSet: boolean = false;

  private _fueTimer: number = -1;
  private _currentFueStep: number = 0;
  private _fueElementToShow: string = '';
  private _editScale: number = 1;
  private _xPositionForPortrait: number = -300;
  private _pegViews: any;
  private _wallViews: any;
  private _scalingTween: Tween | null = null;

  constructor(
    @Inject options: any,
    @Inject gameLogic: GameplayLogic,
    @Inject arenaAPI: IArenaApi,
    @Inject analytics: GameAnalytics,
    @Inject pixiRenderer: PIXIRenderer
  ) {
    super('LevelRootView');
    this._options = options;
    this.gameLogic = gameLogic;
    this._arenaAPI = arenaAPI;
    this._analytics = analytics;
    this.pixiRenderer = pixiRenderer;
  }

  /**
   * Initializes the Planck.js physics world, registers collision listeners,
   * and parses the 2D `LevelLayout` grid to instantiate pegs, walls, and buckets.
   */
  public getConfiguration(): any {
    this.loadedElementDefinition = this._options.loadedElementDefinition;
    (Planck as any).internal.Settings.velocityThreshold = 0;

    const gravityVec = Planck.Vec2(
      0,
      this.loadedElementDefinition.physicalWorld.gravity *
        this.loadedElementDefinition.physicalWorld.gravityMultiplier
    );
    this.currentPhysicsWorld = Planck.World(gravityVec);
    this.currentPhysicsWorld.on('begin-contact', this.handleCollisionBegin);
    this.currentPhysicsWorld.on('end-contact', this.handleCollisionEnd);
    this.currentPhysicsWorld.on('pre-solve', this.handlePhysicsCollision);

    const childViews: Record<string, any> = {};
    const playfieldModel = new PhysicalObjectModel(1);
    playfieldModel.gameplayModel = this.$model;

    childViews.playfield_object = {
      animateContent: AnimateContents.BOARD_BITS,
      symbolName: 'Board_MC',
      view: GameBoardView,
      model: playfieldModel,
      options: {
        currentLevelRoot: this,
        parent: undefined,
        physicalDef: 'playfield',
        positionX: 1200,
        positionY: 2075,
        adjustScale: true,
        extraScalePercent: 1,
        index: 0,
        startingVelocity: undefined
      }
    };

    childViews.puck_trail_layer = {
      view: ContainerView,
      model: this.$model
    };

    this.$model.currentPegList = [];
    this.$model.currentWallList = [];

    const levelLayout: number[][] = this.loadedElementDefinition.general.LevelLayout;
    const gridSepX: number = this.loadedElementDefinition.general.levelGridSeparationX;
    const gridSepY: number = this.loadedElementDefinition.general.levelGridSeparationY;

    for (let row = 0; row < levelLayout.length; ++row) {
      for (let col = 0; col < levelLayout[row].length; ++col) {
        const cellType = levelLayout[row][col];

        if (cellType === 1) {
          // Standard Peg slot
          const pegModel = new LatticePegModel();
          pegModel.gameplayModel = this.$model;
          const posX = col * gridSepX;
          const posY = row * gridSepY;
          const pegIndex = row * levelLayout[row].length + col;

          childViews[`PlayfieldPeg_${pegIndex}`] = {
            animateContent: AnimateContents.BOARD_BITS,
            symbolName: 'Peg_MC',
            view: PegElementView,
            model: pegModel,
            options: {
              currentLevelRoot: this,
              pegType: 0,
              positionX: posX,
              positionY: posY,
              index: pegIndex,
              onClick: () => this.hideFueArrow()
            }
          };
          this.$model.currentPegList.push(pegModel);
        } else if (cellType === 3) {
          // Bottom Scoring Bucket Assembly
          childViews.mainBottomBucketObj = {
            view: BottomBucketAssemblyView,
            model: this.$model,
            options: {
              currentLevelRoot: this,
              positionX: col * gridSepX,
              positionY: row * gridSepY,
              onCollect: (bucket: any) => {}
            }
          };
        } else if (cellType === 7) {
          // Playfield Wall Pair (Down then Up)
          let posX = (col - 0.5) * gridSepX;
          const posY = row * gridSepY;
          let wallIndex = 2 * (row * levelLayout[row].length + col);

          const firstWallModel = new PlayfieldWallModel();
          this.$model.currentWallList.push(firstWallModel);
          firstWallModel.gameplayModel = this.$model;

          childViews[`PlayfieldWall${wallIndex}`] = {
            animateContent: AnimateContents.BOARD_BITS,
            symbolName: 'PlayfieldWall_MC',
            view: playfieldWallView,
            model: firstWallModel,
            options: {
              currentLevelRoot: this,
              pegType: 0,
              positionX: posX,
              positionY: posY,
              wallObj: 'playfieldWallDown',
              index: wallIndex,
              isDownWall: true,
              onClick: () => this.hideFueArrow()
            }
          };

          posX += gridSepX;
          ++wallIndex;

          const secondWallModel = new PlayfieldWallModel();
          this.$model.currentWallList.push(secondWallModel);
          secondWallModel.gameplayModel = this.$model;

          childViews[`PlayfieldWall${wallIndex}`] = {
            animateContent: AnimateContents.BOARD_BITS,
            symbolName: 'PlayfieldWall_MC',
            view: playfieldWallView,
            model: secondWallModel,
            options: {
              currentLevelRoot: this,
              pegType: 0,
              positionX: posX,
              positionY: posY,
              wallObj: 'playfieldWallUp',
              index: wallIndex,
              isDownWall: false,
              onClick: () => this.hideFueArrow()
            }
          };
        } else if (cellType === 8) {
          // Playfield Wall Pair (Up then Down)
          let posX = (col - 0.5) * gridSepX;
          const posY = row * gridSepY;
          let wallIndex = 2 * (row * levelLayout[row].length + col);

          const firstWallModel = new PlayfieldWallModel();
          this.$model.currentWallList.push(firstWallModel);
          firstWallModel.gameplayModel = this.$model;

          childViews[`PlayfieldWall${wallIndex}`] = {
            animateContent: AnimateContents.BOARD_BITS,
            symbolName: 'PlayfieldWall_MC',
            view: playfieldWallView,
            model: firstWallModel,
            options: {
              currentLevelRoot: this,
              pegType: 0,
              positionX: posX,
              positionY: posY,
              wallObj: 'playfieldWallUp',
              index: wallIndex,
              isDownWall: false,
              onClick: () => this.hideFueArrow()
            }
          };

          posX += gridSepX;
          ++wallIndex;

          const secondWallModel = new PlayfieldWallModel();
          this.$model.currentWallList.push(secondWallModel);
          secondWallModel.gameplayModel = this.$model;

          childViews[`PlayfieldWall${wallIndex}`] = {
            animateContent: AnimateContents.BOARD_BITS,
            symbolName: 'PlayfieldWall_MC',
            view: playfieldWallView,
            model: secondWallModel,
            options: {
              currentLevelRoot: this,
              pegType: 0,
              positionX: posX,
              positionY: posY,
              wallObj: 'playfieldWallDown',
              index: wallIndex,
              isDownWall: true,
              onClick: () => this.hideFueArrow()
            }
          };
        }
      }
    }

    childViews.effects_layer = {
      view: ContainerView,
      model: this.$model
    };

    childViews.ballSpawnTouchElement = {
      view: ChipDroperAssemblyView,
      model: this.$model,
      options: {
        currentLevelRoot: this,
        positionX: 1320,
        positionY: 1800,
        width: this.$model.ActiveLevelList.gameSpec.defaultDropWidth,
        height: 6000,
        showChipInTubeAnim: true,
        onSpawnPuck: (spawnX: number) => {
          this.registeredPuckSpawns.push(spawnX);
        }
      }
    };

    this.worldCenterPointX = ((levelLayout[0].length - 1) / 2) * gridSepX;
    this.worldCenterPointY = ((levelLayout.length - 1) / 2) * gridSepY;
    this.levelScale = 0.2;

    return {
      childViews: childViews,
      modelWatch: {
        pegsInteractable: (isInteractable: boolean) => {
          if (isInteractable) {
            this.checkFue('peg');
          }
          this.setBoardScale(isInteractable);
        },
        wallsAddInteractable: (isInteractable: boolean) => {
          if (isInteractable) {
            this.checkFue('wall');
          }
          this.setBoardScale(isInteractable);
        }
      }
    };
  }

  public checkFue(elementType: string): void {
    this._fueElementToShow = elementType;
    if (this.$model.fueState.steps[2]) {
      if (!this.$model.fueState.steps[3]) {
        this._currentFueStep = 3;
        this._fueTimer = 10;
      }
    } else {
      this._currentFueStep = 2;
      this._fueTimer = 0.1;
    }
  }

  /**
   * Spawns a kinematic test particle at the specified X coordinate at the top of the board (`y = -200`)
   * with a random horizontal drop variance impulse.
   */
  public spawnChipInPoint(spawnX: number): void {
    if (this.$model.currentPuckList.length > 0) {
      const puckFlags = this.$model.currentPuckList[0];
      const isGolden = (puckFlags & 1) !== 0;
      const isLucky = (puckFlags & 2) !== 0;

      this.$model.shiftChipsList();

      const horizontalImpulse =
        (Math.random() - 0.5) * this.$model.ActiveLevelList.gameSpec.dropHorrizontalVariance;

      const ballModel = this.SpawnBall(
        ++this.currentBallIndex,
        spawnX,
        -200,
        undefined,
        isGolden,
        isLucky,
        horizontalImpulse
      );
      this.$model.ActiveBallList.push(ballModel);
      this._analytics.move();
    }
  }

  public onInitialize(): void {
    this.notLoadedYet = true;
    this.waitingForChildren = true;
    this.x = -241;
    this.y = -400;
    this.scaleX = this.levelScale;
    this.scaleY = this.levelScale;

    this.$model.registerLogicObject(this, false);
    this.$model.physicToPixelScale =
      this.loadedElementDefinition.physicalWorld.worldToPixelScale;

    this._pegViews = this.$childViews.items.Where((item: any) => {
      return item.viewName === 'PegElementView';
    });

    this._wallViews = this.$childViews.items.Where((item: any) => {
      return item.viewName === 'playfieldWallView';
    });
  }

  /**
   * Applies attractive magnetic forces from nearby magnetic pegs (`currentPegType === 1`)
   * to each active kinematic test particle in the physics world.
   */
  public executeAdditionalPhysics(deltaTime: number): void {
    const activeBalls = this.$model.ActiveBallList;
    for (let i = 0; i < activeBalls.length; ++i) {
      const ball = activeBalls[i];
      if (ball.magnetList != null) {
        for (let m = 0; m < ball.magnetList.Count(); ++m) {
          const magnetPeg = ball.magnetList.ElementAt(m);
          if (magnetPeg.currentPegType === 1) {
            if (magnetPeg.isMagnetOn) {
              const ballPos = new Planck.Vec2(ball.x, ball.y);
              const pegPos = new Planck.Vec2(magnetPeg.x, magnetPeg.y);
              const direction = Planck.Vec2.sub(pegPos, ballPos);

              if (direction.lengthSquared() < Planck.Math.EPSILON * Planck.Math.EPSILON) {
                return;
              }

              direction.normalize();
              const force = Planck.Vec2.mul(
                direction,
                magnetPeg.currentPowerupDef.parameter.magneticPegForce
              );
              ball.currentPhysicsBody.applyForce(force, ballPos, false);

              if (!this.$model.puckSearchActive) {
                this.$model._puckSearchTime = 0;
              }
            }
          } else {
            ball.magnetList.Remove(magnetPeg);
          }
        }
      }
    }
  }

  public executeAllLogic(deltaTime: number): void {
    if (this.currentPhysicsWorld != null) {
      this.executeAdditionalPhysics(deltaTime);
      this.currentPhysicsWorld.step(deltaTime);
      this.currentPhysicsWorld.clearForces();
    }
  }

  /**
   * Steps the Planck physics simulation (`stepMultiplier` sub-steps per logic tick),
   * processes queued puck spawns, and updates all peg models.
   */
  public executeLogic(deltaTime: number): void {
    if (this.currentPhysicsWorld != null) {
      const stepMultiplier = this.loadedElementDefinition.physicalWorld.stepMultiplier;
      for (let step = 0; step < stepMultiplier; ++step) {
        this.executeAdditionalPhysics(deltaTime);
        this.currentPhysicsWorld.step(deltaTime);
        this.currentPhysicsWorld.clearForces();
      }
    }

    if (this.registeredPuckSpawns.length > 0) {
      for (let i = 0; i < this.registeredPuckSpawns.length; ++i) {
        this.spawnChipInPoint(this.registeredPuckSpawns[i]);
      }
      this.registeredPuckSpawns = [];
    }

    if (this.$model.puckSpawnList != null && this.$model.puckSpawnList.length > 0) {
      for (let i = 0; i < this.$model.puckSpawnList.length; ++i) {
        const puckToSpawn = this.$model.puckSpawnList[i];
        this.SpawnBall(
          ++this.currentBallIndex,
          puckToSpawn.x,
          puckToSpawn.y,
          puckToSpawn,
          false,
          false,
          0
        );
        this.$model.ActiveBallList.push(puckToSpawn);
      }
      this.$model.puckSpawnList = [];
    }

    for (let i = 0; i < this.$model.currentPegList.length; ++i) {
      this.$model.currentPegList[i].executeLogic(deltaTime);
    }
  }

  public _forceProgramSleep(targetFps: number): void {
    const frameDurationMs = 1000 / targetFps;
    const startTime = new Date().getTime();
    while (new Date().getTime() < startTime + frameDurationMs) {
      // Busy-wait sleep for debugging framerate
    }
  }

  /**
   * Per-frame update handler: initializes Lucky Board / restored board upgrades once children load,
   * runs fixed-timestep (0.03s) physics updates, and spawns particle/floating-point effects.
   */
  public onUpdate(deltaTime: number): void {
    if (this.screenSizeSet && this.notLoadedYet) {
      this.loadLevel();
    }

    if (this.waitingForChildren) {
      for (let i = 0; i < this.$model.currentPegList.length; ++i) {
        if (!this.$model.currentPegList[i].isLoaded) {
          return;
        }
      }

      this.waitingForChildren = false;
      this.gameLogic.levelStarting();

      if (GameConstants.VARIANT === 2) {
        const powerups = this.$model.ActiveLevelList.gameSpec.powerups;

        if (this.$model.newUser) {
          this._pegViews.ElementAt(11).view.addPower(powerups[11]);
          this._pegViews.ElementAt(24).view.addPower(powerups[4]);
          this._pegViews.ElementAt(36).view.addPower(powerups[4]);
          this._wallViews.ElementAt(47).view.addPower(powerups[2]);
          this._wallViews.ElementAt(65).view.addPower(powerups[3]);
          this._wallViews.ElementAt(121).view.addPower(powerups[2]);
          this._wallViews.ElementAt(144).view.addPower(powerups[2]);
        } else if (this.$model.restoringProgress) {
          const userProgress = this.$model.userProgress;
          userProgress.currentPegList.forEach((pegData: any, index: number) => {
            if (pegData.type !== 0) {
              this._pegViews.ElementAt(index).view.addPower(powerups[pegData.type]);
            }
          });
          userProgress.currentWallList.forEach((wallData: any, index: number) => {
            if (wallData.type !== 0) {
              this._wallViews.ElementAt(index).view.addPower(powerups[wallData.type]);
            }
          });
          userProgress.currentBacketList.forEach((bucketData: any, index: number) => {
            const bucketModel = this.$model[`bucket${index + 1}Obj`];
            if (bucketData.type !== 0) {
              bucketModel.currentBucketType = 14;
              bucketModel.currentPowerupDef = powerups[bucketData.type];
            }
            if (bucketData.multiplayer) {
              bucketModel.isMultiplierBucket = true;
              bucketModel.multiplyValue = bucketData.multiplyValue;
            }
            bucketModel.bucketValue = bucketData.value;
            bucketModel.defaultScore = bucketData.value;
          });
        } else if (this.$model.luckyBoard) {
          // Populate random starting upgrades for Lucky Board mode
          const randomWall1 = 56 + Math.floor(100 * Math.random());
          this._wallViews
            .ElementAt(randomWall1)
            .view.addPower(Math.random() > 0.5 ? powerups[3] : powerups[2]);

          const randomWall2 = 56 + Math.floor(100 * Math.random());
          this._wallViews
            .ElementAt(randomWall2)
            .view.addPower(Math.random() > 0.5 ? powerups[3] : powerups[2]);

          if (Math.random() > 0.5) {
            const randomWall3 = 56 + Math.floor(100 * Math.random());
            this._wallViews
              .ElementAt(randomWall3)
              .view.addPower(Math.random() > 0.5 ? powerups[3] : powerups[2]);
          }

          this._pegViews.ElementAt(15 + Math.floor(80 * Math.random())).view.addPower(powerups[4]);
          this._pegViews.ElementAt(15 + Math.floor(80 * Math.random())).view.addPower(powerups[4]);

          if (Math.random() > 0.5) {
            this._pegViews.ElementAt(15 + Math.floor(80 * Math.random())).view.addPower(powerups[4]);
          }
          if (Math.random() > 0.5) {
            this._pegViews.ElementAt(15 + Math.floor(80 * Math.random())).view.addPower(powerups[4]);
          }

          const bonusRoll = Math.random();
          if (bonusRoll < 0.25) {
            const bucketIdx = Math.floor(9 * Math.random());
            const targetBucket =
              bucketIdx <= 0
                ? this.$model.bucket1Obj
                : bucketIdx <= 1
                ? this.$model.bucket2Obj
                : bucketIdx <= 2
                ? this.$model.bucket3Obj
                : bucketIdx <= 5
                ? this.$model.bucket5Obj
                : bucketIdx <= 6
                ? this.$model.bucket7Obj
                : bucketIdx <= 7
                ? this.$model.bucket8Obj
                : this.$model.bucket9Obj;
            targetBucket.currentBucketType = 14;
            targetBucket.currentPowerupDef = powerups[14];
          } else if (bonusRoll < 0.5) {
            const bucketIdx = Math.floor(9 * Math.random());
            const targetBucket =
              bucketIdx <= 0
                ? this.$model.bucket1Obj
                : bucketIdx <= 1
                ? this.$model.bucket2Obj
                : bucketIdx <= 2
                ? this.$model.bucket3Obj
                : bucketIdx <= 4
                ? this.$model.bucket4Obj
                : bucketIdx <= 5
                ? this.$model.bucket6Obj
                : bucketIdx <= 6
                ? this.$model.bucket7Obj
                : bucketIdx <= 7
                ? this.$model.bucket8Obj
                : this.$model.bucket9Obj;
            targetBucket.isMultiplierBucket = true;
            targetBucket.multiplyValue += 1;
          } else if (bonusRoll < 0.75) {
            this._pegViews
              .ElementAt(38 + Math.floor(36 * Math.random()))
              .view.addPower(powerups[13]);
          } else if (Math.random() > 0.5) {
            this._pegViews
              .ElementAt(38 + Math.floor(36 * Math.random()))
              .view.addPower(powerups[11]);
          } else {
            this._wallViews
              .ElementAt(56 + Math.floor(83 * Math.random()))
              .view.addPower(powerups[12]);
          }
        }
      }

      this._analytics.gameplayReady();
    }

    for (let i = 0; i < this.deadObjArray.length; ++i) {
      if (this.deadObjArray[i] != null) {
        this.removeChild(this.deadObjArray[i]);
      }
    }
    this.deadObjArray = [];

    // Fixed timestep physics accumulator (0.03s per logic tick)
    if (this.$model.isBroweserInFocus) {
      this.timeFromLastLogicFrame += deltaTime;
      const fixedTimeStep = 0.03;
      if (this.timeFromLastLogicFrame >= fixedTimeStep) {
        while (this.timeFromLastLogicFrame >= fixedTimeStep) {
          this.timeFromLastLogicFrame -= fixedTimeStep;
        }
        this.$model.renderPhase = this.timeFromLastLogicFrame / fixedTimeStep;
        this.$model.executeLogic(fixedTimeStep);
      } else {
        this.$model.renderPhase = this.timeFromLastLogicFrame / fixedTimeStep;
      }
    }

    if (
      this.$model.floatingPointsSpawnList != null &&
      this.$model.floatingPointsSpawnList.length > 0
    ) {
      for (let i = 0; i < this.$model.floatingPointsSpawnList.length; ++i) {
        const pointData = this.$model.floatingPointsSpawnList[i];
        if (pointData.hitPeg) {
          this.spawnParticleBurstOnPegHit(pointData.x, pointData.y + 150);
        }
        this.spawnFloatingPoints(pointData);
      }
      this.$model.floatingPointsSpawnList = [];
    }

    if (this.$model.effectsSpawnList != null && this.$model.effectsSpawnList.length > 0) {
      for (let i = 0; i < this.$model.effectsSpawnList.length; ++i) {
        this.spawnEffect(this.$model.effectsSpawnList[i]);
      }
      this.$model.effectsSpawnList = [];
    }

    if (this._fueTimer > -1) {
      this._fueTimer -= deltaTime;
      if (this._fueTimer <= 0) {
        if (this._currentFueStep !== 0) {
          this.$model.fueState.steps[this._currentFueStep] = 1;
          this.$model.saveFueState();
        }
        this.showFueArrow(this._fueElementToShow);
        this._fueTimer = -1;
      }
    }
  }

  public getPhysicsWorld(): Planck.World | undefined {
    return this.currentPhysicsWorld;
  }

  public getPhisicsToPixelScale(): number {
    return this.loadedElementDefinition.physicalWorld.worldToPixelScale;
  }

  public loadLevel(): void {
    this.notLoadedYet = false;
  }

  /**
   * Instantiates a kinematic test particle (`gamePuckElementView`) and its motion trail (`gamePuckTrailView`).
   */
  public SpawnBall(
    ballIndex: number,
    posX: number,
    posY: number,
    existingModel?: KinematicsPuckModel,
    isGolden?: boolean,
    isLucky?: boolean,
    horizontalImpulse?: number
  ): KinematicsPuckModel {
    let puckModel = existingModel;
    if (puckModel == null) {
      puckModel = new KinematicsPuckModel();
      puckModel.currentPuckType = 0;
      puckModel.currentPuckType |= isGolden ? 1 : 0;
      puckModel.currentPuckType |= isLucky ? 2 : 0;
      puckModel.x = posX;
      puckModel.y = posY;
      puckModel.prevX = posX;
      puckModel.prevY = posY;
    }

    const trailLayer = this.$childViews.get('puck_trail_layer');
    trailLayer.addChild(
      {
        view: gamePuckTrailView,
        model: puckModel,
        options: {
          parentContainer: trailLayer
        }
      },
      `PlayerBallTrail_${ballIndex}`
    );

    this.addChild(
      {
        view: gamePuckElementView,
        animateContent: AnimateContents.BOARD_BITS,
        symbolName: 'Chip_MC',
        model: puckModel,
        options: {
          currentLevelRoot: this,
          positionX: posX,
          positionY: posY,
          index: ballIndex,
          horizontalImpulse: horizontalImpulse
        }
      },
      `PlayerBall_${ballIndex}`,
      2
    );

    return puckModel;
  }

  public SpawnGenericPhysicsObject(
    index: number,
    posX: number,
    posY: number,
    physicalDef: string
  ): PhysicalObjectModel {
    const objectModel = new PhysicalObjectModel(0);
    this.addChild(
      {
        animateContent: AnimateContents.GAMEPLAY_JSON,
        symbolName: 'GameTilePrefab',
        view: PhysicalObjectBase,
        model: objectModel,
        options: {
          currentLevelRoot: this,
          parent: undefined,
          physicalDef: physicalDef,
          positionX: posX,
          positionY: posY,
          adjustScale: true,
          extraScalePercent: 1,
          index: index,
          startingVelocity: undefined,
          includeChildImage: true
        }
      },
      `GenericObject_${index}`
    );
    return objectModel;
  }

  public spawnParticleBurstOnPegHit(posX: number, posY: number): void {
    const effectsLayer = this.$childViews.get('effects_layer');
    effectsLayer.addChild(
      {
        view: PegParticleBurstView,
        options: { parentContainer: effectsLayer },
        x: posX,
        y: posY
      },
      `PegParticleBurst_${this.currentPointsIndex}`
    );
  }

  public spawnFloatingPoints(floatingPointModel: any): void {
    this.addChild(
      {
        view: FloatingPointsView,
        model: floatingPointModel,
        options: {
          currentLevelRoot: this,
          SpawnX: floatingPointModel.x,
          SpawnY: floatingPointModel.y,
          displayText: floatingPointModel.pointsText,
          Speed: floatingPointModel.speed,
          Scale: floatingPointModel.scale,
          pegModel: floatingPointModel.pegModel
        }
      },
      `FloatingPoints_${this.currentPointsIndex}`
    );
    ++this.currentPointsIndex;
  }

  /**
   * Spawns visual particle and text effects on the `effects_layer` based on effect type ID (1..8).
   */
  public spawnEffect(effectData: any): void {
    const effectsLayer = this.$childViews.get('effects_layer');
    switch (effectData.type) {
      case 0:
        break;

      case 1: {
        const litWallsCount = this.$model.getNumberOfLitWalls();
        if (litWallsCount > 0) {
          const multiplierDelta =
            this.$model.ActiveLevelList.gameSpec.wallMultiplierScale[litWallsCount] -
            this.$model.ActiveLevelList.gameSpec.wallMultiplierScale[litWallsCount - 1];
          effectsLayer.addChild(
            {
              view: WallMultiplierTextView,
              options: {
                parentContainer: effectsLayer,
                amount: multiplierDelta
              },
              x: effectData.x,
              y: effectData.y
            },
            `WallLightMultiplierText_${WallMultiplierTextView.getID()}`
          );
        }
        break;
      }

      case 2:
        effectsLayer.addChild(
          {
            view: TeleportStartEffectView,
            options: { parentContainer: effectsLayer },
            x: effectData.x,
            y: effectData.y
          },
          `TeleportStartEffect_${TeleportStartEffectView.getID()}`
        );
        break;

      case 6:
        effectsLayer.addChild(
          {
            view: ChipBreaksEffectView,
            options: {
              parentContainer: effectsLayer,
              showCore: effectData.floating
            },
            x: effectData.x,
            y: effectData.y
          },
          `ChipExplosionEffect_${ChipBreaksEffectView.getID()}`
        );
        break;

      case 8:
        effectsLayer.addChild(
          {
            view: PocketScoreEffectView,
            options: {
              parentContainer: effectsLayer,
              power: effectData.data
            },
            x: effectData.x,
            y: effectData.y
          },
          `PocketScoreEffect_${PocketScoreEffectView.getID()}`
        );
        break;

      case 7:
        effectsLayer.addChild(
          {
            view: InstantMultEffectView,
            options: {
              parentContainer: effectsLayer,
              scale: effectData.scale
            },
            x: effectData.x,
            y: effectData.y
          },
          `InstantMultEffect_${InstantMultEffectView.getID()}`
        );
        break;

      case 3:
        effectsLayer.addChild(
          {
            view: GenericEffectView,
            options: {
              parentContainer: effectsLayer,
              particleEffectOptions: {
                name: 'TeleportEndEffect',
                imagePaths: [
                  'assets/particles/swirlnew.png',
                  'assets/particles/swirlnew2.png',
                  'assets/particles/swirlnew3.png'
                ],
                particlesConfig: 'BlobResource',
                scale: 2
              }
            },
            x: effectData.x,
            y: effectData.y
          },
          `TeleportEndEffect_${GenericEffectView.getID()}`
        ).scaleY = 0.5;
        break;

      case 4:
        effectsLayer.addChild(
          {
            view: MessageTextEffectView,
            options: {
              parentContainer: effectsLayer,
              text: effectData.data,
              delay: effectData.delay,
              floating: effectData.floating
            },
            x: effectData.x,
            y: effectData.y
          },
          `MessageTextEffect_${MessageTextEffectView.getID()}`
        );
        break;

      case 5:
        effectsLayer.addChild(
          {
            view: ChipMessageTextEffectView,
            options: {
              parentContainer: effectsLayer,
              text: effectData.data,
              Scale: effectData.scale,
              floating: effectData.floating
            },
            x: effectData.x,
            y: effectData.y
          },
          `ChipMessageTextEffect_${ChipMessageTextEffectView.getID()}`
        );
        break;
    }
  }

  /**
   * Planck.js `begin-contact` handler: triggers `onTriggerEnter` when a sensor fixture
   * overlaps a non-sensor fixture.
   */
  public handleCollisionBegin(contact: Planck.Contact, oldManifold?: any): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    if (fixtureA != null && fixtureB != null && fixtureA.isSensor() !== fixtureB.isSensor()) {
      const userDataA: any = fixtureA.getUserData();
      const userDataB: any = fixtureB.getUserData();

      if (userDataA != null) {
        userDataA.onTriggerEnter(userDataB, contact);
      }
      if (userDataB != null) {
        userDataB.onTriggerEnter(userDataA, contact);
      }
    }
  }

  /**
   * Planck.js `end-contact` handler: triggers `onTriggerExit` when a sensor fixture
   * separates from a non-sensor fixture.
   */
  public handleCollisionEnd(contact: Planck.Contact, oldManifold?: any): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    if (fixtureA != null && fixtureB != null && fixtureA.isSensor() !== fixtureB.isSensor()) {
      const userDataA: any = fixtureA.getUserData();
      const userDataB: any = fixtureB.getUserData();

      if (userDataA != null) {
        userDataA.onTriggerExit(userDataB, contact);
      }
      if (userDataB != null) {
        userDataB.onTriggerExit(userDataA, contact);
      }
    }
  }

  /**
   * Planck.js `pre-solve` handler: routes physical collision callbacks (`onCollisionOccured`)
   * between colliding bodies (e.g., chip hitting pegs, walls, or board).
   */
  public handlePhysicsCollision(contact: Planck.Contact, oldManifold?: any): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    if (fixtureA != null && fixtureB != null) {
      const userDataA: any = fixtureA.getUserData();
      const userDataB: any = fixtureB.getUserData();

      if (userDataA != null) {
        userDataA.onCollisionOccured(userDataB, contact);
      }
      if (userDataB != null) {
        userDataB.onCollisionOccured(userDataA, contact);
      }
    }
  }

  public markForRemoval(childView: any): void {
    this.deadObjArray.push(childView);
  }

  public onSetLandscape(): void {
    this.resizeGame();
  }

  public onSetPortrait(): void {
    this.resizeGame();
  }

  public resizeGame(): void {
    if (this.firstResize) {
      this.firstResize = false;
      this.onResize(this.gameWidth, this.gameHeight, this.gameScale);
    }
  }

  public onResize(width: number, height: number, scale: number): void {
    if (this.firstResize) {
      width = 1;
      height = 1;
      scale = 1;
    }
    super.onResize(width, height, scale);
    this.gameScale = scale;
    this.gameWidth = width;
    this.gameHeight = height;
    this.screenSizeSet = true;
    this.setScaleAndPosition();
  }

  public setScaleAndPosition(): void {
    if (this.gameWidth >= this.gameHeight) {
      this.x = -241;
      this.y = -400;
      this.scaleX = this.scaleY = 1 * this.levelScale;
    } else {
      this.removeTween();
      this.x = this._xPositionForPortrait * this._editScale;
      this.y = -500;
      this.scaleX = this.scaleY = 1.25 * this.levelScale * this._editScale;
    }
  }

  public showFueArrow(elementType: string): void {
    let targetElement: any;
    switch (elementType) {
      case 'peg': {
        const availablePegs = this._pegViews.Take(45).Where((item: any) => {
          return item.view.$model.currentPegType === 0;
        });
        targetElement = availablePegs.ElementAt(
          Math.floor(Math.random() * availablePegs.Count())
        );
        break;
      }
      case 'wall': {
        const availableWalls = this._wallViews.Take(45).Where((item: any) => {
          return item.view.$model.currentWallType === 0;
        });
        targetElement = availableWalls.ElementAt(
          Math.floor(Math.random() * availableWalls.Count())
        );
        break;
      }
    }

    this.addChildAsync(
      {
        view: FueArrow,
        x: targetElement.view.x,
        y: targetElement.view.y + 0.8 * this.loadedElementDefinition.general.levelGridSeparationY
      },
      false,
      'FueArrow'
    );
  }

  public hideFueArrow(): void {
    this._fueTimer = -1;
    this.removeChildByNameAsync('FueArrow');
  }

  public setBoardScale(isZoomedIn: boolean): void {
    if (Environment.type === EnvironmentTypeEnum.phone) {
      this.removeTween();
      this._editScale = isZoomedIn ? 1.6 : 1;
      this.animateScaling(
        1.25 * this.levelScale * this._editScale,
        this._xPositionForPortrait * this._editScale
      );
    }
  }

  public animateScaling(targetScale: number, targetX: number): void {
    const tweenState = {
      scale: this.scaleX,
      x: this.x
    };

    this._scalingTween = new Tween(tweenState)
      .to({ scale: targetScale, x: targetX }, 300)
      .onUpdate(() => {
        this.scaleX = this.scaleY = tweenState.scale;
        this.x = tweenState.x;
      })
      .onComplete(() => {
        this.setScaleAndPosition();
        this.x = tweenState.x;
        this.removeTween();
      })
      .easing(Easing.Quadratic.In)
      .start();
  }

  public removeTween(): void {
    if (this._scalingTween) {
      this._scalingTween.stop();
      this._scalingTween = null;
    }
  }
}
