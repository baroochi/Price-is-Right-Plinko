/**
 * Plinko Game Module: GameProgression_Storage (GameplayModel)
 * Webpack Module ID: 0x176b4
 * Original File: main.min.js
 */

import {
  Singleton,
  Inject,
  StorageManager,
  SoundManager,
  IArenaApi,
  LocalizationManager
} from './framework/Core';
import { InGameUiModel } from './models/InGameUiModel';
import { TextWidgetModel } from './models/TextWidgetModel';
import { GameUiButtonModel } from './models/GameUiButtonModel';
import { GameAnalytics } from './analytics/GameAnalytics';
import { BottomBucketModel } from './models/BottomBucketModel';
import { SoundConstants } from './constants/SoundConstants';
import { WallLightAssemblyModel } from './models/WallLightAssemblyModel';
import { LocalizationConstants } from './constants/LocalizationConstants';
import { GameConstants } from './constants/GameConstants';
import { Jukebox } from './audio/Jukebox';
import { ProgressModel } from './models/ProgressModel';
import { StorageController } from './storage/StorageController';
import { ScoreModel } from './models/ScoreModel';
import { CloudStorageManager } from './storage/CloudStorageManager';

export enum GamePieceStateIDs {
  INVALID = 0,
  FADEIN = 1,
  IDLE_BACKFACE = 2,
  ACTIVE_FRONTFACE = 3,
  INACTIVE_FRONTFACE = 4,
  FLIP_BACK_DELAY = 5,
  MATCHED = 6,
  MISMATCH = 7,
  MISMATCH_SAVED = 8,
  FADEOUT = 9,
  DEAD = 10
}

export enum GameplayModeTypeIDs {
  NORMAL = 0
}

export enum PlayerType {
  NEW_USER = 0,
  PLAYER = 1,
  SIGNED_IN = 2,
  SUBSCRIBER = 3
}

/**
 * Central state model for Plinko gameplay, storing active balls, pegs, walls,
 * bottom scoring buckets, wall light multipliers, round progression, and local/cloud persistence.
 */
@Singleton
export class GameplayModel {
  private _storageManager: StorageManager;
  private _cloudStorageManager: CloudStorageManager;
  private _storage: StorageController;
  private _soundManager: SoundManager;
  public _arenaAPI: IArenaApi;
  private _analytics: GameAnalytics;
  private _localizationHandler: LocalizationManager;
  private _jukebox: Jukebox;

  public versionText: TextWidgetModel = new TextWidgetModel();
  public ActiveBallList: any[] = [];
  public GameButtons: InGameUiModel = new InGameUiModel();
  public OptionsButton: GameUiButtonModel = new GameUiButtonModel();

  public showSaveIcon: boolean = false;
  public helpVisible: boolean = false;
  public fuePopupVisibile: boolean = false;
  public newUserInfoPopupVisible: boolean = false;
  public newUserInfoPopupShowed: boolean = false;
  public roundBeginVisible: boolean = false;
  public levelCompleteVisible: boolean = false;
  public levelIncompleteVisible: boolean = false;
  public pickAPowerVisible: boolean = false;
  public pickAPowerDetailsVisible: boolean = false;
  public refreshPowerVisible: boolean = false;
  public refreshPowerups: boolean = false;
  public endingVisible: boolean = false;

  public displayTotalScore: TextWidgetModel = new TextWidgetModel();
  public displayBestScore: TextWidgetModel = new TextWidgetModel();
  public displayTime: TextWidgetModel = new TextWidgetModel();
  public currentInfoText: TextWidgetModel = new TextWidgetModel();
  public hintButtonObj: GameUiButtonModel = new GameUiButtonModel();

  public isPortraitView: boolean = false;
  public levelScrimVisible: boolean = false;
  public gameplayType: GameplayModeTypeIDs = GameplayModeTypeIDs.NORMAL;
  public isFinished: boolean = false;
  public quitGameRequested: boolean = false;
  public exitGameRequested: boolean = false;
  public savedStateIsValid: boolean = false;
  public numberOfWins: number = 0;
  public timePlayed: number = 0;
  public currentGameSpeed: number = 1;
  public isBroweserInFocus: boolean = true;

