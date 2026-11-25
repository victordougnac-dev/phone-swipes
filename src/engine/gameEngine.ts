import { soundEngine } from '../audio/soundEngine';
import {
  ACHIEVEMENTS,
  APP_THEMES,
  AUTOMATION_UPGRADES,
  DEFAULT_KEYBINDS,
  DECOR_ITEMS,
  FARM_PHONES,
  MESSAGES_LIST,
  MILESTONES,
  PHONE_UPGRADES,
  POST_CATEGORIES,
  PRESTIGE_UPGRADES,
  RARITY_CONFIG,
  TECH_UPGRADES,
  createInitialState,
} from '../data/gameData';
import { POST_TEMPLATES } from '../data/posts';
import type {
  ActivePost,
  AppTab,
  AppThemeId,
  AutomationId,
  BonusDrop,
  DailyChallengeType,
  DecorId,
  FarmPhoneId,
  GameState,
  KeybindAction,
  PhoneUpgradeId,
  PostCategory,
  PrestigeUpgradeId,
  Rarity,
  ShopSection,
  TechUpgradeId,
} from '../types/game';
import { formatNumber } from '../utils/format';
import { crazyGames } from './crazygames';

const SAVE_KEY = 'phone_swipes_save_v1';

export interface ToastNotice {
  id: number;
  title: string;
  body: string;
  color: string;
  icon: string;
}

export interface SwipeEventResult {
  post: ActivePost;
  dpGained: number;
  combo: number;
  fever: boolean;
  isAuto: boolean;
}

export type EngineListener = () => void;

export class GameEngine {
  public state: GameState;
  public currentPost: ActivePost;
  public nextPost: ActivePost;
  public combo = 0;
  public comboTimer = 0;
  public surgeTimer = 0;
  public surgeMultiplier = 1;
  public bonusDrops: BonusDrop[] = [];
  public toasts: ToastNotice[] = [];
  public offlineEarnedDp = 0;
  public offlineSeconds = 0;

