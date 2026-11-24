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

  const bob = Math.round(Math.sin(tick * 0.12));

  switch (scene) {
    case 'cat_mug': {
      px(ctx, 0, 0, W, H, '#1e293b');
      px(ctx, 0, 24, W, 10, '#7c4a2d');
      px(ctx, 0, 24, W, 1, '#a46b46');
      // Cat body
      px(ctx, 11, 10, 12, 14, '#f97316');
      px(ctx, 11, 6, 3, 4, '#f97316');
      px(ctx, 20, 6, 3, 4, '#f97316');
      px(ctx, 13, 13, 2, 2, '#0f172a');
      px(ctx, 19, 13, 2, 2, '#0f172a');
      px(ctx, 16, 15, 2, 1, '#fda4af');
      // Paw nudging mug
      px(ctx, 23, 18, 5, 3, '#fb923c');
      // Mug tilting off edge
      px(ctx, 30, 17 + Math.abs(bob), 8, 9, '#f8fafc');
      px(ctx, 31, 18 + Math.abs(bob), 6, 2, '#6f4e37');
      px(ctx, 38, 19 + Math.abs(bob), 2, 5, '#e2e8f0');
      break;
    }
    case 'coffee_3am': {
      px(ctx, 0, 0, W, H, '#0f172a');
      px(ctx, 5, 4, 2, 2, '#facc15');
      px(ctx, 38, 6, 2, 2, '#38bdf8');
      px(ctx, 0, 25, W, 9, '#334155');
      // Iced coffee cup
      px(ctx, 18, 10, 12, 15, '#cbd5e1');
      px(ctx, 19, 12, 10, 12, '#78350f');
      px(ctx, 20, 13, 4, 4, '#e0f2fe');
      px(ctx, 25, 14, 3, 3, '#bae6fd');
      // Straw
      px(ctx, 24, 4, 2, 8, '#22c55e');
      // Battery 1% icon
      px(ctx, 34, 14, 9, 5, '#e2e8f0');
      px(ctx, 35, 15, 2, 3, '#ef4444');
      break;
    }
    case 'cereal_hot_take': {
      px(ctx, 0, 0, W, H, '#312e81');
      px(ctx, 0, 25, W, 9, '#4c1d95');
      // Bowl
      px(ctx, 12, 16, 24, 10, '#f8fafc');
      px(ctx, 14, 26, 20, 2, '#cbd5e1');
      px(ctx, 14, 15, 20, 3, '#e0f2fe');
      // Cereal bits
      px(ctx, 16, 14, 3, 2, '#fbbf24');
      px(ctx, 21, 13, 3, 2, '#f97316');
      px(ctx, 26, 14, 3, 2, '#f472b6');
      px(ctx, 30, 15, 2, 2, '#4ade80');
      // Spoon
      px(ctx, 28, 7, 2, 9, '#94a3b8');
      break;
    }
    case 'fridge_check': {
      px(ctx, 0, 0, W, H, '#090d16');
      // Open fridge glow
      px(ctx, 13, 3, 22, 29, '#e2e8f0');
      px(ctx, 15, 5, 18, 25, '#bae6fd');
      px(ctx, 15, 13, 18, 2, '#64748b');
      px(ctx, 15, 21, 18, 2, '#64748b');
      // One sad pickle jar & milk
      px(ctx, 17, 8, 4, 5, '#f8fafc');
      px(ctx, 25, 9, 4, 4, '#22c55e');
      px(ctx, 20, 16, 5, 5, '#fbbf24');
      // Open door
      px(ctx, 35, 3, 6, 29, '#cbd5e1');
      break;
    }
    case 'sleep_schedule': {
      px(ctx, 0, 0, W, H, '#17153b');
      // Bed + phone glow on face
      px(ctx, 4, 22, 40, 12, '#2e236c');
      px(ctx, 6, 18, 10, 6, '#e2e8f0');
      px(ctx, 10, 15, 7, 7, '#fcd34d');
      px(ctx, 12, 17, 2, 2, '#0f172a');
      // Glowing phone
      px(ctx, 22, 13, 4, 7, '#38bdf8');
      px(ctx, 23, 14, 2, 5, '#e0f2fe');
      // Clock 2:47
      px(ctx, 32, 6, 12, 6, '#0f172a');
      px(ctx, 34, 8, 8, 2, '#ef4444');
      break;
    }
    case 'doge_stare': {
      px(ctx, 0, 0, W, H, '#78350f');
      px(ctx, 10, 6, 28, 28, '#f59e0b');
      px(ctx, 10, 3, 5, 6, '#d97706');
      px(ctx, 33, 3, 5, 6, '#d97706');
      // Cheeks
      px(ctx, 14, 18, 20, 12, '#fef3c7');
      // Eyes
      px(ctx, 17, 13, 3, 3, '#0f172a');
      px(ctx, 28, 13, 3, 3, '#0f172a');
      px(ctx, 18, 13, 1, 1, '#ffffff');
      px(ctx, 29, 13, 1, 1, '#ffffff');
      // Nose
      px(ctx, 22, 18, 4, 3, '#1e293b');
      px(ctx, 20, 22, 8, 2, '#fb7185');
      break;
    }
    case 'pancake_flip': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 0, 26, W, 8, '#334155');
      // Pan
      px(ctx, 14, 22, 16, 4, '#64748b');
      px(ctx, 30, 23, 10, 2, '#94a3b8');
      // Flying pancake stack
      px(ctx, 17, 8 + bob * 2, 10, 3, '#f59e0b');
      px(ctx, 18, 12 + bob * 2, 10, 3, '#d97706');
      px(ctx, 21, 6 + bob * 2, 3, 2, '#fef08a');
      break;
    }
    case 'power_wash': {
      px(ctx, 0, 0, W, H, '#78350f');
      // Clean half vs muddy half
      px(ctx, 0, 0, 25, H, '#cbd5e1');
      px(ctx, 0, 10, 25, 1, '#94a3b8');
      px(ctx, 0, 22, 25, 1, '#94a3b8');
      // Water jet
      px(ctx, 25, 15, 14, 4, '#38bdf8');
      px(ctx, 24, 13, 4, 8, '#e0f2fe');
      px(ctx, 39, 14, 6, 6, '#475569');
      break;
    }
    case 'pixel_ramen': {
      px(ctx, 0, 0, W, H, '#3f1d2b');
      // Steam
      px(ctx, 16, 4 + bob, 2, 5, '#f8fafc');
      px(ctx, 23, 3 - bob, 2, 6, '#f8fafc');
      px(ctx, 30, 5 + bob, 2, 4, '#f8fafc');
      // Bowl
      px(ctx, 11, 17, 26, 12, '#ef4444');
      px(ctx, 13, 15, 22, 4, '#fde68a');
      px(ctx, 16, 13, 5, 4, '#ffffff');
      px(ctx, 17, 14, 3, 2, '#f97316');
      px(ctx, 25, 14, 6, 3, '#a16207');
      px(ctx, 20, 8, 16, 2, '#d97706');
      break;
    }
    case 'crab_rave': {
      px(ctx, 0, 0, W, H, '#0284c7');
      px(ctx, 0, 22, W, 12, '#fde047');
      // Pixel crab
      const cx = 18 + bob * 2;
      px(ctx, cx, 16, 12, 8, '#ef4444');
      px(ctx, cx - 3, 12, 3, 5, '#f87171');
      px(ctx, cx + 12, 12, 3, 5, '#f87171');
      px(ctx, cx + 3, 18, 2, 2, '#0f172a');
      px(ctx, cx + 7, 18, 2, 2, '#0f172a');
      px(ctx, cx + 1, 24, 2, 3, '#dc2626');
      px(ctx, cx + 9, 24, 2, 3, '#dc2626');
      break;
    }
    case 'speedrun_trophy': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      px(ctx, 18, 7, 12, 11, '#facc15');
      px(ctx, 15, 9, 3, 6, '#eab308');
      px(ctx, 30, 9, 3, 6, '#eab308');
      px(ctx, 22, 18, 4, 5, '#eab308');
      px(ctx, 17, 23, 14, 4, '#a16207');
      px(ctx, 8, 5, 2, 2, '#fef08a');
      px(ctx, 38, 12, 2, 2, '#38bdf8');
      break;
    }
    case 'arcade_cab': {
      px(ctx, 0, 0, W, H, '#0f0720');
      px(ctx, 14, 4, 20, 27, '#4f46e5');
      px(ctx, 16, 6, 16, 4, '#ec4899');
      px(ctx, 17, 11, 14, 9, '#0f172a');
      px(ctx, 19, 13, 4, 3, '#22c55e');
      px(ctx, 26, 15, 3, 3, '#facc15');
      px(ctx, 15, 21, 18, 3, '#1e1b4b');
      px(ctx, 18, 20, 2, 2, '#ef4444');
      break;
    }
    case 'ufo_cow': {
      px(ctx, 0, 0, W, H, '#090d1a');
      px(ctx, 0, 26, W, 8, '#14532d');
      // Beam
      px(ctx, 18, 12, 12, 15, 'rgba(74,222,128,0.45)');
      // UFO
      px(ctx, 19, 5, 10, 4, '#38bdf8');
      px(ctx, 14, 8, 20, 4, '#94a3b8');
      px(ctx, 17, 10, 2, 2, '#facc15');
      px(ctx, 23, 10, 2, 2, '#f472b6');
      px(ctx, 29, 10, 2, 2, '#4ade80');
      // Tiny cow floating
      px(ctx, 20, 19 + bob, 8, 5, '#f8fafc');
      px(ctx, 22, 20 + bob, 3, 2, '#0f172a');
      break;
    }
    case 'tin_foil': {
      px(ctx, 0, 0, W, H, '#111827');
      // Tin foil hat
      px(ctx, 16, 5, 16, 12, '#cbd5e1');
      px(ctx, 21, 2, 6, 4, '#e2e8f0');
      px(ctx, 18, 17, 12, 10, '#fcd34d');
      px(ctx, 20, 20, 3, 2, '#0f172a');
      px(ctx, 26, 20, 3, 2, '#0f172a');
      break;
    }
    case 'glitch_skull': {
      px(ctx, 0, 0, W, H, '#180529');
      px(ctx, 15 + bob, 7, 18, 14, '#f43f5e');
      px(ctx, 16, 7, 16, 14, '#e2e8f0');
      px(ctx, 18, 11, 4, 4, '#0f172a');
      px(ctx, 26, 11, 4, 4, '#0f172a');
      px(ctx, 19, 21, 10, 5, '#cbd5e1');
      px(ctx, 6, 10, 8, 2, '#22d3ee');
      px(ctx, 35, 18, 9, 2, '#a855f7');
      break;
    }
    case 'golden_meme': {
      px(ctx, 0, 0, W, H, '#422006');
      px(ctx, 8, 4, 32, 26, '#facc15');
      px(ctx, 10, 6, 28, 22, '#fef08a');
      // Crown
      px(ctx, 15, 10, 18, 12, '#ca8a04');
      px(ctx, 15, 8, 3, 3, '#f59e0b');
      px(ctx, 22, 7, 4, 4, '#f59e0b');
      px(ctx, 30, 8, 3, 3, '#f59e0b');
      px(ctx, 22, 15, 4, 4, '#38bdf8');
      break;
    }
    case 'synth_city': {
      px(ctx, 0, 0, W, H, '#2e1065');
      // Sun
      px(ctx, 16, 5, 16, 14, '#f43f5e');
      px(ctx, 16, 12, 16, 2, '#facc15');
      px(ctx, 16, 15, 16, 2, '#2e1065');
      // Skyline
      px(ctx, 0, 20, W, 14, '#090d1a');
      px(ctx, 4, 14, 6, 12, '#1e1b4b');
      px(ctx, 12, 11, 7, 15, '#312e81');
      px(ctx, 28, 12, 8, 14, '#1e1b4b');
      px(ctx, 38, 15, 7, 11, '#312e81');
      px(ctx, 0, 27, W, 1, '#06b6d4');
      break;
    }
    case 'quantum_orb': {
      px(ctx, 0, 0, W, H, '#040914');
      px(ctx, 14, 7, 20, 20, '#0891b2');
      px(ctx, 17, 10, 14, 14, '#2dd4bf');
      px(ctx, 20, 13, 8, 8, '#f0fdfa');
      px(ctx, 10 + bob * 3, 15, 4, 4, '#f472b6');
      px(ctx, 34 - bob * 3, 15, 4, 4, '#facc15');
      break;
    }
    case 'dev_cat': {
      px(ctx, 0, 0, W, H, '#1e1b4b');
      // Keyboard
      px(ctx, 6, 22, 36, 8, '#334155');
      px(ctx, 8, 24, 32, 4, '#64748b');
      // Tuxedo cat
      px(ctx, 16, 9, 16, 14, '#0f172a');
      px(ctx, 16, 6, 4, 4, '#0f172a');
      px(ctx, 28, 6, 4, 4, '#0f172a');
      px(ctx, 19, 11, 3, 3, '#4ade80');
      px(ctx, 26, 11, 3, 3, '#4ade80');
      px(ctx, 21, 17, 6, 6, '#f8fafc');
      break;
    }
    case 'pizza_slice': {
      px(ctx, 0, 0, W, H, '#2b1322');
      px(ctx, 12, 8, 24, 5, '#d97706');
      px(ctx, 14, 13, 20, 5, '#facc15');
      px(ctx, 17, 18, 14, 5, '#facc15');
      px(ctx, 21, 23, 6, 5, '#facc15');
      px(ctx, 18, 14, 4, 3, '#ef4444');
      px(ctx, 26, 15, 4, 3, '#ef4444');
      px(ctx, 22, 20, 4, 3, '#ef4444');
      break;
    }
    case 'capybara_chill': {
      px(ctx, 0, 0, W, H, '#0c4a6e');
      px(ctx, 0, 21, W, 13, '#38bdf8');
      px(ctx, 13, 11, 22, 13, '#a16207');
      px(ctx, 16, 14, 3, 2, '#0f172a');
      px(ctx, 13, 17, 3, 3, '#78350f');
      // Orange on head!
      px(ctx, 22, 6, 6, 5, '#f97316');
      px(ctx, 24, 5, 2, 1, '#22c55e');
      break;
    }
    case 'neon_dragon': {
      px(ctx, 0, 0, W, H, '#120524');
      px(ctx, 14, 8, 18, 16, '#ec4899');
      px(ctx, 12, 5, 4, 5, '#00f5d4');
      px(ctx, 28, 5, 4, 5, '#00f5d4');
      px(ctx, 18, 13, 4, 3, '#facc15');
      px(ctx, 26, 13, 4, 3, '#facc15');
      px(ctx, 16, 20, 14, 4, '#8338ec');
      break;
    }
    case 'cyber_duck': {
      px(ctx, 0, 0, W, H, '#0f172a');
      px(ctx, 16, 8, 14, 18, '#facc15');
      // Sunglasses
      px(ctx, 17, 11, 13, 4, '#020617');
      px(ctx, 19, 12, 4, 2, '#22d3ee');
      px(ctx, 25, 12, 4, 2, '#22d3ee');
      // Beak
      px(ctx, 27, 15, 7, 3, '#f97316');
      break;
    }
    case 'void_eye': {
      px(ctx, 0, 0, W, H, '#05010d');
      px(ctx, 10, 11, 28, 12, '#a855f7');
      px(ctx, 14, 13, 20, 8, '#f0fdfa');
      px(ctx, 20, 13, 8, 8, '#0f172a');
      px(ctx, 23, 15, 2, 4, '#2dd4bf');
      break;
    }
  }
}