  public currentSelectedPowerup: any = undefined;
  public puckSearchActive: boolean = false;
  public bucketHighlightIndex: number = -1;

  public pegsInteractable: boolean = false;
  public bucketsInteractable: boolean = false;
  public wallsAddInteractable: boolean = false;
  public wallsRemoveInteractable: boolean = false;
  public puckSpawnInteractable: boolean = false;
  public puckAddInteractable: boolean = false;
  public beginLevelLoad: boolean = false;

  public puckSpawnList: any[] = [];
  public floatingPointsSpawnList: any[] = [];
  public effectsSpawnList: any[] = [];
  public _gamePlaySettings: any = undefined;

  public currentTotalGameScore: number = 0;
  public currentScore: number = 0;
  public currentGameTime: number = 0;
  public totalGameTime: number = 0;
  public currentBaseMultiplier: number = 1;
  public currentLevelMultiplier: number = 1;
  public previousLevel: number = -1;
  public currentLevel: number = -1;
  public ActiveLevelList: any = undefined;

  public dailyBestScore: number = 0;
  public allTimeBestScore: number = 0;
  public bestScore: number = 0;
  public bestScoreSaved: number = 0;
  public luckyBoard: boolean = true;

  public currentPuckList: number[] = [];
  public totalPuckList: number[] = [];
  public totalWallCount: number = 0;
  public currentLevelGoal: number = 0;
  public currentFPS: number = 60;
  public currentPegList: any[] = [];
  public currentWallList: any[] = [];

  public currentTeleportUsedCount: number = 0;
  public currentMultiplierBucketUsedCount: number = 0;
  public currentPuckDestroyedByStuckCount: number = 0;
  public currentPuckDestroyedByHitsCount: number = 0;
  public currentPuckDestroyedByTimelimitCount: number = 0;
  public currentWallsUntistuckCount: number = 0;
  public currentTooManyPucksCount: number = 0;

  public bonusGoldenChip: boolean = false;
  public bonusLightingChip: boolean = false;

  // Bottom 9 scoring buckets: [100, 500, 1000, 0, 10000, 0, 1000, 500, 100]
  public bucket1Obj: BottomBucketModel = new BottomBucketModel(
    100,
    SoundConstants.SFX_SMALL_POINTS,
    SoundConstants.SFX_NULL,
    0
  );
  public bucket2Obj: BottomBucketModel = new BottomBucketModel(
    500,
    SoundConstants.SFX_MID_POINTS,
    SoundConstants.SFX_NULL,
    1
  );
  public bucket3Obj: BottomBucketModel = new BottomBucketModel(
    1000,
    SoundConstants.SFX_LARGE_POINTS,
    SoundConstants.SFX_NULL,
    2
  );
  public bucket4Obj: BottomBucketModel = new BottomBucketModel(
    0,
    SoundConstants.SFX_NO_POINTS,
    SoundConstants.SFX_NULL,
    3
  );
  public bucket5Obj: BottomBucketModel = new BottomBucketModel(
    10000,
    SoundConstants.SFX_SUPER_POINTS,
    SoundConstants.SFX_CROWD_CHEER_1,
    4
  );
  public bucket6Obj: BottomBucketModel = new BottomBucketModel(
    0,
    SoundConstants.SFX_NO_POINTS,
    SoundConstants.SFX_NULL,
    5
  );
  public bucket7Obj: BottomBucketModel = new BottomBucketModel(
    1000,
    SoundConstants.SFX_LARGE_POINTS,
    SoundConstants.SFX_NULL,
    6
  );
  public bucket8Obj: BottomBucketModel = new BottomBucketModel(
    500,
    SoundConstants.SFX_MID_POINTS,
    SoundConstants.SFX_NULL,
    7
  );
  public bucket9Obj: BottomBucketModel = new BottomBucketModel(
    100,
    SoundConstants.SFX_SMALL_POINTS,
    SoundConstants.SFX_NULL,
    8
  );

