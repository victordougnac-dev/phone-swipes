import { FARM_PHONES } from '../data/gameData';
import type { BonusDrop, FarmPhoneId, GameState } from '../types/game';

interface RoomParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface PhoneSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  floating?: boolean;
}

const DESK_PHONE_SLOTS: PhoneSlot[] = [
  // Left desk cluster
  { x: 38, y: 124, w: 10, h: 16 },
  { x: 52, y: 121, w: 10, h: 16 },
  { x: 66, y: 125, w: 10, h: 16 },
  { x: 24, y: 132, w: 11, h: 17 },
  { x: 80, y: 129, w: 10, h: 16 },
  // Right desk cluster
  { x: 226, y: 126, w: 10, h: 16 },
  { x: 240, y: 122, w: 10, h: 16 },
  { x: 254, y: 125, w: 10, h: 16 },
  { x: 270, y: 130, w: 11, h: 17 },
  { x: 286, y: 134, w: 11, h: 17 },
  // Back shelf & stands
  { x: 222, y: 66, w: 8, h: 13 },
  { x: 233, y: 66, w: 8, h: 13 },
  { x: 244, y: 66, w: 8, h: 13 },
  { x: 255, y: 66, w: 8, h: 13 },
  // Second tier desk rack
  { x: 44, y: 106, w: 9, h: 14 },
  { x: 57, y: 106, w: 9, h: 14 },
  { x: 248, y: 106, w: 9, h: 14 },
  { x: 261, y: 106, w: 9, h: 14 },
  // Floating quantum spots
  { x: 76, y: 84, w: 10, h: 16, floating: true },
  { x: 234, y: 84, w: 10, h: 16, floating: true },
];

const STARS = Array.from({ length: 24 }, (_, i) => ({
  x: 114 + ((i * 37) % 92),
  y: 22 + ((i * 19) % 44),
  phase: i * 0.9,
}));

