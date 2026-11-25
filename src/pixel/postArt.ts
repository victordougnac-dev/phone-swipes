import type { PixelArtSceneId } from '../types/game';

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function renderPostPixelArt(
  canvas: HTMLCanvasElement,
  scene: PixelArtSceneId,
  tick = 0
): void {
  const W = 48;
  const H = 34;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const bob = Math.round(Math.sin(tick * 0.45));
  const wave = Math.sin(tick * 0.35);
  const f4 = tick % 4;
  const f8 = tick % 8;

  switch (scene) {
    case 'cat_mug': {
      px(ctx, 0, 0, W, H, '#1e293b');
      px(ctx, 0, 24, W, 10, '#7c4a2d');
      px(ctx, 0, 24, W, 1, '#a46b46');
      px(ctx, 11, 10, 12, 14, '#f97316');
      px(ctx, 11, 6, 3, 4, '#f97316');
      px(ctx, 20, 6, 3, 4, '#f97316');
      px(ctx, 13, 13, 2, 2, '#0f172a');
      px(ctx, 19, 13, 2, 2, '#0f172a');
      px(ctx, 16, 15, 2, 1, '#fda4af');
      // Animated swatting paw
      px(ctx, 23 + (f4 >= 2 ? 2 : 0), 18, 5, 3, '#fb923c');
      // Mug tipping
      const fall = f4 === 3 ? 3 : f4 === 2 ? 1 : 0;
      px(ctx, 30 + fall, 17 + fall * 2, 8, 9, '#f8fafc');
      px(ctx, 31 + fall, 18 + fall * 2, 6, 2, '#6f4e37');
      px(ctx, 38 + fall, 19 + fall * 2, 2, 5, '#e2e8f0');
      break;
    }
    case 'coffee_3am': {
      px(ctx, 0, 0, W, H, '#0f172a');
      px(ctx, 5, 4, 2, 2, f4 % 2 ? '#facc15' : '#fef08a');
      px(ctx, 38, 6, 2, 2, f4 % 2 ? '#38bdf8' : '#e0f2fe');
      px(ctx, 0, 25, W, 9, '#334155');
      px(ctx, 18, 10, 12, 15, '#cbd5e1');
      px(ctx, 19, 12, 10, 12, '#78350f');
      px(ctx, 20, 13 + (f4 % 2), 4, 4, '#e0f2fe');
      px(ctx, 25, 15 - (f4 % 2), 3, 3, '#bae6fd');
      px(ctx, 24, 4, 2, 8, '#22c55e');
      px(ctx, 34, 14, 9, 5, '#e2e8f0');
      px(ctx, 35, 15, f4 < 2 ? 2 : 0, 3, '#ef4444');
      break;
    }
    case 'cereal_hot_take': {
      px(ctx, 0, 0, W, H, '#312e81');
      px(ctx, 0, 25, W, 9, '#4c1d95');
      px(ctx, 12, 16, 24, 10, '#f8fafc');
      px(ctx, 14, 26, 20, 2, '#cbd5e1');
      px(ctx, 14, 15, 20, 3, '#e0f2fe');
      px(ctx, 16, 14 + (f4 === 0 ? -1 : 0), 3, 2, '#fbbf24');
      px(ctx, 21, 13 + (f4 === 1 ? -1 : 0), 3, 2, '#f97316');
      px(ctx, 26, 14 + (f4 === 2 ? -1 : 0), 3, 2, '#f472b6');
      px(ctx, 30, 15 + (f4 === 3 ? -1 : 0), 2, 2, '#4ade80');
      px(ctx, 28, 7 + bob, 2, 9, '#94a3b8');
      break;
    }
    case 'fridge_check': {
      px(ctx, 0, 0, W, H, '#090d16');
      px(ctx, 13, 3, 22, 29, '#e2e8f0');
      px(ctx, 15, 5, 18, 25, f4 % 2 ? '#bae6fd' : '#e0f2fe');
      px(ctx, 15, 13, 18, 2, '#64748b');
      px(ctx, 15, 21, 18, 2, '#64748b');
      px(ctx, 17, 8, 4, 5, '#f8fafc');
      px(ctx, 25, 9, 4, 4, '#22c55e');
      px(ctx, 20, 16, 5, 5, '#fbbf24');
      px(ctx, 35, 3, 6, 29, '#cbd5e1');
      break;
    }
    case 'sleep_schedule': {
      px(ctx, 0, 0, W, H, '#17153b');
      px(ctx, 4, 22, 40, 12, '#2e236c');
      px(ctx, 6, 18, 10, 6, '#e2e8f0');
      px(ctx, 10, 15, 7, 7, '#fcd34d');
      px(ctx, 12, 17, 2, 2, '#0f172a');
      // Flickering phone glow
      px(ctx, 18, 13, 5, 5, f4 % 2 ? 'rgba(56,189,248,0.28)' : 'rgba(244,114,182,0.28)');
      px(ctx, 22, 13, 4, 7, '#38bdf8');
      px(ctx, 23, 14, 2, 5, f4 % 2 ? '#e0f2fe' : '#f472b6');
      px(ctx, 32, 6, 12, 6, '#0f172a');
      px(ctx, 34, 8, f4 % 2 ? 8 : 5, 2, '#ef4444');
      break;
    }
    case 'doge_stare': {
      px(ctx, 0, 0, W, H, '#78350f');
      px(ctx, 10, 6 + bob, 28, 28, '#f59e0b');
      px(ctx, 10, 3 + bob, 5, 6, '#d97706');
      px(ctx, 33, 3 + bob, 5, 6, '#d97706');
      px(ctx, 14, 18 + bob, 20, 12, '#fef3c7');
      px(ctx, 17, 13 + bob, 3, 3, '#0f172a');
      px(ctx, 28, 13 + bob, 3, 3, '#0f172a');
      px(ctx, 18, 13 + bob, 1, 1, f4 % 2 ? '#ffffff' : '#38bdf8');
      px(ctx, 29, 13 + bob, 1, 1, f4 % 2 ? '#ffffff' : '#38bdf8');
      px(ctx, 22, 18 + bob, 4, 3, '#1e293b');
      px(ctx, 20, 22 + bob, 8, 2, '#fb7185');
      break;
    }
    case 'pancake_flip': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 0, 26, W, 8, '#334155');
      px(ctx, 14, 22, 16, 4, '#64748b');
      px(ctx, 30, 23, 10, 2, '#94a3b8');
      const py = 12 - Math.round(Math.abs(wave) * 8);
      px(ctx, 17, py, 10, 3, '#f59e0b');
      px(ctx, 18, py + 4, 10, 3, '#d97706');
      px(ctx, 21, py - 2, 3, 2, '#fef08a');
      break;
    }
    case 'power_wash': {
      px(ctx, 0, 0, W, H, '#78350f');
      const cleanW = 14 + f8 * 3;
      px(ctx, 0, 0, cleanW, H, '#cbd5e1');
      px(ctx, 0, 10, cleanW, 1, '#94a3b8');
      px(ctx, 0, 22, cleanW, 1, '#94a3b8');
      px(ctx, cleanW, 15, 14, 4, '#38bdf8');
      px(ctx, cleanW - 1, 13, 4, 8, '#e0f2fe');
      px(ctx, Math.min(42, cleanW + 14), 14, 6, 6, '#475569');
      break;
    }
    case 'pixel_ramen': {
      px(ctx, 0, 0, W, H, '#3f1d2b');
      px(ctx, 16, 4 + (f4 % 2), 2, 5, '#f8fafc');
      px(ctx, 23, 3 + ((f4 + 1) % 2), 2, 6, '#f8fafc');
      px(ctx, 30, 5 + (f4 % 2), 2, 4, '#f8fafc');
      px(ctx, 11, 17, 26, 12, '#ef4444');
      px(ctx, 13, 15, 22, 4, '#fde68a');
      px(ctx, 16, 13, 5, 4, '#ffffff');
      px(ctx, 17, 14, 3, 2, '#f97316');
      px(ctx, 25, 14, 6, 3, '#a16207');
      px(ctx, 20, 8 + bob, 16, 2, '#d97706');
      break;
    }
    case 'crab_rave': {
      px(ctx, 0, 0, W, H, '#0284c7');
      px(ctx, 0, 22, W, 12, '#fde047');
      const cx = 18 + Math.round(wave * 5);
      const clawUp = f4 % 2 ? -2 : 0;
      px(ctx, cx, 16, 12, 8, '#ef4444');
      px(ctx, cx - 3, 12 + clawUp, 3, 5, '#f87171');
      px(ctx, cx + 12, 12 + clawUp, 3, 5, '#f87171');
      px(ctx, cx + 3, 18, 2, 2, '#0f172a');
      px(ctx, cx + 7, 18, 2, 2, '#0f172a');
      px(ctx, cx + 1, 24, 2, 3, '#dc2626');
      px(ctx, cx + 9, 24, 2, 3, '#dc2626');
      break;
    }
    case 'speedrun_trophy': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 18, 7 + bob, 12, 11, '#facc15');
      px(ctx, 15, 9 + bob, 3, 6, '#eab308');
      px(ctx, 30, 9 + bob, 3, 6, '#eab308');
      px(ctx, 22, 18 + bob, 4, 5, '#eab308');
      px(ctx, 17, 23 + bob, 14, 4, '#a16207');
      if (f4 % 2 === 0) px(ctx, 8, 5, 3, 3, '#fef08a');
      if (f4 % 2 === 1) px(ctx, 37, 11, 3, 3, '#38bdf8');
      break;
    }
    case 'arcade_cab': {
      px(ctx, 0, 0, W, H, '#0f0720');
      px(ctx, 14, 4, 20, 27, '#4f46e5');
      px(ctx, 16, 6, 16, 4, f4 % 2 ? '#ec4899' : '#facc15');
      px(ctx, 17, 11, 14, 9, '#0f172a');
      px(ctx, 19 + f4, 13, 4, 3, '#22c55e');
      px(ctx, 26, 15 + bob, 3, 3, '#facc15');
      px(ctx, 15, 21, 18, 3, '#1e1b4b');
      px(ctx, 18, 20, 2, 2, '#ef4444');
      break;
    }
    case 'ufo_cow': {
      px(ctx, 0, 0, W, H, '#090d1a');
      px(ctx, 0, 26, W, 8, '#14532d');
      px(ctx, 18, 12, 12, 15, f4 % 2 ? 'rgba(74,222,128,0.5)' : 'rgba(56,189,248,0.35)');
      const ux = 14 + Math.round(wave * 3);
      px(ctx, ux + 5, 5, 10, 4, '#38bdf8');
      px(ctx, ux, 8, 20, 4, '#94a3b8');
      px(ctx, ux + 3 + f4, 10, 2, 2, '#facc15');
      px(ctx, 20, 17 + bob * 2, 8, 5, '#f8fafc');
      px(ctx, 22, 18 + bob * 2, 3, 2, '#0f172a');
      break;
    }
    case 'tin_foil': {
      px(ctx, 0, 0, W, H, '#111827');
      px(ctx, 16, 5, 16, 12, '#cbd5e1');
      px(ctx, 21, 2, 6, 4, f4 % 2 ? '#e2e8f0' : '#38bdf8');
      px(ctx, 18, 17, 12, 10, '#fcd34d');
      px(ctx, 20 + (f4 % 2), 20, 3, 2, '#0f172a');
      px(ctx, 26 + (f4 % 2), 20, 3, 2, '#0f172a');
      break;
    }
    case 'glitch_skull': {
      px(ctx, 0, 0, W, H, '#180529');
      px(ctx, 15 + bob * 2, 7, 18, 14, '#f43f5e');
      px(ctx, 16, 7, 16, 14, '#e2e8f0');
      px(ctx, 18, 11, 4, 4, f4 % 2 ? '#0f172a' : '#22d3ee');
      px(ctx, 26, 11, 4, 4, f4 % 2 ? '#0f172a' : '#f43f5e');
      px(ctx, 19, 21, 10, 5, '#cbd5e1');
      px(ctx, 4 + f8, 10, 8, 2, '#22d3ee');
      px(ctx, 35 - f8, 18, 9, 2, '#a855f7');
      break;
    }
    case 'golden_meme': {
      px(ctx, 0, 0, W, H, '#422006');
      px(ctx, 8, 4, 32, 26, '#facc15');
      px(ctx, 10, 6, 28, 22, '#fef08a');
      px(ctx, 15, 10 + bob, 18, 12, '#ca8a04');
      px(ctx, 15, 8 + bob, 3, 3, '#f59e0b');
      px(ctx, 22, 7 + bob, 4, 4, '#f59e0b');
      px(ctx, 30, 8 + bob, 3, 3, '#f59e0b');
      px(ctx, 22, 15 + bob, 4, 4, f4 % 2 ? '#38bdf8' : '#ffffff');
      break;
    }
    case 'synth_city': {
      px(ctx, 0, 0, W, H, '#2e1065');
      px(ctx, 16, 5, 16, 14, '#f43f5e');
      px(ctx, 16, 12, 16, 2, '#facc15');
      px(ctx, 16, 15, 16, 2, '#2e1065');
      px(ctx, 0, 20, W, 14, '#090d1a');
      px(ctx, 4, 14, 6, 12, '#1e1b4b');
      px(ctx, 12, 11, 7, 15, '#312e81');
      px(ctx, 28, 12, 8, 14, '#1e1b4b');
      px(ctx, 38, 15, 7, 11, '#312e81');
      px(ctx, (f8 * 6) % W, 27, 8, 2, '#06b6d4');
      break;
    }
    case 'quantum_orb': {
      px(ctx, 0, 0, W, H, '#040914');
      px(ctx, 14, 7, 20, 20, '#0891b2');
      px(ctx, 17, 10, 14, 14, '#2dd4bf');
      px(ctx, 20, 13, 8, 8, '#f0fdfa');
      const ox = 22 + Math.round(Math.cos(tick * 0.6) * 14);
      const oy = 16 + Math.round(Math.sin(tick * 0.6) * 8);
      px(ctx, ox, oy, 4, 4, '#f472b6');
      px(ctx, 44 - ox, 32 - oy, 4, 4, '#facc15');
      break;
    }
    case 'dev_cat': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 6, 22, 36, 8, '#334155');
      px(ctx, 8 + f4, 24, 4, 4, '#4ade80');
      px(ctx, 16, 9 + bob, 16, 14, '#0f172a');
      px(ctx, 16, 6 + bob, 4, 4, '#0f172a');
      px(ctx, 28, 6 + bob, 4, 4, '#0f172a');
      px(ctx, 19, 11 + bob, 3, 3, '#4ade80');
      px(ctx, 26, 11 + bob, 3, 3, '#4ade80');
      px(ctx, 21, 17 + bob, 6, 6, '#f8fafc');
      break;
    }
    case 'pizza_slice': {
      px(ctx, 0, 0, W, H, '#2b1322');
      px(ctx, 12, 8 + bob, 24, 5, '#d97706');
      px(ctx, 14, 13 + bob, 20, 5, '#facc15');
      px(ctx, 17, 18 + bob, 14, 5, '#facc15');
      px(ctx, 21, 23 + bob, 6, 5, '#facc15');
      px(ctx, 18, 14 + bob, 4, 3, '#ef4444');
      px(ctx, 26, 15 + bob, 4, 3, '#ef4444');
      px(ctx, 22, 20 + bob, 4, 3, '#ef4444');
      break;
    }
    case 'capybara_chill': {
      px(ctx, 0, 0, W, H, '#0c4a6e');
      px(ctx, 0, 21, W, 13, '#38bdf8');
      px(ctx, 13, 11 + (f4 % 2), 22, 13, '#a16207');
      px(ctx, 16, 14 + (f4 % 2), 3, 2, '#0f172a');
      px(ctx, 13, 17 + (f4 % 2), 3, 3, '#78350f');
      px(ctx, 22, 6 + (f4 % 2), 6, 5, '#f97316');
      px(ctx, 24, 5 + (f4 % 2), 2, 1, '#22c55e');
      break;
    }
    case 'neon_dragon': {
      px(ctx, 0, 0, W, H, '#120524');
      px(ctx, 14, 8 + bob, 18, 16, '#ec4899');
      px(ctx, 12, 5 + bob, 4, 5, '#00f5d4');
      px(ctx, 28, 5 + bob, 4, 5, '#00f5d4');
      px(ctx, 18, 13 + bob, 4, 3, '#facc15');
      px(ctx, 26, 13 + bob, 4, 3, '#facc15');
      px(ctx, 4, 20, f4 * 4 + 4, 3, '#f97316');
      break;
    }
    case 'cyber_duck': {
      px(ctx, 0, 0, W, H, '#0f172a');
      px(ctx, 16, 8 + bob, 14, 18, '#facc15');
      px(ctx, 17, 11 + bob, 13, 4, '#020617');
      px(ctx, 19, 12 + bob, 4, 2, f4 % 2 ? '#22d3ee' : '#f472b6');
      px(ctx, 25, 12 + bob, 4, 2, f4 % 2 ? '#22d3ee' : '#f472b6');
      px(ctx, 27, 15 + bob, 7, 3, '#f97316');
      break;
    }
    case 'void_eye': {
      px(ctx, 0, 0, W, H, '#05010d');
      px(ctx, 10, 11, 28, 12, '#a855f7');
      px(ctx, 14, 13, 20, 8, '#f0fdfa');
      px(ctx, 20 + Math.round(wave * 3), 13, 8, 8, '#0f172a');
      px(ctx, 23 + Math.round(wave * 3), 15, 2, 4, '#2dd4bf');
      break;
    }
    // ================= 12 NEW ANIMATED VIDEO SCENES =================
    case 'laser_cat': {
      px(ctx, 0, 0, W, H, '#111827');
      px(ctx, 6, 10, 14, 14, '#f8fafc');
      px(ctx, 6, 6, 4, 4, '#f8fafc');
      px(ctx, 16, 6, 4, 4, '#f8fafc');
      px(ctx, 10, 13, 2, 2, '#ef4444');
      px(ctx, 16, 13, 2, 2, '#ef4444');
      // Pew pew laser beams!
      px(ctx, 18, 13, 30, f4 % 2 ? 2 : 3, '#ef4444');
      px(ctx, 18, 14, 30, 1, '#fef08a');
      break;
    }
    case 'car_drift': {
      px(ctx, 0, 0, W, H, '#1e293b');
      px(ctx, 0, 21, W, 13, '#0f172a');
      px(ctx, (48 - f8 * 6) % W, 27, 8, 2, '#facc15');
      const cx = 14 + Math.round(wave * 4);
      px(ctx, cx, 14, 20, 7, '#f43f5e');
      px(ctx, cx + 4, 10, 11, 4, '#38bdf8');
      px(ctx, cx + 2, 20, 4, 4, '#020617');
      px(ctx, cx + 14, 20, 4, 4, '#020617');
      px(ctx, cx - 5 - f4, 20, 4, 3, '#cbd5e1');
      break;
    }
    case 'fireworks': {
      px(ctx, 0, 0, W, H, '#050816');
      const r = 2 + f4 * 3;
      const cx = f8 < 4 ? 16 : 32;
      const cy = f8 < 4 ? 12 : 16;
      const col = f8 < 4 ? '#f43f5e' : '#38bdf8';
      px(ctx, cx - r, cy, 2, 2, col);
      px(ctx, cx + r, cy, 2, 2, col);
      px(ctx, cx, cy - r, 2, 2, '#facc15');
      px(ctx, cx, cy + r, 2, 2, '#4ade80');
      px(ctx, cx - r, cy - r, 2, 2, '#f472b6');
      px(ctx, cx + r, cy + r, 2, 2, '#facc15');
      break;
    }
    case 'dj_turntable': {
      px(ctx, 0, 0, W, H, '#1a0b2e');
      px(ctx, 4, 12, 40, 18, '#334155');
      px(ctx, 8, 15, 12, 12, '#0f172a');
      px(ctx, 28, 15, 12, 12, '#0f172a');
      px(ctx, 13 + (f4 % 2), 20, 2, 2, '#f43f5e');
      px(ctx, 33 - (f4 % 2), 20, 2, 2, '#38bdf8');
      // Equalizer bars
      for (let i = 0; i < 6; i++) {
        const h = 3 + ((tick + i * 2) % 6);
        px(ctx, 12 + i * 4, 10 - h, 3, h, i % 2 ? '#22c55e' : '#facc15');
      }
      break;
    }
    case 'rocket_launch': {
      px(ctx, 0, 0, W, H, '#090d1a');
      const ry = 18 - f8 * 2;
      px(ctx, 21, ry, 6, 12, '#f8fafc');
      px(ctx, 22, ry - 3, 4, 3, '#ef4444');
      px(ctx, 22, ry + 12, 4, 4 + f4, '#f97316');
      px(ctx, 18, 28, 12, 4, '#cbd5e1');
      break;
    }
    case 'slime_squish': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 0, 26, W, 8, '#312e81');
      const squish = f4 >= 2 ? 4 : 0;
      px(ctx, 14 - squish / 2, 12 + squish, 20 + squish, 14 - squish, '#4ade80');
      px(ctx, 19, 17 + squish / 2, 2, 3, '#0f172a');
      px(ctx, 27, 17 + squish / 2, 2, 3, '#0f172a');
      break;
    }
    case 'karaoke_frog': {
      px(ctx, 0, 0, W, H, '#2e1065');
      px(ctx, 14, 10 + bob, 20, 18, '#22c55e');
      px(ctx, 16, 7 + bob, 5, 5, '#4ade80');
      px(ctx, 27, 7 + bob, 5, 5, '#4ade80');
      px(ctx, 18, 8 + bob, 2, 2, '#0f172a');
      px(ctx, 29, 8 + bob, 2, 2, '#0f172a');
      // Singing mouth + mic
      px(ctx, 20, 17 + bob, 8, f4 % 2 ? 5 : 2, '#f43f5e');
      px(ctx, 35, 14, 3, 14, '#94a3b8');
      px(ctx, 34, 11, 5, 4, '#cbd5e1');
      px(ctx, 6, 6 + (f4 % 2) * 2, 3, 3, '#facc15');
      break;
    }
    case 'pixel_aquarium': {
      px(ctx, 0, 0, W, H, '#0c4a6e');
      px(ctx, 0, 28, W, 6, '#ca8a04');
      const fx = (f8 * 5) % 40;
      px(ctx, fx, 14 + bob, 8, 5, '#f97316');
      px(ctx, fx - 2, 15 + bob, 2, 3, '#fb923c');
      px(ctx, 40 - fx, 21 - bob, 6, 4, '#f472b6');
      px(ctx, 14, 24 - f4 * 4, 2, 2, '#e0f2fe');
      break;
    }
    case 'meteor_shower': {
      px(ctx, 0, 0, W, H, '#040914');
      px(ctx, 0, 27, W, 7, '#1e293b');
      const mx = (f8 * 5) % 40;
      px(ctx, mx, 4 + f8 * 2, 5, 5, '#facc15');
      px(ctx, mx - 4, 1 + f8 * 2, 4, 3, '#f97316');
      px(ctx, 38 - mx, 6 + f4 * 2, 4, 4, '#38bdf8');
      break;
    }
    case 'speed_typer': {
      px(ctx, 0, 0, W, H, '#020b04');
      px(ctx, 6, 6, 36, 16, '#052e16');
      px(ctx, 9, 9, 12 + f4 * 4, 2, '#4ade80');
      px(ctx, 9, 13, 8 + ((f4 + 2) % 4) * 5, 2, '#22c55e');
      px(ctx, 9, 17, 16, 2, '#86efac');
      px(ctx, 8, 25, 32, 6, '#334155');
      px(ctx, 12 + f4 * 5, 26, 4, 3, '#facc15');
      break;
    }
    case 'toaster_pop': {
      px(ctx, 0, 0, W, H, '#312e81');
      px(ctx, 0, 26, W, 8, '#7c4a2d');
      px(ctx, 14, 16, 20, 12, '#cbd5e1');
      const ty = f4 === 3 ? 6 : 11;
      px(ctx, 17, ty, 6, 6, '#d97706');
      px(ctx, 25, ty + 1, 6, 6, '#b45309');
      break;
    }
    case 'confetti_cannon': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 8, 22, 10, 6, '#f43f5e');
      for (let i = 0; i < 8; i++) {
        const cx = 18 + ((i * 5 + f4 * 3) % 26);
        const cy = 6 + ((i * 7 + f8 * 2) % 20);
        px(ctx, cx, cy, 3, 2, ['#facc15', '#4ade80', '#38bdf8', '#f472b6'][i % 4]);
      }
      break;
    }
  }
}
