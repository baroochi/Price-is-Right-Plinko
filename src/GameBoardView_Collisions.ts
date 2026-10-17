/**
 * Kinematics Simulation Module: GameBoardView_Collisions
 * Webpack Module ID: 0x1937
 * Original File: main.min.js
 */

import {
  AnimateViewBase,
  Inject,
  JsonResourceItem,
  IArenaApi,
  PIXIRenderer,
  MovieClipView
} from './framework/Core';
import { DummyObjView } from './views/DummyObjView';
import { ChipTubeAssemblyView } from './views/ChipTubeAssemblyView';
import { ScoreBarAssemblyView } from './views/ScoreBarAssemblyView';
import { WallLightFeatureView_MainAssembly } from './views/WallLightFeatureView_MainAssembly';
import { bottomBucketScoreView } from './views/bottomBucketScoreView';
import { GameplayLogic } from './logic/GameplayLogic';
import { BottomBucketModel } from './models/BottomBucketModel';
import * as Planck from 'planck-js';

export interface IGameBoardViewOptions {
  currentLevelRoot: any;
  parent?: any;
  physicalDef: string;
  positionX: number;
  positionY: number;
  adjustScale: boolean;
  extraScalePercent: number;
  index: number;
  startingVelocity?: any;
}

/**
 * Manages the visual representation, static physics colliders, score bars,
 * wall lights, and bottom bucket highlight states for the Galton lattice simulation board.
 */
export class GameBoardView extends AnimateViewBase {
  private _options: IGameBoardViewOptions;
  public gameLogic: GameplayLogic;
  private _arenaAPI: IArenaApi;
  public pixiRenderer: PIXIRenderer;

  public imageRoot: any = null;
  public imageWidth: number = 0;
  public imageHeight: number = 0;
  public isInteractive: boolean = true;

  public bucketHighligher: MovieClipView | undefined = undefined;
  public bucketHighligherAll: MovieClipView | undefined = undefined;
  public bucketHighlighersOnScore: MovieClipView[] = [];
  public bucketHighlighersOnScoreTimers: number[] = [];

  private _scoreBarView_Vert: ScoreBarAssemblyView | undefined = undefined;
  private _scoreBarView_Horz: ScoreBarAssemblyView | undefined = undefined;

  public firstResize: boolean = true;
  public gameScale: number = 1;
  public gameWidth: number = 1;
  public gameHeight: number = 1;

  public currentPhysicsBody: Planck.Body | undefined;
  private _previuosScrimState: boolean = false;

  constructor(
    @Inject options: IGameBoardViewOptions,
    @Inject gameLogic: GameplayLogic,
    @Inject arenaAPI: IArenaApi,
    @Inject pixiRenderer: PIXIRenderer
  ) {
    super('GameBoardView');
    this._options = options;
    this.gameLogic = gameLogic;
    this._arenaAPI = arenaAPI;
    this.pixiRenderer = pixiRenderer;
  }

