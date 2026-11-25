export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PostCategory =
  | 'memes'
  | 'pets'
  | 'gaming'
  | 'food_asmr'
  | 'conspiracy'
  | 'cosmic';

export type AppThemeId =
  | 'classic'
  | 'dark'
  | 'vaporwave'
  | 'cyber_neon'
  | 'matrix'
  | 'gold_vip'
  | 'void_rebirth';

export type PhoneUpgradeId =
  | 'screen'
  | 'processor'
  | 'battery'
  | 'display'
  | 'algorithm';

export type FarmPhoneId =
  | 'old_android'
  | 'basic_iphone'
  | 'gaming_phone'
  | 'premium_phone'
  | 'ultra_phone'
  | 'quantum_phone';

export type AutomationId =
  | 'auto_scroller'
  | 'background_scrolling'
  | 'multiple_accounts'
  | 'ai_assistant'
  | 'phone_farm_manager'
  | 'cloud_botnet';

export type TechUpgradeId =
  | 'better_wifi'
  | 'faster_internet'
  | 'phone_accessories'
  | 'charging_stations'
  | 'multiple_sims'
  | 'premium_algorithms'
  | 'advanced_automation';

export type DecorId =
  | 'led_strip'
  | 'lava_lamp'
  | 'gaming_poster'
  | 'bonsai'
  | 'neon_sign'
  | 'mini_fridge'
  | 'hologram'
  | 'gold_trophy'
  | 'server_rack'
  | 'quantum_core';

export type PrestigeUpgradeId =
  | 'soul_multiplier'
  | 'keep_automation'
  | 'starter_kit'
  | 'luck_aura'
  | 'golden_thumb'
  | 'farm_overdrive'
  | 'offline_mastery'
  | 'void_crown';

export type AppTab =
  | 'swipes'
  | 'shop'
  | 'messages'
  | 'awards'
  | 'stats'
  | 'rebirth'
  | 'settings';

export type ShopSection =
  | 'phone'
  | 'farm'
  | 'automation'
  | 'tech'
  | 'customize';

export type PixelArtSceneId =
  | 'cat_mug'
  | 'coffee_3am'
  | 'cereal_hot_take'
  | 'fridge_check'
  | 'sleep_schedule'
  | 'doge_stare'
  | 'pancake_flip'
  | 'power_wash'
  | 'pixel_ramen'
  | 'crab_rave'
  | 'speedrun_trophy'
  | 'arcade_cab'
  | 'ufo_cow'
  | 'tin_foil'
  | 'glitch_skull'
  | 'golden_meme'
  | 'synth_city'
  | 'quantum_orb'
  | 'dev_cat'
  | 'pizza_slice'
  | 'capybara_chill'
  | 'neon_dragon'
  | 'cyber_duck'
  | 'void_eye'
  | 'laser_cat'
  | 'car_drift'
  | 'fireworks'
  | 'dj_turntable'
  | 'rocket_launch'
  | 'slime_squish'
  | 'karaoke_frog'
  | 'pixel_aquarium'
  | 'meteor_shower'
  | 'speed_typer'
  | 'toaster_pop'
  | 'confetti_cannon';

export interface PostTemplate {
  id: string;
  category: PostCategory;
  rarity: Rarity;
  author: string;
  handle: string;
  avatarColor: string;
  title: string;
  caption: string;
  tags: string[];
  art: PixelArtSceneId;
  baseLikes: number;
}

export interface ActivePost extends PostTemplate {
  instanceId: number;
  likes: number;
  liked: boolean;
  dpEarned: number;
  bonusTagged: boolean;
  views: number;
  durationSec: number;
}

export interface RarityConfig {
  id: Rarity;
  label: string;
  color: string;
  bg: string;
  multiplier: number;
  baseWeight: number;
  particles: number;
}

export interface PhoneUpgradeDef {
  id: PhoneUpgradeId;
  name: string;
  subtitle: string;
  icon: string;
  baseCost: number;
  costScale: number;
  effectText: (level: number) => string;
  tiers: string[];
}

export interface FarmPhoneDef {
  id: FarmPhoneId;
  name: string;
  tagline: string;
  baseCost: number;
  costScale: number;
  baseDps: number;
  unlockDp: number;
  bodyColor: string;
  screenColor: string;
  accentColor: string;
  overclockBaseCost: number;
}