  public WallLightAssembly1: WallLightAssemblyModel = new WallLightAssemblyModel();
  public WallLightAssembly2: WallLightAssemblyModel = new WallLightAssemblyModel();
  public WallLightAssembly3: WallLightAssemblyModel = new WallLightAssemblyModel();
  public WallLightAssembly4: WallLightAssemblyModel = new WallLightAssemblyModel();
  public WallLightAssembly5: WallLightAssemblyModel = new WallLightAssemblyModel();
  public WallLightAssembly6: WallLightAssemblyModel = new WallLightAssemblyModel();

  public seenFuePage: boolean = false;
  public fueState: { steps?: number[] } = {};
  public newUser: boolean = false;
  public playerType: PlayerType = PlayerType.PLAYER;
  public restoringProgress: boolean = false;
  public useArenaScoring: boolean = false;
  public loadingAnimationData: any = undefined;
  public mainMenuModel: any = undefined;

  public _puckSearchTime: number = 0;
  public renderPhase: number = 0;
  public physicToPixelScale: number = 1;
  private _logicObjectsArray: any[] = [];
  public delayBeforePushLights: number = 0;
  public showAdWithoutPopup: boolean = /Macintosh|iPhone|iPad/.test(navigator.userAgent);
  public userProgress: ProgressModel = new ProgressModel();
  public readyToLoadChip: boolean = false;

  constructor(
    @Inject storageManager: StorageManager,
    @Inject cloudStorageManager: CloudStorageManager,
    @Inject storage: StorageController,
    @Inject soundManager: SoundManager,
    @Inject arenaAPI: IArenaApi,
    @Inject analytics: GameAnalytics,
    @Inject localizationHandler: LocalizationManager,
    @Inject jukebox: Jukebox
  ) {
    this._storageManager = storageManager;
    this._cloudStorageManager = cloudStorageManager;
    this._storage = storage;
    this._soundManager = soundManager;
    this._arenaAPI = arenaAPI;
    this._analytics = analytics;
    this._localizationHandler = localizationHandler;
    this._jukebox = jukebox;
  }

  public registerLogicObject(logicObject: any, insertAtFront?: boolean): void {
    if (insertAtFront) {
      this._logicObjectsArray.unshift(logicObject);
    } else {
      this._logicObjectsArray.push(logicObject);
    }
  }

  public unregisterLogicObject(logicObject: any): void {
    const index = this._logicObjectsArray.indexOf(logicObject);
    if (index !== -1) {
      this._logicObjectsArray.splice(index, 1);
    }
  }

  /**
   * Executes fixed-step logic across all registered logic objects, active balls,
   * scoring buckets, and wall light bonus triggers.
   */
  public executeLogic(deltaTime: number): void {
    for (let i = 0; i < this._logicObjectsArray.length; ++i) {
      this._logicObjectsArray[i].executeLogic(deltaTime);
    }

    for (let i = 0; i < this.ActiveBallList.length; ++i) {
      this.ActiveBallList[i].executeLogic(deltaTime);
    }

    this.bucket1Obj.executeLogic(deltaTime);
    this.bucket2Obj.executeLogic(deltaTime);
    this.bucket3Obj.executeLogic(deltaTime);
    this.bucket4Obj.executeLogic(deltaTime);
    this.bucket5Obj.executeLogic(deltaTime);
    this.bucket6Obj.executeLogic(deltaTime);
    this.bucket7Obj.executeLogic(deltaTime);
    this.bucket8Obj.executeLogic(deltaTime);
    this.bucket9Obj.executeLogic(deltaTime);

    if (this.delayBeforePushLights > 0) {
      this.delayBeforePushLights -= deltaTime;
      if (this.delayBeforePushLights <= 0) {
        this.PushWallLights();
      }
    } else if (this.getNumberOfLitWalls() === 6) {
      this.delayBeforePushLights = 1;
    }
  }

