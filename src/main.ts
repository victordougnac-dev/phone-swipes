import './style.css';
import { soundEngine } from './audio/soundEngine';
import { APP_THEMES, RARITY_CONFIG } from './data/gameData';
import { GameEngine } from './engine/gameEngine';
import { RoomRenderer } from './pixel/roomRenderer';
import { HudAndPanels } from './ui/hudAndPanels';
import { PhoneAppsView } from './ui/phoneViews';
import { SwipesView } from './ui/swipesView';

const appRoot = document.getElementById('app');
if (!appRoot) throw new Error('Missing #app element');

appRoot.innerHTML = `
  <div class="game-shell" id="game-shell">
    <canvas class="room-canvas" id="room-canvas"></canvas>
    <div class="bonus-drops-layer" id="bonus-drops-layer"></div>

    <header class="top-hud" id="top-hud"></header>

    <main class="main-stage">
      <aside class="side-panel left-panel" id="side-left"></aside>

      <section class="phone-column">
        <div class="phone-shell tier-0" id="phone-shell">
          <div class="phone-speaker"></div>
          <div class="phone-status-bar" id="phone-status-bar">
            <span id="status-time">02:47</span>
            <span class="status-icons" id="status-icons">📶 5G 🔋100%</span>
          </div>
          <div class="phone-screen" id="phone-screen"></div>
          <nav class="phone-dock" id="phone-dock"></nav>
          <div class="phone-home-bar"></div>
        </div>
      </section>

      <aside class="side-panel right-panel" id="side-right"></aside>
    </main>

    <div class="overlays-layer" id="overlays-layer"></div>
  </div>
`;

const engine = new GameEngine();
const roomCanvas = document.getElementById('room-canvas') as HTMLCanvasElement;
const roomRenderer = new RoomRenderer(roomCanvas);

const topHudEl = document.getElementById('top-hud')!;
const sideLeftEl = document.getElementById('side-left')!;
const sideRightEl = document.getElementById('side-right')!;
const phoneShellEl = document.getElementById('phone-shell')!;
const phoneScreenEl = document.getElementById('phone-screen')!;
const phoneDockEl = document.getElementById('phone-dock')!;
const bonusDropsEl = document.getElementById('bonus-drops-layer')!;
const overlaysEl = document.getElementById('overlays-layer')!;
const statusTimeEl = document.getElementById('status-time')!;
const statusIconsEl = document.getElementById('status-icons')!;

const hud = new HudAndPanels(engine);
const swipesView = new SwipesView(phoneScreenEl, engine);
const phoneAppsView = new PhoneAppsView(phoneScreenEl, engine);

let lastRenderedTab = engine.state.activeTab;

function updatePhoneHardwareStyle(): void {
  const s = engine.state;
  const totalPhoneLvls =
    s.phoneUpgrades.screen +
    s.phoneUpgrades.processor +
    s.phoneUpgrades.battery +
    s.phoneUpgrades.display +
    s.phoneUpgrades.algorithm;

  let tier = 0;
  if (s.rebirthCount > 0 || totalPhoneLvls >= 35) tier = 4;
  else if (totalPhoneLvls >= 20) tier = 3;
  else if (totalPhoneLvls >= 10) tier = 2;
  else if (totalPhoneLvls >= 4) tier = 1;

  const theme = APP_THEMES[s.activeTheme] || APP_THEMES.classic;
  phoneShellEl.className = `phone-shell tier-${tier}${engine.isFeverActive() ? ' fever-glow' : ''}`;
  phoneShellEl.style.setProperty('--phone-glow', theme.primary);

  const mins = Math.floor(s.playTimeSeconds / 60) % 60;
  const hrs = (2 + Math.floor(s.playTimeSeconds / 3600)) % 24;
  statusTimeEl.textContent = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  const wifiLvl = s.techUpgrades.better_wifi;
  const netTag = wifiLvl >= 5 ? '6G' : wifiLvl >= 2 ? '5G+' : '5G';
  const battPct = Math.min(100, 72 + s.phoneUpgrades.battery * 4);
  statusIconsEl.textContent = `📶 ${netTag} 🔋${battPct}%`;
}

function renderAllUI(): void {
  updatePhoneHardwareStyle();
  hud.renderTopHud(topHudEl);
  hud.renderSideLeft(sideLeftEl);
  hud.renderSideRight(sideRightEl);
  hud.renderPhoneDock(phoneDockEl);
  hud.renderBonusDropButtons(bonusDropsEl);
  hud.renderOverlays(overlaysEl);

  if (engine.state.activeTab !== lastRenderedTab) {
    lastRenderedTab = engine.state.activeTab;
    phoneScreenEl.innerHTML = '';
  }

  if (engine.state.activeTab === 'swipes') {
    swipesView.render();
  } else {
    phoneAppsView.render();
  }
}

// React to engine events (throttled cleanly for DOM efficiency)
let dirtyUi = true;
engine.subscribe(() => {
  dirtyUi = true;
});

engine.onSwipe((res) => {
  const rar = RARITY_CONFIG[res.post.rarity];
  if (engine.state.settings.particles) {
    roomRenderer.spawnBurst(0.5, 0.5, rar.color, rar.particles);
  }
  if (
    !res.isAuto &&
    engine.state.settings.screenShake &&
    (res.post.rarity === 'epic' || res.post.rarity === 'legendary')
  ) {
    phoneShellEl.classList.remove('shake');
    void phoneShellEl.offsetWidth;
    phoneShellEl.classList.add('shake');
  }
});

// Keyboard controls (Space / ArrowUp / ArrowDown / W / S)
window.addEventListener('keydown', (e) => {
  const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS') {
    if (engine.state.activeTab === 'swipes' && !engine.state.paused) {
      e.preventDefault();
      soundEngine.unlock();
      swipesView.triggerSwipe();
    }
  } else if (e.code === 'KeyP') {
    engine.togglePause();
  } else if (e.code === 'KeyM') {
    engine.toggleMute();
  }
});

window.addEventListener('pointerdown', () => {
  soundEngine.unlock();
}, { passive: true });

window.addEventListener('beforeunload', () => {
  engine.saveState();
});

renderAllUI();

let lastTime = performance.now();
let uiSyncTimer = 0;
let artAnimTimer = 0;

function loop(now: number): void {
  try {
    const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    engine.tick(dt);
    hud.updateSmoothCounter(dt);

    roomRenderer.render(dt, engine.state, engine.bonusDrops, engine.isFeverActive());

    artAnimTimer += dt;
    if (artAnimTimer >= 0.22) {
      artAnimTimer = 0;
      swipesView.tickArt();
    }

    uiSyncTimer += dt;
    if (dirtyUi || uiSyncTimer >= 0.25) {
      if (dirtyUi) {
        dirtyUi = false;
        renderAllUI();
      } else {
        hud.renderBonusDropButtons(bonusDropsEl);
        if (engine.state.activeTab === 'swipes') {
          swipesView.render();
        }
        if (engine.surgeTimer > 0) {
          hud.renderTopHud(topHudEl);
        }
      }
      uiSyncTimer = 0;
    }
  } catch (err) {
    console.error('Game loop error:', err);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