  private postSeq = 1;
  private dropSeq = 1;
  private toastSeq = 1;
  private autoScrollAccum = 0;
  private dropSpawnTimer = 14;
  private saveAccum = 0;
  private listeners: Set<EngineListener> = new Set();
  private onSwipeCallbacks: Set<(res: SwipeEventResult) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.ensureDailyChallenges();
    this.checkMessagesUnlock(true);
    this.currentPost = this.generatePost('common');
    this.nextPost = this.generatePost();
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    crazyGames.gameplayStart();
  }

  public subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public onSwipe(fn: (res: SwipeEventResult) => void): () => void {
    this.onSwipeCallbacks.add(fn);
    return () => this.onSwipeCallbacks.delete(fn);
  }

  public emit(): void {
    for (const fn of this.listeners) fn();
  }

  private loadState(): GameState {
    const fresh = createInitialState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw) as Partial<GameState>;
      const merged: GameState = {
        ...fresh,
        ...parsed,
        rarityCounts: { ...fresh.rarityCounts, ...(parsed.rarityCounts || {}) },
        phoneUpgrades: { ...fresh.phoneUpgrades, ...(parsed.phoneUpgrades || {}) },
        farmPhones: { ...fresh.farmPhones, ...(parsed.farmPhones || {}) },
        farmOverclocks: { ...fresh.farmOverclocks, ...(parsed.farmOverclocks || {}) },
        automation: { ...fresh.automation, ...(parsed.automation || {}) },
        techUpgrades: { ...fresh.techUpgrades, ...(parsed.techUpgrades || {}) },
        decor: { ...fresh.decor, ...(parsed.decor || {}) },
        unlockedCategories: { ...fresh.unlockedCategories, ...(parsed.unlockedCategories || {}) },
        unlockedThemes: { ...fresh.unlockedThemes, ...(parsed.unlockedThemes || {}) },
        prestigeUpgrades: { ...fresh.prestigeUpgrades, ...(parsed.prestigeUpgrades || {}) },
        achievements: { ...(parsed.achievements || {}) },
        milestonesClaimed: { ...(parsed.milestonesClaimed || {}) },
        messages: { ...(parsed.messages || {}) },
        settings: {
          ...fresh.settings,
          ...(parsed.settings || {}),
          keybinds: {
            ...fresh.settings.keybinds,
            ...(parsed.settings?.keybinds || {}),
          },
        },
        dailyChallenges: Array.isArray(parsed.dailyChallenges) ? parsed.dailyChallenges : [],
      };

      // Calculate offline gains
      const now = Date.now();
      const elapsedSec = Math.min(8 * 3600, Math.max(0, (now - (merged.lastSavedAt || now)) / 1000));
      if (elapsedSec > 15) {
        this.state = merged;
        const dps = this.getTotalIdleDps(true);
        if (dps > 0) {
          const offEff = 0.5 + merged.prestigeUpgrades.offline_mastery * 0.25 + merged.phoneUpgrades.battery * 0.03;
          const gained = Math.floor(dps * elapsedSec * Math.min(1.5, offEff));
          if (gained > 0) {
            merged.dp += gained;
            merged.runDp += gained;
            merged.lifetimeDp += gained;
            this.offlineEarnedDp = gained;
            this.offlineSeconds = Math.floor(elapsedSec);
          }
        }
      }
      return merged;
    } catch {
      return fresh;
    }
  }

  public saveState(): void {
    try {
      this.state.lastSavedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage quota errors
    }
  }

  public exportSaveString(): string {
    this.saveState();
    return btoa(unescape(encodeURIComponent(JSON.stringify(this.state))));
  }

  public importSaveString(code: string): boolean {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const parsed = JSON.parse(json) as GameState;
      if (typeof parsed.dp !== 'number' || typeof parsed.totalSwipes !== 'number') {
        return false;
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
      this.state = this.loadState();
      this.ensureDailyChallenges();
      this.checkMessagesUnlock(true);
      soundEngine.syncSettings(this.state.settings, this.state.paused);
      this.pushToast('Save Imported!', 'Your phone empire has been restored.', '#38bdf8', '💾');
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  public hardReset(): void {
    localStorage.removeItem(SAVE_KEY);
    this.state = createInitialState();
    this.combo = 0;
    this.comboTimer = 0;
    this.surgeTimer = 0;
    this.surgeMultiplier = 1;
    this.bonusDrops = [];
    this.offlineEarnedDp = 0;
    this.ensureDailyChallenges();
    this.currentPost = this.generatePost('common');
    this.nextPost = this.generatePost();
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    this.saveState();
    this.pushToast('Fresh Start', 'Progress reset cleanly.', '#f43f5e', '🔄');
    this.emit();
  }

  public pushToast(title: string, body: string, color: string, icon: string): void {
    const id = this.toastSeq++;
    this.toasts.push({ id, title, body, color, icon });
    if (this.toasts.length > 4) this.toasts.shift();
    window.setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.emit();
    }, 3600);
  }

  // ==================== MULTIPLIERS & MATH ====================

  public getAchievementBonusMultiplier(): number {
    let pct = 0;
    for (const ach of ACHIEVEMENTS) {
      if (this.state.achievements[ach.id]) pct += ach.rewardPercent;
    }
    return 1 + pct / 100;
  }

  public getDecorBonuses(): { dpMult: number; swipeMult: number; luckMult: number } {
    let dpMult = 1;
    let swipeMult = 1;
    let luckMult = 1;
    for (const d of DECOR_ITEMS) {
      if (this.state.decor[d.id]) {
        dpMult += d.dpMultiplierBonus;
        swipeMult += d.swipeMultiplierBonus;
        luckMult += d.luckBonus;
      }
    }
    return { dpMult, swipeMult, luckMult };
  }

  public getCategorySwipeMultiplier(): number {
    let bonus = 1;
    for (const c of POST_CATEGORIES) {
      if (this.state.unlockedCategories[c.id]) bonus += c.swipeBonus;
    }
    return bonus;
  }

  public getGlobalMultiplier(): number {
    const s = this.state;
    const prestigeMult = 1 + s.prestigeUpgrades.soul_multiplier * 1.0;
    const achMult = this.getAchievementBonusMultiplier();
    const wifiMult = 1 + s.techUpgrades.better_wifi * 0.25;
    const netMult = 1 + s.techUpgrades.faster_internet * 0.3;
    const simMult = 1 + s.techUpgrades.multiple_sims * 0.2;
    const botnetMult = 1 + s.automation.cloud_botnet * 0.6;
    const decorMult = this.getDecorBonuses().dpMult;
    const surge = this.surgeTimer > 0 ? this.surgeMultiplier : 1;

    return prestigeMult * achMult * wifiMult * netMult * simMult * botnetMult * decorMult * surge;
  }

  public getLuckMultiplier(): number {
    const s = this.state;
    const algo = 1 + s.phoneUpgrades.algorithm * 0.22;
    const sims = 1 + s.techUpgrades.multiple_sims * 0.25;
    const ai = 1 + s.automation.ai_assistant * 0.2;
    const prestige = 1 + s.prestigeUpgrades.luck_aura * 0.4;
    const decor = this.getDecorBonuses().luckMult;
    return algo * sims * ai * prestige * decor;
  }

  public getMaxCombo(): number {
    return 12 + this.state.phoneUpgrades.processor * 4 + this.state.prestigeUpgrades.golden_thumb * 5;
  }

  public isFeverActive(): boolean {
    return this.combo >= 10;
  }

  public getComboMultiplier(): number {
    const base = 1 + this.combo * 0.08;
    const fever = this.isFeverActive() ? 1.5 : 1;
    return base * fever;
  }

  public getSwipeBaseDp(): number {
    const s = this.state;
    const baseScreen = 1 + s.phoneUpgrades.screen * 2;
    const acc = 1 + s.techUpgrades.phone_accessories * 0.3;
    const multiAcc = 1 + s.automation.multiple_accounts * 0.35;
    const goldThumb = 1 + s.prestigeUpgrades.golden_thumb * 1.5;
    const cat = this.getCategorySwipeMultiplier();
    const decorSwipe = this.getDecorBonuses().swipeMult;
    return baseScreen * acc * multiAcc * goldThumb * cat * decorSwipe * this.getGlobalMultiplier();
  }

  public getRarityEffectiveMultiplier(rarity: Rarity): number {
    const base = RARITY_CONFIG[rarity].multiplier;
    const premAlgo = 1 + this.state.techUpgrades.premium_algorithms * 0.4;
    return rarity === 'common' ? 1 : base * premAlgo;
  }

  public getFarmPhoneUnitDps(id: FarmPhoneId): number {
    const def = FARM_PHONES.find((p) => p.id === id);
    if (!def) return 0;
    const s = this.state;
    const overclock = 1 + (s.farmOverclocks[id] || 0) * 0.55;
    const chargers = 1 + s.techUpgrades.charging_stations * 0.35;
    const manager = 1 + s.automation.phone_farm_manager * 0.45;
    const battery = 1 + s.phoneUpgrades.battery * 0.1;
    const prestigeFarm = 1 + s.prestigeUpgrades.farm_overdrive * 1.25;
    return def.baseDps * overclock * chargers * manager * battery * prestigeFarm * this.getGlobalMultiplier();
  }

  public getTotalFarmDps(): number {
    let total = 0;
    for (const def of FARM_PHONES) {
      const qty = this.state.farmPhones[def.id] || 0;
      if (qty > 0) total += qty * this.getFarmPhoneUnitDps(def.id);
    }
    return total;
  }

  public getAutoScrollRatePerSec(): number {
    const lvl = this.state.automation.auto_scroller;
    if (lvl <= 0) return 0;
    const baseRate = 0.55 + (lvl - 1) * 0.45;
    const procBoost = 1 + this.state.phoneUpgrades.processor * 0.1;
    const advAuto = 1 + this.state.techUpgrades.advanced_automation * 0.25;
    const onSwipesTab = this.state.activeTab === 'swipes';
    const bgLevel = this.state.automation.background_scrolling;
    const bgEff = onSwipesTab ? 1 : bgLevel > 0 ? 1 + (bgLevel - 1) * 0.2 : 0.35;
    return baseRate * procBoost * advAuto * bgEff;
  }

  public getTotalIdleDps(includeAuto = true): number {
    let total = this.getTotalFarmDps();
    if (includeAuto && this.state.automation.auto_scroller > 0) {
      const rate = this.getAutoScrollRatePerSec();
      const advDp = 1 + this.state.techUpgrades.advanced_automation * 0.25;
      total += rate * this.getSwipeBaseDp() * 1.35 * advDp;
    }
    return total;
  }

  // ==================== POSTS & RARITY ====================

  public getRarityWeights(): Record<Rarity, number> {
    const luck = this.getLuckMultiplier();
    return {
      common: RARITY_CONFIG.common.baseWeight,
      uncommon: RARITY_CONFIG.uncommon.baseWeight * Math.pow(luck, 0.65),
      rare: RARITY_CONFIG.rare.baseWeight * Math.pow(luck, 0.9),
      epic: RARITY_CONFIG.epic.baseWeight * Math.pow(luck, 1.05),
      legendary: RARITY_CONFIG.legendary.baseWeight * Math.pow(luck, 1.15),
    };
  }

  public rollRarity(): Rarity {
    const weights = this.getRarityWeights();
    const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const total = order.reduce((sum, r) => sum + weights[r], 0);
    let r = Math.random() * total;
    for (const key of order) {
      r -= weights[key];
      if (r <= 0) return key;
    }
    return 'common';
  }

  public generatePost(forceRarity?: Rarity): ActivePost {
    const rarity = forceRarity ?? this.rollRarity();
    const unlockedCats = POST_CATEGORIES.filter((c) => this.state.unlockedCategories[c.id]).map((c) => c.id);
    const activeCat = this.state.activeCategory;

    let pool = POST_TEMPLATES.filter((p) => {
      const catAllowed =
        activeCat === 'all' ? unlockedCats.includes(p.category) : p.category === activeCat && unlockedCats.includes(p.category);
      return catAllowed && p.rarity === rarity;
    });

    if (pool.length === 0) {
      pool = POST_TEMPLATES.filter((p) => unlockedCats.includes(p.category) && p.rarity === rarity);
    }
    if (pool.length === 0) {
      pool = POST_TEMPLATES.filter((p) => unlockedCats.includes(p.category));
    }
    if (pool.length === 0) {
      pool = POST_TEMPLATES;
    }

    const template = pool[Math.floor(Math.random() * pool.length)];
    const variance = 0.85 + Math.random() * 0.35;
    return {
      ...template,
      instanceId: this.postSeq++,
      likes: Math.floor(template.baseLikes * variance),
      liked: false,
      dpEarned: 0,
      bonusTagged: Math.random() < 0.08 + this.state.phoneUpgrades.display * 0.02,
    };
  }

  // ==================== PLAYER ACTIONS ====================

  public performSwipe(isAuto = false): SwipeEventResult {
    if (this.state.paused && !isAuto) {
      return {
        post: this.currentPost,
        dpGained: 0,
        combo: this.combo,
        fever: this.isFeverActive(),
        isAuto,
      };
    }

    // Advance feed
    const discovered = this.nextPost;
    this.currentPost = discovered;
    this.nextPost = this.generatePost();

    // Update combo (manual swipes build combo fast, auto maintains slightly)
    const maxCombo = this.getMaxCombo();
    if (!isAuto) {
      const step = 1 + (this.state.prestigeUpgrades.golden_thumb > 0 ? 1 : 0);
      this.combo = Math.min(maxCombo, this.combo + step);
      this.comboTimer = 2.6 + this.state.phoneUpgrades.battery * 0.25;
      if (this.combo > this.state.bestCombo) {
        this.state.bestCombo = this.combo;
      }
    } else if (this.combo > 0) {
      this.comboTimer = Math.max(this.comboTimer, 1.2);
    }

    const rarityMult = this.getRarityEffectiveMultiplier(discovered.rarity);
    const comboMult = this.getComboMultiplier();
    const bonusPostMult = discovered.bonusTagged
      ? 1.5 + this.state.phoneUpgrades.display * 0.25
      : 1;
    const autoBonus = isAuto ? 1 + this.state.techUpgrades.advanced_automation * 0.25 : 1;

    const rawDp = this.getSwipeBaseDp() * rarityMult * comboMult * bonusPostMult * autoBonus;
    const dpGained = Math.max(1, Math.round(rawDp));

    discovered.dpEarned = dpGained;
    this.addDp(dpGained);

    this.state.totalSwipes += 1;
    this.state.runSwipes += 1;
    this.state.rarityCounts[discovered.rarity] = (this.state.rarityCounts[discovered.rarity] || 0) + 1;

    // Daily challenge progress
    this.advanceDaily('swipes', 1);
    if (discovered.rarity === 'rare' || discovered.rarity === 'epic' || discovered.rarity === 'legendary') {
      this.advanceDaily('rare_posts', 1);
    }
    this.setDailyMax('combo', this.combo);

    // Sound effects
    if (!isAuto) {
      soundEngine.playSwipe(this.combo);
      if (discovered.rarity !== 'common') {
        soundEngine.playRarity(discovered.rarity);
      }
    } else if (discovered.rarity === 'epic' || discovered.rarity === 'legendary') {
      soundEngine.playRarity(discovered.rarity);
    }

    this.checkProgression();

    const result: SwipeEventResult = {
      post: discovered,
      dpGained,
      combo: this.combo,
      fever: this.isFeverActive(),
      isAuto,
    };

    for (const cb of this.onSwipeCallbacks) cb(result);
    this.emit();
    return result;
  }

  public likeCurrentPost(): number {
    if (this.state.paused || this.currentPost.liked) return 0;
    this.currentPost.liked = true;
    this.currentPost.likes += 1;
    this.state.totalLikes += 1;

    const displayMult = 1 + this.state.phoneUpgrades.display * 0.22;
    const dp = Math.max(1, Math.round(this.getSwipeBaseDp() * 0.75 * displayMult));
    this.addDp(dp);
    this.advanceDaily('likes', 1);
    soundEngine.playLike();
    this.checkProgression();
    this.emit();
    return dp;
  }

  public catchBonusDrop(dropId: number, byAi = false): number {
    const idx = this.bonusDrops.findIndex((d) => d.id === dropId);
    if (idx === -1) return 0;
    const drop = this.bonusDrops[idx];
    this.bonusDrops.splice(idx, 1);

    this.state.totalBonusCaught += 1;
    this.advanceDaily('bonus_drops', 1);

    const displayBoost = 1 + this.state.phoneUpgrades.display * 0.25;
    const baseBurst = Math.max(25, (this.getSwipeBaseDp() * 14 + this.getTotalIdleDps() * 10) * displayBoost);

    let awarded = 0;
    if (drop.kind === 'viral_surge') {
      this.surgeMultiplier = 2.5 + this.state.phoneUpgrades.display * 0.2;
      this.surgeTimer = 14 + this.state.phoneUpgrades.battery * 1.5;
      awarded = Math.round(baseBurst * 0.5);
      this.addDp(awarded);
      this.pushToast(
        byAi ? 'AI Caught Viral Surge!' : 'VIRAL SURGE ACTIVE!',
        `${this.surgeMultiplier.toFixed(1)}x ALL DP for ${Math.round(this.surgeTimer)}s!`,
        '#f43f5e',
        '🔥'
      );
    } else if (drop.kind === 'battery_boost') {
      this.combo = Math.min(this.getMaxCombo(), this.combo + 8);
      this.comboTimer = 5;
      awarded = Math.round(baseBurst * 0.9);
      this.addDp(awarded);
      this.pushToast('Turbo Charge!', `+${formatNumber(awarded)} DP & +8 Combo!`, '#4ade80', '🔋');
    } else {
      awarded = Math.round(baseBurst * (drop.kind === 'mystery_box' ? 1.8 : 1.2));
      this.addDp(awarded);
      this.pushToast(
        drop.kind === 'mystery_box' ? 'Mystery Gift Opened!' : 'Golden Notification!',
        `+${formatNumber(awarded)} DP`,
        '#facc15',
        '🎁'
      );
    }

    if (!byAi) soundEngine.playBonus();
    this.checkProgression();
    this.emit();
    return awarded;
  }

  private addDp(amount: number): void {
    if (amount <= 0) return;
    this.state.dp += amount;
    this.state.runDp += amount;
    this.state.lifetimeDp += amount;
  }

  // ==================== COSTS & PURCHASES ====================

  public getPhoneUpgradeCost(id: PhoneUpgradeId): number {
    const def = PHONE_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.phoneUpgrades[id] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costScale, lvl));
  }

  public buyPhoneUpgrade(id: PhoneUpgradeId): boolean {
    const cost = this.getPhoneUpgradeCost(id);
    if (this.state.dp < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= cost;
    this.state.phoneUpgrades[id] += 1;
    this.advanceDaily('upgrades', 1);
    soundEngine.playBuy();
    this.checkProgression();
    this.emit();
    return true;
  }

  public getFarmPhoneBulkCost(id: FarmPhoneId, count: number): number {
    const def = FARM_PHONES.find((p) => p.id === id)!;
    const owned = this.state.farmPhones[id] || 0;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(def.baseCost * Math.pow(def.costScale, owned + i));
    }
    return total;
  }

  public getMaxAffordableFarmPhone(id: FarmPhoneId): { qty: number; cost: number } {
    const def = FARM_PHONES.find((p) => p.id === id)!;
    const owned = this.state.farmPhones[id] || 0;
    let dpLeft = this.state.dp;
    let qty = 0;
    let cost = 0;
    while (qty < 100) {
      const nextCost = Math.floor(def.baseCost * Math.pow(def.costScale, owned + qty));
      if (dpLeft < nextCost) break;
      dpLeft -= nextCost;
      cost += nextCost;
      qty++;
    }
    return { qty, cost };
  }

  public buyFarmPhone(id: FarmPhoneId): boolean {
    const mode = this.state.buyAmount;
    let qty = mode === 'max' ? this.getMaxAffordableFarmPhone(id).qty : mode;
    if (qty <= 0) qty = 1;
    const cost = this.getFarmPhoneBulkCost(id, qty);
    if (this.state.dp < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= cost;
    this.state.farmPhones[id] += qty;
    this.advanceDaily('upgrades', qty);
    soundEngine.playBuy();
    this.checkProgression();
    this.emit();
    return true;
  }

  public getFarmOverclockCost(id: FarmPhoneId): number {
    const def = FARM_PHONES.find((p) => p.id === id)!;
    const lvl = this.state.farmOverclocks[id] || 0;
    return Math.floor(def.overclockBaseCost * Math.pow(2.4, lvl));
  }

  public buyFarmOverclock(id: FarmPhoneId): boolean {
    if ((this.state.farmPhones[id] || 0) < 1) return false;
    const cost = this.getFarmOverclockCost(id);
    if (this.state.dp < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= cost;
    this.state.farmOverclocks[id] += 1;
    this.advanceDaily('upgrades', 1);
    soundEngine.playBuy();
    this.checkProgression();
    this.emit();
    return true;
  }

  public getAutomationCost(id: AutomationId): number {
    const def = AUTOMATION_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.automation[id] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costScale, lvl));
  }

  public buyAutomation(id: AutomationId): boolean {
    const def = AUTOMATION_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.automation[id] || 0;
    if (lvl >= def.maxLevel) return false;
    const cost = this.getAutomationCost(id);
    if (this.state.dp < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= cost;
    this.state.automation[id] += 1;
    this.advanceDaily('upgrades', 1);
    soundEngine.playBuy();
    this.checkProgression();
    this.emit();
    return true;
  }

  public getTechCost(id: TechUpgradeId): number {
    const def = TECH_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.techUpgrades[id] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costScale, lvl));
  }

  public buyTechUpgrade(id: TechUpgradeId): boolean {
    const def = TECH_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.techUpgrades[id] || 0;
    if (lvl >= def.maxLevel) return false;
    const cost = this.getTechCost(id);
    if (this.state.dp < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= cost;
    this.state.techUpgrades[id] += 1;
    this.advanceDaily('upgrades', 1);
    soundEngine.playBuy();
    this.checkProgression();
    this.emit();
    return true;
  }

  public buyDecor(id: DecorId): boolean {
    if (this.state.decor[id]) return false;
    const def = DECOR_ITEMS.find((d) => d.id === id)!;
    if (this.state.dp < def.cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= def.cost;
    this.state.decor[id] = true;
    this.advanceDaily('upgrades', 1);
    soundEngine.playBonus();
    this.pushToast('Room Decor Placed!', `${def.name} (${def.buffLabel})`, '#4ade80', '🛋️');
    this.checkProgression();
    this.emit();
    return true;
  }

  public unlockCategory(id: PostCategory): boolean {
    if (this.state.unlockedCategories[id]) {
      this.state.activeCategory = id;
      this.emit();
      return true;
    }
    const def = POST_CATEGORIES.find((c) => c.id === id)!;
    if (this.state.dp < def.cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= def.cost;
    this.state.unlockedCategories[id] = true;
    this.state.activeCategory = id;
    soundEngine.playBonus();
    this.pushToast('Feed Category Unlocked!', `${def.icon} ${def.name} added to your feed!`, '#38bdf8', def.icon);
    this.checkProgression();
    this.emit();
    return true;
  }

  public setActiveCategory(cat: PostCategory | 'all'): void {
    if (cat !== 'all' && !this.state.unlockedCategories[cat]) return;
    this.state.activeCategory = cat;
    this.nextPost = this.generatePost();
    this.emit();
  }

  public unlockOrSelectTheme(id: AppThemeId): boolean {
    if (this.state.unlockedThemes[id]) {
      this.state.activeTheme = id;
      this.emit();
      return true;
    }
    const def = APP_THEMES[id];
    if (def.requiresRebirth && this.state.rebirthCount < 1) {
      soundEngine.playError();
      return false;
    }
    if (this.state.dp < def.cost) {
      soundEngine.playError();
      return false;
    }
    this.state.dp -= def.cost;
    this.state.unlockedThemes[id] = true;
    this.state.activeTheme = id;
    soundEngine.playBuy();
    this.emit();
    return true;
  }

  // ==================== DIGITAL REBIRTH (PRESTIGE) ====================

  public readonly REBIRTH_THRESHOLD = 100000;

  public getPendingCloutShards(): number {
    if (this.state.runDp < this.REBIRTH_THRESHOLD) return 0;
    const crownMult = 1 + this.state.prestigeUpgrades.void_crown * 0.25;
    return Math.max(1, Math.floor(Math.pow(this.state.runDp / this.REBIRTH_THRESHOLD, 0.45) * crownMult));
  }

  public canRebirth(): boolean {
    return this.getPendingCloutShards() >= 1;
  }

  public performDigitalRebirth(): boolean {
    const shards = this.getPendingCloutShards();
    if (shards < 1) return false;

    const fresh = createInitialState();
    const prev = this.state;

    // Keep permanent progression
    const starterLevel = prev.prestigeUpgrades.starter_kit;
    const keepAuto = prev.prestigeUpgrades.keep_automation;

    this.state = {
      ...fresh,
      dp: starterLevel * 500,
      runDp: starterLevel * 500,
      lifetimeDp: prev.lifetimeDp + starterLevel * 500,
      cloutShards: prev.cloutShards + shards,
      totalCloutShardsEarned: prev.totalCloutShardsEarned + shards,
      rebirthCount: prev.rebirthCount + 1,
      totalSwipes: prev.totalSwipes,
      totalLikes: prev.totalLikes,
      totalBonusCaught: prev.totalBonusCaught,
      bestCombo: prev.bestCombo,
      playTimeSeconds: prev.playTimeSeconds,
      rarityCounts: { ...prev.rarityCounts },
      prestigeUpgrades: { ...prev.prestigeUpgrades },
      achievements: { ...prev.achievements },
      milestonesClaimed: { ...prev.milestonesClaimed },
      messages: { ...prev.messages },
      dailyChallenges: prev.dailyChallenges,
      dailyResetAt: prev.dailyResetAt,
      dailyCompletedCount: prev.dailyCompletedCount,
      settings: { ...prev.settings },
      unlockedThemes: {
        ...fresh.unlockedThemes,
        ...prev.unlockedThemes,
        void_rebirth: true,
      },
      activeTheme: 'void_rebirth',
    };

    if (starterLevel > 0) {
      this.state.farmPhones.old_android = starterLevel;
    }
    if (keepAuto >= 1) {
      this.state.automation.background_scrolling = 1;
    }
    if (keepAuto >= 2) {
      this.state.automation.auto_scroller = 1;
    }

    this.combo = 0;
    this.comboTimer = 0;
    this.surgeTimer = 0;
    this.surgeMultiplier = 1;
    this.bonusDrops = [];
    this.currentPost = this.generatePost('rare');
    this.nextPost = this.generatePost();

    soundEngine.playRebirth();
    crazyGames.happytime();
    this.pushToast('DIGITAL REBIRTH!', `Ascended! Earned +${shards} Clout Shards 💎`, '#2dd4bf', '🔮');
    this.checkProgression();
    this.saveState();
    this.emit();
    return true;
  }

  public getPrestigeUpgradeCost(id: PrestigeUpgradeId): number {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.prestigeUpgrades[id] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costScale, lvl));
  }

  public buyPrestigeUpgrade(id: PrestigeUpgradeId): boolean {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id)!;
    const lvl = this.state.prestigeUpgrades[id] || 0;
    if (lvl >= def.maxLevel) return false;
    const cost = this.getPrestigeUpgradeCost(id);
    if (this.state.cloutShards < cost) {
      soundEngine.playError();
      return false;
    }
    this.state.cloutShards -= cost;
    this.state.prestigeUpgrades[id] += 1;
    soundEngine.playBonus();
    this.emit();
    return true;
  }

  // ==================== ACHIEVEMENTS, MILESTONES, DAILIES, MESSAGES ====================

  private checkProgression(): void {
    // Achievements
    for (const ach of ACHIEVEMENTS) {
      if (!this.state.achievements[ach.id] && ach.check(this.state)) {
        this.state.achievements[ach.id] = true;
        soundEngine.playAchievement();
        crazyGames.happytime();
        this.pushToast(
          `Achievement: ${ach.name}`,
          `+${ach.rewardPercent}% Permanent DP!`,
          '#facc15',
          ach.icon
        );
      }
    }

    // Milestones
    for (const ms of MILESTONES) {
      if (!this.state.milestonesClaimed[ms.id] && this.state.lifetimeDp >= ms.targetLifetimeDp) {
        this.state.milestonesClaimed[ms.id] = true;
        this.addDp(ms.rewardDp);
        soundEngine.playAchievement();
        this.pushToast(`Milestone: ${ms.name}`, ms.rewardDesc, '#38bdf8', '🏁');
      }
    }

    // Messages
    this.checkMessagesUnlock(false);
  }

  private checkMessagesUnlock(silent: boolean): void {
    for (const msg of MESSAGES_LIST) {
      const existing = this.state.messages[msg.id];
      if (!existing?.unlocked && msg.unlockCheck(this.state)) {
        this.state.messages[msg.id] = { unlocked: true, read: false, chosenIndex: null };
        if (!silent) {
          soundEngine.playNotification();
          this.pushToast(`New Message: ${msg.sender}`, msg.preview, '#a855f7', '💬');
        }
      }
    }
  }

  public getUnreadMessagesCount(): number {
    return Object.values(this.state.messages).filter((m) => m.unlocked && !m.read).length;
  }

  public markMessageRead(id: string): void {
    if (this.state.messages[id]) {
      this.state.messages[id].read = true;
      this.emit();
    }
  }

  public replyToMessage(id: string, choiceIndex: number): number {
    const msgDef = MESSAGES_LIST.find((m) => m.id === id);
    const msgState = this.state.messages[id];
    if (!msgDef || !msgState || !msgState.unlocked || msgState.chosenIndex !== null) return 0;
    const choice = msgDef.choices[choiceIndex];
    if (!choice) return 0;

    msgState.chosenIndex = choiceIndex;
    msgState.read = true;
    const factor = choice.rewardDpFactor ?? 10;
    const reward = Math.max(25, Math.round(this.getSwipeBaseDp() * factor + this.getTotalIdleDps() * 6));
    this.addDp(reward);
    soundEngine.playBonus();
    this.pushToast(msgDef.sender, `+${formatNumber(reward)} DP gift!`, '#4ade80', '💬');
    this.emit();
    return reward;
  }

  // Daily Challenges
  public ensureDailyChallenges(): void {
    const now = Date.now();
    if (this.state.dailyChallenges.length === 0 || now >= this.state.dailyResetAt) {
      this.generateNewDailyChallenges();
    }
  }

  public generateNewDailyChallenges(): void {
    const scale = Math.max(1, Math.floor(Math.sqrt(Math.max(100, this.state.lifetimeDp)) / 4));
    const templates: { type: DailyChallengeType; title: (t: number) => string; target: number; mult: number }[] = [
      { type: 'swipes', title: (t) => `Swipe ${t} times`, target: 40 + (this.state.dailyCompletedCount * 15), mult: 25 },
      { type: 'rare_posts', title: (t) => `Find ${t} Rare+ posts`, target: 3 + Math.floor(this.state.dailyCompletedCount / 2), mult: 45 },
      { type: 'combo', title: (t) => `Reach ${t}x Combo`, target: Math.min(24, 8 + this.state.dailyCompletedCount * 2), mult: 35 },
      { type: 'upgrades', title: (t) => `Buy ${t} upgrades/phones`, target: 5 + Math.floor(this.state.dailyCompletedCount / 2), mult: 35 },
      { type: 'likes', title: (t) => `Like ${t} posts`, target: 10 + this.state.dailyCompletedCount * 3, mult: 25 },
      { type: 'bonus_drops', title: (t) => `Catch ${t} bonus drops`, target: 2, mult: 55 },
    ];

    // Pick 3 distinct types
    const shuffled = [...templates].sort(() => Math.random() - 0.5).slice(0, 3);
    this.state.dailyChallenges = shuffled.map((tpl, i) => ({
      id: `dc_${Date.now()}_${i}`,
      type: tpl.type,
      title: tpl.title(tpl.target),
      target: tpl.target,
      progress: 0,
      rewardDp: Math.round(Math.max(120, this.getSwipeBaseDp() * tpl.mult + scale * 30)),
      rewardShards: i === 2 && this.state.lifetimeDp >= 25000 ? 1 : 0,
      claimed: false,
    }));
    this.state.dailyResetAt = Date.now() + 24 * 3600 * 1000;
  }

  private advanceDaily(type: DailyChallengeType, delta: number): void {
    for (const ch of this.state.dailyChallenges) {
      if (!ch.claimed && ch.type === type) {
        ch.progress = Math.min(ch.target, ch.progress + delta);
      }
    }
  }

  private setDailyMax(type: DailyChallengeType, val: number): void {
    for (const ch of this.state.dailyChallenges) {
      if (!ch.claimed && ch.type === type && val > ch.progress) {
        ch.progress = Math.min(ch.target, val);
      }
    }
  }

  public claimDailyChallenge(id: string): boolean {
    const ch = this.state.dailyChallenges.find((c) => c.id === id);
    if (!ch || ch.claimed || ch.progress < ch.target) return false;
    ch.claimed = true;
    this.state.dailyCompletedCount += 1;
    this.addDp(ch.rewardDp);
    if (ch.rewardShards > 0) {
      this.state.cloutShards += ch.rewardShards;
      this.state.totalCloutShardsEarned += ch.rewardShards;
    }
    soundEngine.playAchievement();
    this.pushToast(
      'Daily Challenge Complete!',
      `+${formatNumber(ch.rewardDp)} DP${ch.rewardShards ? ` & +${ch.rewardShards} 💎` : ''}`,
      '#4ade80',
      '🎯'
    );

    // If all 3 claimed, auto-refresh a fresh set!
    if (this.state.dailyChallenges.every((c) => c.claimed)) {
      window.setTimeout(() => {
        this.generateNewDailyChallenges();
        this.pushToast('New Daily Challenges!', 'Fresh missions ready to grind!', '#38bdf8', '📋');
        this.emit();
      }, 600);
    }
    this.checkProgression();
    this.emit();
    return true;
  }

  // ==================== NAVIGATION & SETTINGS ====================

  public setTab(tab: AppTab): void {
    this.state.activeTab = tab;
    this.emit();
  }

  public setShopSection(sec: ShopSection): void {
    this.state.activeShopSection = sec;
    this.emit();
  }

  public setBuyAmount(amt: 1 | 10 | 'max'): void {
    this.state.buyAmount = amt;
    this.emit();
  }

  public togglePause(): void {
    this.state.paused = !this.state.paused;
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    if (this.state.paused) crazyGames.gameplayStop();
    else crazyGames.gameplayStart();
    this.emit();
  }

  public toggleMute(): void {
    this.state.settings.muted = !this.state.settings.muted;
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    this.emit();
  }

  public toggleMusic(): void {
    soundEngine.unlock();
    this.state.settings.musicEnabled = !this.state.settings.musicEnabled;
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    this.emit();
  }

  public updateSettings(patch: Partial<GameState['settings']>): void {
    this.state.settings = { ...this.state.settings, ...patch };
    soundEngine.syncSettings(this.state.settings, this.state.paused);
    this.emit();
  }

  public setKeybind(action: KeybindAction, code: string): void {
    this.state.settings.keybinds = {
      ...this.state.settings.keybinds,
      [action]: code,
    };
    this.saveState();
    this.emit();
  }

  public resetKeybinds(): void {
    this.state.settings.keybinds = { ...DEFAULT_KEYBINDS };
    this.saveState();
    this.emit();
  }

  // ==================== MAIN TICK ====================

  public tick(dt: number): void {
    if (this.state.paused) return;

    this.state.playTimeSeconds += dt;

    // Combo decay
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }

    // Surge timer
    if (this.surgeTimer > 0) {
      this.surgeTimer = Math.max(0, this.surgeTimer - dt);
      if (this.surgeTimer === 0) this.surgeMultiplier = 1;
    }

    // Passive Phone Farm DP
    const farmDps = this.getTotalFarmDps();
    if (farmDps > 0) {
      this.addDp(farmDps * dt);
    }

    // Auto Scroller
    const autoRate = this.getAutoScrollRatePerSec();
    if (autoRate > 0) {
      this.autoScrollAccum += autoRate * dt;
      if (this.autoScrollAccum >= 1) {
        const steps = Math.min(3, Math.floor(this.autoScrollAccum));
        this.autoScrollAccum -= steps;
        for (let i = 0; i < steps; i++) {
          this.performSwipe(true);
        }
      }
    }

    // Bonus drops spawn & motion
    this.dropSpawnTimer -= dt;
    if (this.dropSpawnTimer <= 0) {
      this.spawnBonusDrop();
      const freqReduction = Math.min(10, this.state.phoneUpgrades.display * 0.8);
      this.dropSpawnTimer = Math.max(9, 20 - freqReduction) + Math.random() * 6;
    }

    for (let i = this.bonusDrops.length - 1; i >= 0; i--) {
      const d = this.bonusDrops[i];
      d.life += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < 0.08 || d.x > 0.92) d.vx *= -1;
      if (d.y < 0.14 || d.y > 0.82) d.vy *= -1;

      // AI Assistant catches drops automatically after 2.5s!
      if (this.state.automation.ai_assistant > 0 && d.life > Math.max(1.0, 3.2 - this.state.automation.ai_assistant * 0.4)) {
        this.catchBonusDrop(d.id, true);
        continue;
      }

      if (d.life >= d.maxLife) {
        this.bonusDrops.splice(i, 1);
      }
    }

    // Periodic milestone check + autosave
    this.saveAccum += dt;
    if (this.saveAccum >= 4) {
      this.saveAccum = 0;
      this.checkProgression();
      this.saveState();
    }
  }

  private spawnBonusDrop(): void {
    const kinds: BonusDrop['kind'][] = ['golden_like', 'viral_surge', 'mystery_box', 'battery_boost'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const meta: Record<BonusDrop['kind'], { label: string; color: string }> = {
      golden_like: { label: '✨ GOLD LIKE', color: '#facc15' },
      viral_surge: { label: '🔥 VIRAL 2.5X', color: '#f43f5e' },
      mystery_box: { label: '🎁 MYSTERY BOX', color: '#a855f7' },
      battery_boost: { label: '🔋 TURBO +8', color: '#4ade80' },
    };

    const sideLeft = Math.random() < 0.5;
    this.bonusDrops.push({
      id: this.dropSeq++,
      kind,
      label: meta[kind].label,
      color: meta[kind].color,
      x: sideLeft ? 0.12 + Math.random() * 0.16 : 0.72 + Math.random() * 0.16,
      y: 0.25 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      life: 0,
      maxLife: 11,
    });
  }
}