  public checkNewUser(): void {
    this.newUser = String(this._loadElementFromStorate('firstTime', 'yes')) === 'yes';

    if (GameConstants.CHEAT_NEW_USER) {
      this.playerType = PlayerType.NEW_USER;
      this.fueState = { steps: [] };
      this.saveFueState();
    }

    if (this.newUser) {
      this.playerType = PlayerType.NEW_USER;
      this._storageManager.saveData('firstTime', 'no');
    }
  }

  public loadFromStorage(initialLoad?: boolean): void {
    this.savedStateIsValid =
      String(this._loadElementFromStorate('VALID', false)).toUpperCase() === 'TRUE';
    this.gameplayType = parseInt(this._loadElementFromStorate('TYPE', this.gameplayType), 10);
    this.timePlayed = parseInt(this._loadElementFromStorate('TTP', this.timePlayed), 10);
    this.bestScore = parseInt(this._loadElementFromStorate('CBS', this.bestScore), 10);
    this.seenFuePage =
      parseInt(this._loadElementFromStorate('FUE', this.seenFuePage ? 1 : 0), 10) === 1;
    this.luckyBoard = Boolean(parseInt(this._loadElementFromStorate('LBM', this.luckyBoard), 10));
    this.bestScoreSaved = this.bestScore;
    this.loadFueState();
  }

  public _loadElementFromStorate(key: string, defaultValue: any): any {
    const loadedValue = this._storageManager.loadData(key);
    return loadedValue == null || String(loadedValue) === '' ? defaultValue : loadedValue;
  }

  public saveToStorage(): void {
    this.showSaveIcon = true;
    this._storageManager.saveData('VALID', !this.savedStateIsValid ? 'FALSE' : 'TRUE');
    this._storageManager.saveData('TYPE', this.gameplayType.toString());
    this._storageManager.saveData('TTP', this.timePlayed.toString());
    this._storageManager.saveData('CBS', this.bestScore.toString());
    this._storageManager.saveData('FUE', this.seenFuePage ? '1' : '0');
    this.bestScoreSaved = this.bestScore;
  }

  public loadFueState(): void {
    let parsedState: any = null;
    try {
      const rawJson = this._storageManager.loadData('-fueState');
      parsedState = JSON.parse(rawJson);
    } catch (err) {
      console.log('ERROR: load history');
    }

    if (!parsedState) {
      parsedState = { steps: [] };
    }
    this.fueState = parsedState;
  }

  public saveFueState(): void {
    try {
      const serialized = JSON.stringify(this.fueState);
      this._storageManager.saveData('-fueState', serialized);
    } catch (err) {
      console.log('ERROR: save history');
    }
  }

  public FreeGeneratedElements(): void {}

  /**
   * Serializes the current board configuration (pegs, walls, and buckets) into a JSON-like string.
   */
  public serializeBoard(): string {
    let output = '"gameBoard": {\n';

    for (let i = 0; i < this.currentPegList.length; ++i) {
      output += `"peg": { "index": ${i}, "type": ${this.currentPegList[i].currentPegType.toString()}},\n`;
    }

    for (let i = 0; i < this.currentWallList.length; ++i) {
      const isBouncy = (this.currentWallList[i].bounceForce > 0).toString();
      output += `"wall": { "index": ${i}, "type": ${this.currentWallList[i].currentWallType.toString()}, "bouncy": "${isBouncy}"},\n`;
    }

    output += `"bucket": { "index": 0, "type": ${this.bucket1Obj.currentBucketType.toString()}, "value": ${this.bucket1Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 1, "type": ${this.bucket2Obj.currentBucketType.toString()}, "value": ${this.bucket2Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 2, "type": ${this.bucket3Obj.currentBucketType.toString()}, "value": ${this.bucket3Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 3, "type": ${this.bucket4Obj.currentBucketType.toString()}, "value": ${this.bucket4Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 4, "type": ${this.bucket5Obj.currentBucketType.toString()}, "value": ${this.bucket5Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 5, "type": ${this.bucket6Obj.currentBucketType.toString()}, "value": ${this.bucket6Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 6, "type": ${this.bucket7Obj.currentBucketType.toString()}, "value": ${this.bucket7Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 7, "type": ${this.bucket8Obj.currentBucketType.toString()}, "value": ${this.bucket8Obj.bucketValue.toString()}},\n`;
    output += `"bucket": { "index": 8, "type": ${this.bucket9Obj.currentBucketType.toString()}, "value": ${this.bucket9Obj.bucketValue.toString()}}\n`;
    output += '}\n';

    return output;
  }