export interface AutomationDef {
  id: AutomationId;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
  unlockDp: number;
}

export interface TechUpgradeDef {
  id: TechUpgradeId;
  name: string;
  categoryLabel: string;
  description: string;
  icon: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
  tiers: string[];
}

export interface DecorDef {
  id: DecorId;
  name: string;
  description: string;
  cost: number;
  buffLabel: string;
  dpMultiplierBonus: number;
  swipeMultiplierBonus: number;
  luckBonus: number;
}

export interface CategoryDef {
  id: PostCategory;
  name: string;
  icon: string;
  cost: number;
  description: string;
  swipeBonus: number;
}

export interface ThemeDef {
  id: AppThemeId;
  name: string;
  cost: number;
  requiresRebirth?: boolean;
  primary: string;
  accent: string;
  screenBg: string;
  cardBg: string;
  text: string;
  muted: string;
  border: string;
}

export interface PrestigeUpgradeDef {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costScale: number;
  maxLevel: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewardPercent: number;
  check: (state: GameState) => boolean;
}

export interface MilestoneDef {
  id: string;
  name: string;
  targetLifetimeDp: number;
  rewardDp: number;
  rewardDesc: string;
}

export type DailyChallengeType =
  | 'swipes'
  | 'rare_posts'
  | 'combo'
  | 'upgrades'
  | 'bonus_drops'
  | 'likes';

export interface DailyChallenge {
  id: string;
  type: DailyChallengeType;
  title: string;
  target: number;
  progress: number;
  rewardDp: number;
  rewardShards: number;
  claimed: boolean;
}

export interface MessageChoice {
  label: string;
  replyText: string;
  rewardDpFactor?: number;
}

export interface MessageDef {
  id: string;
  sender: string;
  handle: string;
  avatarColor: string;
  preview: string;
  body: string;
  unlockCheck: (state: GameState) => boolean;
  choices: MessageChoice[];
}

export interface MessageState {
  unlocked: boolean;
  read: boolean;
  chosenIndex: number | null;
}

export type KeybindAction =
  | 'swipePrimary'
  | 'swipeSecondary'
  | 'likePost'
  | 'pause'
  | 'mute';

export interface KeybindsConfig {
  swipePrimary: string;
  swipeSecondary: string;
  likePost: string;
  pause: string;
  mute: string;
}

export interface GameSettings {
  muted: boolean;
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  screenShake: boolean;
  particles: boolean;
  floatingNumbers: boolean;
  reducedMotion: boolean;
  keybinds: KeybindsConfig;
}

export interface GameState {
  version: number;
  dp: number;
  runDp: number;
  lifetimeDp: number;
  cloutShards: number;
  totalCloutShardsEarned: number;
  rebirthCount: number;

  totalSwipes: number;
  runSwipes: number;
  totalLikes: number;
  totalBonusCaught: number;
  bestCombo: number;
  playTimeSeconds: number;
  lastSavedAt: number;

  rarityCounts: Record<Rarity, number>;

  phoneUpgrades: Record<PhoneUpgradeId, number>;
  farmPhones: Record<FarmPhoneId, number>;
  farmOverclocks: Record<FarmPhoneId, number>;
  automation: Record<AutomationId, number>;
  techUpgrades: Record<TechUpgradeId, number>;
  decor: Record<DecorId, boolean>;
  unlockedCategories: Record<PostCategory, boolean>;
  activeCategory: PostCategory | 'all';
  unlockedThemes: Record<AppThemeId, boolean>;
  activeTheme: AppThemeId;
  prestigeUpgrades: Record<PrestigeUpgradeId, number>;

  achievements: Record<string, boolean>;
  milestonesClaimed: Record<string, boolean>;
  messages: Record<string, MessageState>;

  dailyChallenges: DailyChallenge[];
  dailyResetAt: number;
  dailyCompletedCount: number;

  buyAmount: 1 | 10 | 'max';
  activeTab: AppTab;
  activeShopSection: ShopSection;
  paused: boolean;
  settings: GameSettings;
}

export interface BonusDrop {
  id: number;
  kind: 'golden_like' | 'viral_surge' | 'mystery_box' | 'battery_boost';
  label: string;
  x: number; // 0..1 normalized in canvas
  y: number; // 0..1 normalized in canvas
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}