  /**
   * Configures child views (wall light assemblies, score bars, bucket text/highlighters),
   * JSON physics metadata resources, and model watchers.
   */
  public getConfiguration(): any {
    const gameplayModel = this.$model.gameplayModel;

    // Bind gameplayModel reference to all 6 wall light left/right triggers
    this.$model.gameplayModel.WallLightAssembly1.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly1.rightTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly2.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly2.rightTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly3.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly3.rightTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly4.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly4.rightTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly5.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly5.rightTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly6.leftTrigger.gameplayModel = this.$model.gameplayModel;
    this.$model.gameplayModel.WallLightAssembly6.rightTrigger.gameplayModel = this.$model.gameplayModel;

    return {
      childViews: {
        EditModeScrimObj: {
          movieClipName: 'EditModeScrimObj',
          view: DummyObjView,
          model: undefined
        },
        ChipTubeAssemblyObj: {
          movieClipName: 'ChipTubeObj',
          view: ChipTubeAssemblyView,
          model: gameplayModel,
          options: {
            currentLevelRoot: this._options.currentLevelRoot,
            dropperHoldsChip: true
          }
        },
        GoalBarHorzAssemblyObj: {
          movieClipName: 'GoalBarHorzObj',
          view: ScoreBarAssemblyView,
          model: gameplayModel,
          options: {
            currentLevelRoot: this._options.currentLevelRoot,
            Portrait: false
          }
        },
        GoalBarVertAssemblyObj: {
          movieClipName: 'GoalBarVertObj',
          view: ScoreBarAssemblyView,
          model: gameplayModel,
          options: {
            currentLevelRoot: this._options.currentLevelRoot,
            Portrait: true
          }
        },
        WallLightAssy_1: {
          movieClipName: 'WallLightAssy_1',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly1,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        WallLightAssy_2: {
          movieClipName: 'WallLightAssy_2',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly2,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        WallLightAssy_3: {
          movieClipName: 'WallLightAssy_3',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly3,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        WallLightAssy_4: {
          movieClipName: 'WallLightAssy_4',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly4,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        WallLightAssy_5: {
          movieClipName: 'WallLightAssy_5',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly5,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        WallLightAssy_6: {
          movieClipName: 'WallLightAssy_6',
          view: WallLightFeatureView_MainAssembly,
          model: gameplayModel.WallLightAssembly6,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketHighlighterFramesObj: {
          movieClipName: 'BucketHighlighterFramesObj',
          view: MovieClipView,
          model: this.$model
        },
        BucketHighlighterAll: {
          movieClipName: 'BucketHighlighterAll',
          view: MovieClipView,
          model: this.$model
        },
        PocketOnScore1: { movieClipName: 'PocketOnScore1', view: MovieClipView, model: this.$model },
        PocketOnScore2: { movieClipName: 'PocketOnScore2', view: MovieClipView, model: this.$model },
        PocketOnScore3: { movieClipName: 'PocketOnScore3', view: MovieClipView, model: this.$model },
        PocketOnScore4: { movieClipName: 'PocketOnScore4', view: MovieClipView, model: this.$model },
        PocketOnScore5: { movieClipName: 'PocketOnScore5', view: MovieClipView, model: this.$model },
        PocketOnScore6: { movieClipName: 'PocketOnScore6', view: MovieClipView, model: this.$model },
        PocketOnScore7: { movieClipName: 'PocketOnScore7', view: MovieClipView, model: this.$model },
        PocketOnScore8: { movieClipName: 'PocketOnScore8', view: MovieClipView, model: this.$model },
        PocketOnScore9: { movieClipName: 'PocketOnScore9', view: MovieClipView, model: this.$model },
        BucketText1Obj: {
          movieClipName: 'BucketText1Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket1Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText2Obj: {
          movieClipName: 'BucketText2Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket2Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText3Obj: {
          movieClipName: 'BucketText3Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket3Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText4Obj: {
          movieClipName: 'BucketText4Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket4Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText5Obj: {
          movieClipName: 'BucketText5Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket5Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText6Obj: {
          movieClipName: 'BucketText6Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket6Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText7Obj: {
          movieClipName: 'BucketText7Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket7Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText8Obj: {
          movieClipName: 'BucketText8Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket8Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        },
        BucketText9Obj: {
          movieClipName: 'BucketText9Obj',
          view: bottomBucketScoreView,
          model: gameplayModel.bucket9Obj,
          options: { currentLevelRoot: this._options.currentLevelRoot }
        }
      },
      resources: {
        LevelAssetFile: new JsonResourceItem(
          `${this._options.physicalDef}${this._options.index}_Metadata`,
          `/assets/pieces/${this._options.physicalDef}/objDef.json`
        )
      },
      modelWatch: {
        objDead: (isDead: boolean) => {
          if (isDead) {
            this.removeFromWorld();
          }
        }
      }
    };
  }

  /**
   * Initializes the static Box2D/Planck physics body and fixtures for the board,
   * sets up bucket score highlighters, and configures responsive score bars.
   */
  public onInitialize(): void {
    this.$childViews.get('EditModeScrimObj').gotoAndStop(0);

    const metadataKey = `${this._options.physicalDef}${this._options.index}_Metadata`;
    const objDefData = this.$resources.get(metadataKey).getResource().data;
    this.$model.objDefFile = objDefData;

    const physicsWorld = this._options.currentLevelRoot.getPhysicsWorld();
    const physicsScale = this._options.currentLevelRoot.getPhisicsToPixelScale();

    this.currentPhysicsBody = physicsWorld.createBody();
    this.currentPhysicsBody.setStatic();
    this.currentPhysicsBody.setPosition(
      Planck.Vec2(
        this._options.positionX / physicsScale,
        this._options.positionY / physicsScale
      )
    );

    const scaleX = objDefData.visual.scalePercentX * this._options.extraScalePercent;
    const scaleY = objDefData.visual.scalePercentY * this._options.extraScalePercent;

    const physicalBodies = objDefData.physics.physicalBodies;
    for (let i = 0; i < physicalBodies.length; ++i) {
      const bodyDef = physicalBodies[i];
      const colliderShape = this.buildCollider(bodyDef, scaleX, scaleY);

      if (colliderShape != null) {
        this.currentPhysicsBody.createFixture(colliderShape, {
          density: 1,
          friction: bodyDef.friction,
          mass: bodyDef.mass,
          I: 0,
          restitution: bodyDef.restitution,
          userData: this,
          isSensor: false
        });
      }
    }

    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.$model.isLoaded = true;
    this.$model.currentPhysicsBody = this.currentPhysicsBody;

    this.bucketHighligher = this.$childViews.get('BucketHighlighterFramesObj');
    this.bucketHighligher.visible = false;

    this.bucketHighligherAll = this.$childViews.get('BucketHighlighterAll');
    this.bucketHighligherAll.visible = false;

    for (let pocketIndex = 1; pocketIndex <= 9; ++pocketIndex) {
      const pocketView = this.$childViews.get(`PocketOnScore${pocketIndex}`);
      this.bucketHighlighersOnScore.push(pocketView);
      this.bucketHighlighersOnScoreTimers.push(0);
      pocketView.visible = false;
    }

    this._scoreBarView_Vert = this.$childViews.get('GoalBarVertAssemblyObj');
    this._scoreBarView_Horz = this.$childViews.get('GoalBarHorzAssemblyObj');
    this.updateResponsiveView();
  }

  /**
   * Updates the fade-out animation timer (1.5s duration) when a chip scores in a bottom pocket.
   */
  public checkPocketOnScore(bucketModel: BottomBucketModel, deltaTime: number): void {
    const bucketIndex = bucketModel.index;
    if (bucketModel.justScored) {
      bucketModel.justScored = false;
      this.bucketHighlighersOnScoreTimers[bucketIndex] = 1.5;
    }

    this.bucketHighlighersOnScoreTimers[bucketIndex] -= deltaTime;
    if (this.bucketHighlighersOnScoreTimers[bucketIndex] <= 0) {
      this.bucketHighlighersOnScore[bucketIndex].visible = false;
    } else {
      this.bucketHighlighersOnScore[bucketIndex].alpha =
        this.bucketHighlighersOnScoreTimers[bucketIndex] / 1.5;
      this.bucketHighlighersOnScore[bucketIndex].visible = true;
    }
  }

  /**
   * Frame update handler: syncs bucket highlighters, pocket score flash animations,
   * physics body transform, and edit-mode scrim visibility.
   */
  public onUpdate(deltaTime: number): void {
    const gameplayModel = this.$model.gameplayModel;

    if (gameplayModel.bucketHighlightIndex >= 0) {
      this.bucketHighligher!.gotoAndStop(8 - gameplayModel.bucketHighlightIndex);
    }
    this.bucketHighligher!.visible = gameplayModel.bucketHighlightIndex >= 0;

    this.checkPocketOnScore(gameplayModel.bucket1Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket2Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket3Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket4Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket5Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket6Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket7Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket8Obj, deltaTime);
    this.checkPocketOnScore(gameplayModel.bucket9Obj, deltaTime);

    if (this.currentPhysicsBody != null) {
      const position = this.currentPhysicsBody.getPosition();
      const physicsScale = this._options.currentLevelRoot.getPhisicsToPixelScale();

      this.$model.x = position.x * physicsScale;
      this.$model.y = position.y * physicsScale;
      // 0x39 (57) approximates 180 / Math.PI (radians to degrees conversion factor)
      this.$model.rotation = this.currentPhysicsBody.getAngle() / 57;

      if (this._options.parent == null) {
        this.x = this.$model.x;
        this.y = this.$model.y;
        this.rotation = this.$model.rotation;
      }
    }

    const isEditModeScrimActive =
      gameplayModel.bucketsInteractable ||
      gameplayModel.pegsInteractable ||
      gameplayModel.wallsAddInteractable;

    if (this._previuosScrimState !== isEditModeScrimActive) {
      this._previuosScrimState = isEditModeScrimActive;
      this.$childViews.get('EditModeScrimObj').visible = isEditModeScrimActive;

      if (gameplayModel.bucketsInteractable) {
        this.bucketHighligherAll!.visible = true;
        this.bucketHighligherAll!.gotoAndPlay(0);
      } else {
        this.bucketHighligherAll!.visible = false;
        this.bucketHighligherAll!.gotoAndStop(0);
      }
    }
  }

  /**
   * Destroys the board's physics body and marks the view for removal from the level root.
   */
  public removeFromWorld(): void {
    this._options.currentLevelRoot.getPhysicsWorld().destroyBody(this.currentPhysicsBody);
    this.currentPhysicsBody = undefined;

    if (this._options.parent == null) {
      this._options.currentLevelRoot.markForRemoval(this);
    }
  }

  /**
   * Constructs a Planck.js collision shape (Circle, Box, Edge, or Polygon) from JSON definition.
   */
  public buildCollider(bodyDef: any, scaleX: number, scaleY: number): Planck.Shape | undefined {
    if (bodyDef != null) {
      switch (bodyDef.shape.toUpperCase()) {
        case 'CIRCLE':
          return Planck.Circle((bodyDef.radius * scaleX) / bodyDef.physicalScaleDown);

        case 'BOX':
          return Planck.Box(
            (bodyDef.width * scaleX) / bodyDef.physicalScaleDown,
            (bodyDef.height * scaleY) / bodyDef.physicalScaleDown
          );

        case 'LINE':
          return Planck.Edge(
            Planck.Vec2(
              (bodyDef.p1x * scaleX) / bodyDef.physicalScaleDown,
              (bodyDef.p1y * scaleY) / bodyDef.physicalScaleDown
            ),
            Planck.Vec2(
              (bodyDef.p2x * scaleX) / bodyDef.physicalScaleDown,
              (bodyDef.p2y * scaleY) / bodyDef.physicalScaleDown
            )
          );

        case 'POLYGON': {
          const vertices: Planck.Vec2[] = [];
          for (let i = 0; i < bodyDef.vertecies.length; ++i) {
            vertices.push(
              new Planck.Vec2(
                (bodyDef.vertecies[i].x * scaleX) / bodyDef.physicalScaleDown,
                (bodyDef.vertecies[i].y * scaleY) / bodyDef.physicalScaleDown
              )
            );
          }
          return Planck.Polygon(vertices);
        }
      }
    }
    return undefined;
  }

  public onTriggerEnter(otherObject: any, contact: any): void {}

  public onTriggerExit(otherObject: any, contact: any): void {}

  public onCollisionOccured(otherObject: any, contact: any): void {}

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
    this.updateResponsiveView();
  }

  /**
   * Switches between horizontal (landscape) and vertical (portrait) goal score bars.
   */
  public updateResponsiveView(): void {
    if (this.gameWidth >= this.gameHeight) {
      this.gotoAndStop(0);
      if (this._scoreBarView_Horz != null) {
        this._scoreBarView_Horz.visible = true;
      }
      if (this._scoreBarView_Vert != null) {
        this._scoreBarView_Vert.visible = false;
      }
    } else {
      this.gotoAndStop(1);
      if (this._scoreBarView_Horz != null) {
        this._scoreBarView_Horz.visible = false;
      }
      if (this._scoreBarView_Vert != null) {
        this._scoreBarView_Vert.visible = true;
      }
    }
  }
}