  public saveProgress(reset?: boolean, powerupState?: any): void {
    if (
      this.playerType === PlayerType.SIGNED_IN ||
      this.playerType === PlayerType.SUBSCRIBER
    ) {
      let progressModel = new ProgressModel();
      if (!reset) {
        progressModel = this.serializeProgress(powerupState);
      }
      this._storage.saveProgress(progressModel);
    }
  }

  public saveScores(): void {
    if (
      this.playerType === PlayerType.SIGNED_IN ||
      this.playerType === PlayerType.SUBSCRIBER
    ) {
      const scoreModel = new ScoreModel(this.dailyBestScore, this.allTimeBestScore);
      this._storage.saveScores(scoreModel);
    }
  }

  public async loadProgress(): Promise<ProgressModel> {
    if (
      this.playerType === PlayerType.SIGNED_IN ||
      this.playerType === PlayerType.SUBSCRIBER
    ) {
      return (await this._storage.loadProgress()) || new ProgressModel();
    }
    return new ProgressModel();
  }

  public restoreProgress(): void {
    this.previousLevel = this.userProgress.previousLevel;
    this.currentLevel = this.userProgress.currentLevel;
    this.currentTotalGameScore = this.userProgress.currentScore;
    this.totalPuckList = this.userProgress.totalChipPuckList;
  }

  public ResetPowersUsed(): void {
    const powerups = this.ActiveLevelList.gameSpec.powerups;
    for (let i = 0; i < powerups.length; ++i) {
      const powerup = powerups[i];
      powerup.rarityCurrentWeight = powerup.rarityWeight;
    }
  }

  public shiftChipsList(): void {
    this.currentPuckList.shift();
    this.readyToLoadChip = true;
  }

  public addGoldenChip(): void {
    this.bonusGoldenChip = true;
  }

  public addLightingChip(): void {
    this.bonusLightingChip = true;
  }

