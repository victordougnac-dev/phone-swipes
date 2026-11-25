import type { GameSettings, Rarity } from '../types/game';

type AudioSettings = Pick<GameSettings, 'muted' | 'sfxVolume' | 'musicEnabled' | 'musicVolume'>;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private settings: AudioSettings = {
    muted: false,
    sfxVolume: 0.7,
    musicEnabled: false,
    musicVolume: 0.35,
  };
  private paused = false;

  public syncSettings(settings: AudioSettings, paused: boolean): void {
    const prevMusic = this.settings.musicEnabled && !this.settings.muted && !this.paused;
    this.settings = { ...settings };
    this.paused = paused;
    const nextMusic = this.settings.musicEnabled && !this.settings.muted && !this.paused;

    if (nextMusic && !prevMusic) {
      this.startMusicLoop();
    } else if (!nextMusic && prevMusic) {
      this.stopMusicLoop();
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.settings.musicEnabled && !this.settings.muted && !this.paused && this.musicTimer === null) {
      this.startMusicLoop();
    }
  }

  private canPlaySfx(): boolean {
    return !this.settings.muted && this.settings.sfxVolume > 0.01 && !this.paused;
  }

  private getSfxGain(): number {
    return Math.max(0, Math.min(1, this.settings.sfxVolume)) * 0.22;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    gainLevel: number,
    delay = 0
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playSwipe(combo: number): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    const pitchBoost = Math.min(280, combo * 10);
    // Soft swipe pop + dopamine blip
    this.playTone(260 + pitchBoost * 0.4, 520 + pitchBoost, 0.075, 'triangle', g * 0.7);
    this.playTone(580 + pitchBoost, 780 + pitchBoost, 0.06, 'sine', g * 0.45, 0.02);
  }

  public playLike(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    this.playTone(523.25, 659.25, 0.08, 'sine', g * 0.6);
    this.playTone(783.99, 1046.5, 0.1, 'triangle', g * 0.5, 0.05);
  }

  public playRarity(rarity: Rarity): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    if (rarity === 'uncommon') {
      this.playTone(523, 659, 0.09, 'triangle', g * 0.65);
      this.playTone(659, 784, 0.12, 'triangle', g * 0.65, 0.07);
    } else if (rarity === 'rare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this.playTone(f, f, 0.11, 'square', g * 0.38, i * 0.055);
      });
    } else if (rarity === 'epic') {
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => {
        this.playTone(f, f * 1.02, 0.13, 'square', g * 0.42, i * 0.05);
      });
    } else if (rarity === 'legendary') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      notes.forEach((f, i) => {
        this.playTone(f, f, 0.18, 'square', g * 0.45, i * 0.055);
        this.playTone(f * 0.5, f * 0.5, 0.18, 'triangle', g * 0.35, i * 0.055);
      });
    }
  }

  public playBuy(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    this.playTone(440, 554, 0.07, 'square', g * 0.4);
    this.playTone(659, 880, 0.1, 'triangle', g * 0.6, 0.05);
  }

  public playError(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    this.playTone(180, 120, 0.1, 'sawtooth', g * 0.35);
  }

  public playBonus(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    [659.25, 880, 1174.66, 1567.98].forEach((f, i) => {
      this.playTone(f, f, 0.1, 'triangle', g * 0.6, i * 0.045);
    });
  }

  public playAchievement(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.playTone(f, f, 0.16, 'triangle', g * 0.65, i * 0.08);
    });
  }

  public playNotification(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    this.playTone(880, 880, 0.07, 'sine', g * 0.45);
    this.playTone(1174.66, 1174.66, 0.11, 'sine', g * 0.45, 0.07);
  }

  public playRebirth(): void {
    this.unlock();
    if (!this.canPlaySfx() || !this.ctx) return;
    const g = this.getSfxGain();
    const arp = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51];
    arp.forEach((f, i) => {
      this.playTone(f, f * 1.05, 0.25, 'triangle', g * 0.55, i * 0.07);
    });
  }

  private startMusicLoop(): void {
    if (this.musicTimer !== null) return;
    const bassPattern = [130.81, 0, 130.81, 146.83, 164.81, 0, 196.0, 164.81, 174.61, 0, 174.61, 164.81, 146.83, 0, 196.0, 146.83];
    const leadPattern = [523.25, 0, 659.25, 0, 783.99, 659.25, 523.25, 0, 587.33, 0, 698.46, 0, 659.25, 587.33, 493.88, 0];

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.settings.muted || !this.settings.musicEnabled || this.paused) return;

      const vol = Math.max(0, Math.min(1, this.settings.musicVolume)) * 0.08;
      if (vol <= 0.001) return;

      const idx = this.step % bassPattern.length;
      const bass = bassPattern[idx];
      const lead = leadPattern[idx];

      if (bass > 0) {
        this.playTone(bass, bass, 0.16, 'triangle', vol * 0.9);
      }
      if (lead > 0 && this.step % 32 >= 8) {
        this.playTone(lead, lead, 0.14, 'sine', vol * 0.55);
      }
      this.step++;
    }, 240);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