export class RoomRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buffer: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private readonly W = 320;
  private readonly H = 180;
  private particles: RoomParticle[] = [];
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize 2D context');
    this.ctx = ctx;

    this.buffer = document.createElement('canvas');
    this.buffer.width = this.W;
    this.buffer.height = this.H;
    const bctx = this.buffer.getContext('2d');
    if (!bctx) throw new Error('Could not initialize buffer context');
    this.bctx = bctx;
    this.bctx.imageSmoothingEnabled = false;
  }

  public spawnBurst(normX: number, normY: number, color: string, count: number): void {
    const cx = normX * this.W;
    const cy = normY * this.H;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 18 + Math.random() * 48;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 18,
        color,
        size: Math.random() > 0.6 ? 3 : 2,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.55,
      });
    }
    if (this.particles.length > 180) {
      this.particles.splice(0, this.particles.length - 180);
    }
  }

  public render(dt: number, state: GameState, bonusDrops: BonusDrop[], feverActive: boolean): void {
    if (!state.paused) {
      this.time += dt;
    }

    // Resize display canvas to match container cleanly
    const rect = this.canvas.getBoundingClientRect();
    const targetW = Math.max(320, Math.floor(rect.width));
    const targetH = Math.max(180, Math.floor(rect.height));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    const g = this.bctx;
    const t = this.time;

    // 1. Bedroom Wall & Ceiling
    g.fillStyle = '#17152b';
    g.fillRect(0, 0, this.W, 120);
    // Subtle vertical wallpaper stripes
    g.fillStyle = '#1d1a36';
    for (let x = 0; x < this.W; x += 16) {
      g.fillRect(x, 0, 8, 120);
    }
    // Baseboard
    g.fillStyle = '#2d2547';
    g.fillRect(0, 114, this.W, 6);

    // 2. LED Strip Decor along ceiling/wall trim
    if (state.decor.led_strip || feverActive) {
      const hue = feverActive ? (t * 220) % 360 : (t * 45) % 360;
      g.fillStyle = `hsl(${hue}, 90%, 62%)`;
      g.fillRect(0, 8, this.W, 2);
      g.fillStyle = `hsla(${hue}, 90%, 60%, 0.14)`;
      g.fillRect(0, 10, this.W, 16);
    }

    // 3. Bedroom Window (center-back)
    g.fillStyle = '#090b1a';
    g.fillRect(110, 18, 100, 56);
    // Night sky gradient bands
    g.fillStyle = '#111633';
    g.fillRect(110, 44, 100, 30);
    // Moon
    g.fillStyle = '#fef08a';
    g.fillRect(184, 24, 9, 9);
    g.fillStyle = '#090b1a';
    g.fillRect(188, 25, 6, 6);
    // Stars
    for (const s of STARS) {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + s.phase));
      g.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(2)})`;
      g.fillRect(s.x, s.y, 1, 1);
    }
    // Distant pixel skyline
    const bldgs = [
      [112, 54, 12, 20],
      [126, 48, 10, 26],
      [138, 57, 14, 17],
      [156, 51, 12, 23],
      [172, 56, 11, 18],
      [186, 49, 14, 25],
    ];
    for (const [bx, by, bw, bh] of bldgs) {
      g.fillStyle = '#181c3a';
      g.fillRect(bx, by, bw, bh);
      g.fillStyle = '#facc15';
      g.fillRect(bx + 3, by + 4, 2, 2);
      g.fillRect(bx + 7, by + 9, 2, 2);
    }
    // Window frame
    g.fillStyle = '#3b335c';
    g.fillRect(108, 16, 104, 3);
    g.fillRect(108, 73, 104, 4);
    g.fillRect(108, 16, 3, 60);
    g.fillRect(209, 16, 3, 60);
    g.fillRect(159, 18, 2, 56);

    // 4. Left Bed & Pillow (Cozy bedroom depth)
    g.fillStyle = '#2b2248';
    g.fillRect(0, 88, 58, 34);
    g.fillStyle = '#4c1d95';
    g.fillRect(0, 96, 58, 26);
    g.fillStyle = '#c4b5fd';
    g.fillRect(6, 90, 20, 8);

    // 5. Left Wall: Retro Poster & Neon Sign
    if (state.decor.gaming_poster) {
      g.fillStyle = '#0f172a';
      g.fillRect(22, 28, 28, 36);
      g.fillStyle = '#e2e8f0';
      g.fillRect(21, 27, 30, 1);
      g.fillRect(21, 64, 30, 1);
      g.fillStyle = '#ec4899';
      g.fillRect(25, 32, 22, 12);
      g.fillStyle = '#facc15';
      g.fillRect(30, 35, 12, 6);
      g.fillStyle = '#38bdf8';
      g.fillRect(25, 48, 22, 12);
    } else {
      // Simple corkboard
      g.fillStyle = '#5c4033';
      g.fillRect(26, 34, 22, 18);
      g.fillStyle = '#fef08a';
      g.fillRect(30, 38, 6, 6);
      g.fillStyle = '#93c5fd';
      g.fillRect(38, 41, 6, 7);
    }

    if (state.decor.neon_sign) {
      const pulse = 0.75 + 0.25 * Math.sin(t * 4);
      g.fillStyle = `rgba(244, 114, 182, ${pulse.toFixed(2)})`;
      g.fillRect(62, 30, 36, 14);
      g.fillStyle = '#180529';
      g.fillRect(64, 32, 32, 10);
      g.fillStyle = '#f0abfc';
      // Pixel "SWIPE" mini glyph bars
      g.fillRect(67, 35, 5, 4);
      g.fillRect(74, 35, 5, 4);
      g.fillRect(81, 35, 4, 4);
      g.fillRect(87, 35, 6, 4);
    }

    // 6. Right Wall Shelf & Collectibles
    g.fillStyle = '#5b3c28';
    g.fillRect(218, 79, 82, 4);
    g.fillStyle = '#3e2719';
    g.fillRect(224, 83, 4, 5);
    g.fillRect(288, 83, 4, 5);

    if (state.decor.gold_trophy) {
      g.fillStyle = '#facc15';
      g.fillRect(272, 67, 8, 7);
      g.fillRect(275, 74, 2, 3);
      g.fillRect(273, 77, 6, 2);
      if (Math.floor(t * 3) % 4 === 0) {
        g.fillStyle = '#ffffff';
        g.fillRect(273, 66, 2, 2);
      }
    }

    // 7. Right Floor/Corner: Mini Fridge & Server Rack
    if (state.decor.mini_fridge) {
      g.fillStyle = '#1e293b';
      g.fillRect(284, 88, 32, 34);
      g.fillStyle = '#38bdf8';
      g.fillRect(287, 92, 26, 16);
      g.fillStyle = '#ef4444';
      g.fillRect(290, 101, 4, 5);
      g.fillStyle = '#22c55e';
      g.fillRect(297, 101, 4, 5);
      g.fillStyle = '#facc15';
      g.fillRect(304, 101, 4, 5);
    }

    if (state.decor.server_rack) {
      g.fillStyle = '#0f172a';
      g.fillRect(62, 62, 22, 54);
      g.fillStyle = '#1e293b';
      g.fillRect(64, 65, 18, 48);
      for (let row = 0; row < 6; row++) {
        const blink = ((Math.floor(t * 5) + row) % 3) === 0;
        g.fillStyle = blink ? '#22c55e' : '#065f46';
        g.fillRect(67, 68 + row * 8, 3, 2);
        g.fillStyle = ((Math.floor(t * 7) + row) % 4) === 0 ? '#38bdf8' : '#1e3a8a';
        g.fillRect(72, 68 + row * 8, 3, 2);
      }
    }

    // 8. Foreground First-Person Desk
    g.fillStyle = '#5c3b28';
    g.fillRect(0, 120, this.W, 60);
    // Desk top highlight edge
    g.fillStyle = '#7c5238';
    g.fillRect(0, 120, this.W, 3);
    // Desk mat in center
    g.fillStyle = '#1e1b2e';
    g.fillRect(88, 128, 144, 48);
    g.fillStyle = feverActive ? '#f43f5e' : '#38bdf8';
    g.fillRect(88, 128, 144, 1);

    // 9. Desk Decorations
    if (state.decor.lava_lamp) {
      g.fillStyle = '#94a3b8';
      g.fillRect(14, 108, 8, 12);
      g.fillStyle = '#312e81';
      g.fillRect(15, 96, 6, 12);
      const blobY = 98 + Math.round(Math.sin(t * 2) * 3 + 3);
      g.fillStyle = '#f43f5e';
      g.fillRect(16, blobY, 4, 4);
      g.fillRect(17, 105 - Math.round(Math.sin(t * 1.5) * 2), 3, 3);
    }

    if (state.decor.bonsai) {
      g.fillStyle = '#9a3412';
      g.fillRect(290, 114, 14, 7);
      g.fillStyle = '#78350f';
      g.fillRect(295, 106, 4, 8);
      g.fillStyle = '#16a34a';
      g.fillRect(288, 99, 18, 8);
      g.fillStyle = '#4ade80';
      g.fillRect(291, 96, 12, 5);
    }

    if (state.decor.hologram) {
      g.fillStyle = '#334155';
      g.fillRect(92, 115, 14, 5);
      const hy = 98 + Math.round(Math.sin(t * 3) * 2);
      g.fillStyle = 'rgba(56, 189, 248, 0.35)';
      g.fillRect(94, 104, 10, 11);
      g.fillStyle = '#38bdf8';
      g.fillRect(96, hy, 6, 9);
      g.fillStyle = '#e0f2fe';
      g.fillRect(97, hy + 2, 4, 5);
    }

    if (state.decor.quantum_core) {
      const qy = 42 + Math.round(Math.sin(t * 2.5) * 3);
      g.fillStyle = 'rgba(45, 212, 191, 0.25)';
      g.fillRect(150, qy - 3, 20, 20);
      g.fillStyle = '#2dd4bf';
      g.fillRect(154, qy + 1, 12, 12);
      g.fillStyle = '#f0fdfa';
      g.fillRect(157, qy + 4, 6, 6);
      const ox = 158 + Math.round(Math.cos(t * 4) * 11);
      const oy = qy + 6 + Math.round(Math.sin(t * 4) * 5);
      g.fillStyle = '#facc15';
      g.fillRect(ox, oy, 3, 3);
    }

    // 10. Render Owned Phones in the Room!
    const ownedList: { def: (typeof FARM_PHONES)[number]; id: FarmPhoneId }[] = [];
    // Show highest-tier phones first or distribute proportionally so room reflects empire
    const reversePhones = [...FARM_PHONES].reverse();
    for (const def of reversePhones) {
      const count = state.farmPhones[def.id] || 0;
      const showCount = Math.min(count, 6);
      for (let i = 0; i < showCount; i++) {
        ownedList.push({ def, id: def.id });
      }
    }

    const totalVisible = Math.min(ownedList.length, DESK_PHONE_SLOTS.length);
    for (let i = 0; i < totalVisible; i++) {
      const item = ownedList[i];
      const slot = DESK_PHONE_SLOTS[i];
      const isQuantum = item.id === 'quantum_phone';
      const floatOff = isQuantum || slot.floating ? Math.round(Math.sin(t * 3 + i) * 2) : 0;
      const px = slot.x;
      const py = slot.y + floatOff;

      // Stand shadow
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(slot.x + 1, slot.y + slot.h - 1, slot.w - 2, 2);

      // Phone body
      g.fillStyle = item.def.bodyColor;
      g.fillRect(px, py, slot.w, slot.h);

      // Screen
      g.fillStyle = '#090d16';
      g.fillRect(px + 1, py + 1, slot.w - 2, slot.h - 3);

      // Animated scrolling feed bars inside mini phone!
      const scrollOff = Math.floor(t * 8 + i * 3) % (slot.h - 5);
      g.fillStyle = item.def.screenColor;
      g.fillRect(px + 2, py + 2 + scrollOff, slot.w - 4, 3);
      g.fillStyle = item.def.accentColor;
      g.fillRect(px + 2, py + 2 + ((scrollOff + 5) % (slot.h - 5)), slot.w - 4, 2);

      // Tiny DP spark rising above active phone
      const sparkProgress = ((t * 1.4 + i * 0.37) % 1);
      if (sparkProgress < 0.7) {
        g.fillStyle = isQuantum ? '#2dd4bf' : '#4ade80';
        g.fillRect(px + Math.floor(slot.w / 2), py - Math.floor(sparkProgress * 10), 2, 2);
      }
    }

    // 11. Subtle First-Person Wrist/Hands silhouette at bottom center
    g.fillStyle = '#eab38f';
    g.fillRect(102, 166, 22, 14);
    g.fillRect(196, 166, 22, 14);
    g.fillStyle = '#334155';
    g.fillRect(98, 174, 28, 6);
    g.fillRect(194, 174, 28, 6);

    // 12. Floating Bonus Drops in Room
    for (const drop of bonusDrops) {
      const dx = Math.round(drop.x * this.W);
      const dy = Math.round(drop.y * this.H);
      const pulse = Math.round(Math.sin(t * 8) * 1);
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(dx - 7, dy - 7, 15, 15);
      g.fillStyle = drop.color;
      g.fillRect(dx - 6 - pulse, dy - 6 - pulse, 12 + pulse * 2, 12 + pulse * 2);
      g.fillStyle = '#ffffff';
      g.fillRect(dx - 2, dy - 2, 4, 4);
    }

    // 13. Update & Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 65 * dt;
      const alpha = 1 - p.life / p.maxLife;
      g.globalAlpha = Math.max(0, alpha);
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    g.globalAlpha = 1;

    // 14. Blit pixel buffer to full display canvas crisply
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, targetW, targetH);

    // Cover-scale the 320x180 pixel scene cleanly
    const scale = Math.max(targetW / this.W, targetH / this.H);
    const drawW = this.W * scale;
    const drawH = this.H * scale;
    const drawX = (targetW - drawW) / 2;
    const drawY = (targetH - drawH) / 2;
    this.ctx.drawImage(this.buffer, drawX, drawY, drawW, drawH);
  }
}