  /**
   * Resets all gameplay state, scores, buckets, wall lights, and chip lists back to initial values.
   */
  public ResetModel(): void {
    this.versionText = new TextWidgetModel();
    this.ActiveBallList = [];
    this.totalPuckList = [];

    const initialPucksAllowed = this.ActiveLevelList.progression.levelDef[0].pucksAllowed;
    for (let i = 0; i < initialPucksAllowed; ++i) {
      this.totalPuckList.push(0);
    }

    this.currentPuckList = [];
    for (let i = 0; i < this.totalPuckList.length; ++i) {
      this.currentPuckList[i] = this.totalPuckList[i];
    }

    this.GameButtons = new InGameUiModel();
    this.OptionsButton = new GameUiButtonModel();
    this.showSaveIcon = false;
    this.helpVisible = false;
    this.endingVisible = false;
    this.fuePopupVisibile = false;
    this.roundBeginVisible = false;
    this.levelCompleteVisible = false;
    this.levelIncompleteVisible = false;
    this.pickAPowerVisible = false;
    this.pickAPowerDetailsVisible = false;
    this.refreshPowerVisible = false;

    this.displayTime = new TextWidgetModel();
    this.currentInfoText = new TextWidgetModel();
    this.gameplayType = GameplayModeTypeIDs.NORMAL;
    this.isFinished = false;
    this.quitGameRequested = false;
    this.exitGameRequested = false;
    this.savedStateIsValid = false;
    this.numberOfWins = 0;
    this.timePlayed = 0;
    this.currentGameSpeed = 1;

    this.puckSpawnList = [];
    this.floatingPointsSpawnList = [];
    this.effectsSpawnList = [];
    this.currentSelectedPowerup = undefined;
    this.currentPegList = [];
    this.currentWallList = [];

    this.pegsInteractable = false;
    this.bucketsInteractable = false;
    this.wallsAddInteractable = false;
    this.wallsRemoveInteractable = false;
    this.beginLevelLoad = false;

    this.currentTotalGameScore = 0;
    this.currentScore = 0;
    this.currentBaseMultiplier = 1;
    this.currentLevelMultiplier = 1;
    this.currentGameTime = 0;
    this.totalGameTime = 0;
    this.currentLevel = -1;
    this.ActiveLevelList = undefined;

    this.recalculateDynamicCurrentScore();

    this.bucket1Obj.resetModel();
    this.bucket2Obj.resetModel();
    this.bucket3Obj.resetModel();
    this.bucket4Obj.resetModel();
    this.bucket5Obj.resetModel();
    this.bucket6Obj.resetModel();
    this.bucket7Obj.resetModel();
    this.bucket8Obj.resetModel();
    this.bucket9Obj.resetModel();

    this.currentLevelMultiplier = 1;
    this.WallLightAssembly1.leftLightOn = false;
    this.WallLightAssembly1.rightLightOn = false;
    this.WallLightAssembly2.leftLightOn = false;
    this.WallLightAssembly2.rightLightOn = false;
    this.WallLightAssembly3.leftLightOn = false;
    this.WallLightAssembly3.rightLightOn = false;
    this.WallLightAssembly4.leftLightOn = false;
    this.WallLightAssembly4.rightLightOn = false;
    this.WallLightAssembly5.leftLightOn = false;
    this.WallLightAssembly5.rightLightOn = false;
    this.WallLightAssembly6.leftLightOn = false;
    this.WallLightAssembly6.rightLightOn = false;

    this.loadingAnimationData = undefined;
    this.mainMenuModel = undefined;
    this._logicObjectsArray = [];
  }

  /**
   * Awards the full 6-wall bonus multiplier and resets all wall light assemblies.
   */
  public PushWallLights(): void {
    this.currentLevelMultiplier += this.ActiveLevelList.gameSpec.wallMultiplierScale[6];
    this.ResetWallLights();
  }

  public ResetWallLights(): void {
    this.delayBeforePushLights = 0;
    this.WallLightAssembly1.leftLightOn = false;
    this.WallLightAssembly1.rightLightOn = false;
    this.WallLightAssembly2.leftLightOn = false;
    this.WallLightAssembly2.rightLightOn = false;
    this.WallLightAssembly3.leftLightOn = false;
    this.WallLightAssembly3.rightLightOn = false;
    this.WallLightAssembly4.leftLightOn = false;
    this.WallLightAssembly4.rightLightOn = false;
    this.WallLightAssembly5.leftLightOn = false;
    this.WallLightAssembly5.rightLightOn = false;
    this.WallLightAssembly6.leftLightOn = false;
    this.WallLightAssembly6.rightLightOn = false;
  }

  /**
   * Maps `currentLevel` (0..19+) to the corresponding stage localization key.
   */
  public getRoundNameInStageTextID(): string {
    if (this.currentLevel === 0) {
      return LocalizationConstants.GAMEPLAY_FIRST_ROUND;
    } else if (this.currentLevel <= 3) {
      return LocalizationConstants.GAMEPLAY_BEGINNER_ROUND;
    } else if (this.currentLevel <= 6) {
      return LocalizationConstants.GAMEPLAY_EXPERT_ROUND;
    } else if (this.currentLevel <= 10) {
      return LocalizationConstants.GAMEPLAY_MASTER_ROUND;
    } else if (this.currentLevel <= 14) {
      return LocalizationConstants.GAMEPLAY_CHAMPION_ROUND;
    } else if (this.currentLevel <= 18) {
      return LocalizationConstants.GAMEPLAY_LEGENDARY_ROUND;
    } else {
      return LocalizationConstants.GAMEPLAY_FINAL_ROUND;
    }
  }

  public getRoundNumberInStage(): number {
    if (this.currentLevel === 0) {
      return 1;
    } else if (this.currentLevel <= 3) {
      return this.currentLevel;
    } else if (this.currentLevel <= 6) {
      return this.currentLevel - 3;
    } else if (this.currentLevel <= 10) {
      return this.currentLevel - 6;
    } else if (this.currentLevel <= 14) {
      return this.currentLevel - 10;
    } else if (this.currentLevel <= 18) {
      return this.currentLevel - 14;
    } else {
      return 20;
    }
  }

  public getRoundMaxNumberInStage(): number {
    if (this.currentLevel === 0) {
      return 1;
    } else if (this.currentLevel <= 6) {
      return 3;
    } else if (this.currentLevel <= 18) {
      return 4;
    } else {
      return 1;
    }
  }

  public getGameTimeRemaining(): number {
    return this.currentGameTime;
  }

  public getGameTimeElapsed(): number {
    return this.totalGameTime - this.currentGameTime;
  }

  public getGameTimeRemainingPercent(): number {
    return this.totalGameTime <= 0 ? 0 : this.getGameTimeRemaining() / this.totalGameTime;
  }

  public getGameTimeElapsedPercent(): number {
    return this.totalGameTime <= 0 ? 0 : this.getGameTimeElapsed() / this.totalGameTime;
  }

  /**
   * Returns how many of the 6 wall light assemblies have both left and right triggers lit.
   */
  public getNumberOfLitWalls(): number {
    let count = 0;
    count += this.WallLightAssembly1.leftLightOn && this.WallLightAssembly1.rightLightOn ? 1 : 0;
    count += this.WallLightAssembly2.leftLightOn && this.WallLightAssembly2.rightLightOn ? 1 : 0;
    count += this.WallLightAssembly3.leftLightOn && this.WallLightAssembly3.rightLightOn ? 1 : 0;
    count += this.WallLightAssembly4.leftLightOn && this.WallLightAssembly4.rightLightOn ? 1 : 0;
    count += this.WallLightAssembly5.leftLightOn && this.WallLightAssembly5.rightLightOn ? 1 : 0;
    count += this.WallLightAssembly6.leftLightOn && this.WallLightAssembly6.rightLightOn ? 1 : 0;
    return count;
  }

  public recalculateDynamicCurrentScore(): void {}

  public serializeProgress(powerupState?: any): ProgressModel {
    const progress = new ProgressModel();
    const levelOffset = powerupState ? 1 : 0;

    progress.previousLevel = this.previousLevel - levelOffset;
    progress.currentLevel = this.currentLevel - levelOffset;
    progress.currentScore = this.currentTotalGameScore;

    this.currentPegList.forEach((peg) => {
      progress.currentPegList.push({ type: peg.currentPegType });
    });

    this.currentWallList.forEach((wall) => {
      progress.currentWallList.push({ type: wall.currentWallType });
    });

    for (let i = 1; i <= 9; i++) {
      const bucket: BottomBucketModel = (this as any)[`bucket${i}Obj`];
      progress.currentBacketList.push({
        type: bucket.currentBucketType,
        value: bucket.bucketValue,
        multiplayer: bucket.isMultiplierBucket,
        multiplyValue: bucket.multiplyValue
      });
    }

    progress.totalChipPuckList = this.totalPuckList;
    progress.empty = this.totalPuckList.length === 0;

    if (powerupState) {
      progress.refreshCounter = powerupState.refreshCounter;
      progress.refreshed = powerupState.refreshed;
      progress.currentPowerupList = powerupState.currentPowerups;
    }

    return progress;
  }

  public hasProgress(): boolean {
    return !this.userProgress.empty;
  }

  public reset(): void {
    this.saveProgress(true);
  }
}
