import {
  AUTOMATION_UPGRADES,
  FARM_PHONES,
  PHONE_UPGRADES,
} from '../data/gameData';
import type { GameEngine } from '../engine/gameEngine';
import type { AppTab, AutomationId, FarmPhoneId, PhoneUpgradeId } from '../types/game';
import { formatNumber, formatTime } from '../utils/format';

export class HudAndPanels {
  private engine: GameEngine;
  private displayedDp = 0;
  private helpOpen = false;
  private offlineDismissed = false;

  private topHudSig = '';
  private sideLeftSig = '';
  private sideRightSig = '';
  private dockSig = '';
  private dropsSig = '';
  private overlaysSig = '';

  constructor(engine: GameEngine) {
    this.engine = engine;
    this.displayedDp = engine.state.dp;
  }

  public updateSmoothCounter(dt: number): void {
    const target = this.engine.state.dp;
    const diff = target - this.displayedDp;
    if (Math.abs(diff) < 1) {
      this.displayedDp = target;
    } else {
      this.displayedDp += diff * Math.min(1, dt * 14);
    }
    const dpEl = document.getElementById('hud-dp-val');
    if (dpEl) dpEl.textContent = formatNumber(Math.round(this.displayedDp));
  }

  public renderTopHud(container: HTMLElement): void {
    const s = this.engine.state;
    const idleDps = this.engine.getTotalIdleDps();
    const swipeDp = this.engine.getSwipeBaseDp();
    const rebirthPct = Math.min(100, Math.round((s.runDp / this.engine.REBIRTH_THRESHOLD) * 100));
    const pendingShards = this.engine.getPendingCloutShards();
    const surgeActive = this.engine.surgeTimer > 0;
    const surgeSec = Math.ceil(this.engine.surgeTimer);

    const sig = `${s.rebirthCount}|${formatNumber(swipeDp)}|${formatNumber(idleDps)}|${s.cloutShards}|${rebirthPct}|${pendingShards}|${surgeActive ? surgeSec : 0}|${s.paused}|${s.settings.muted}|${s.settings.musicEnabled}`;
    if (sig === this.topHudSig) return;
    this.topHudSig = sig;

    container.innerHTML = `
      <div class="hud-left">
        <div class="hud-logo">
          <span class="logo-px">📱</span>
          <div>
            <div class="logo-title">PHONE SWIPES</div>
            <div class="logo-sub">${s.rebirthCount > 0 ? `REBIRTH #${s.rebirthCount}` : 'IDLE CLICKER'}</div>
          </div>
        </div>
      </div>

      <div class="hud-center">
        <div class="dp-counter-card">
          <div class="dp-main-row">
            <span class="dp-orb">⚡</span>
            <span class="dp-value" id="hud-dp-val">${formatNumber(Math.round(this.displayedDp))}</span>
            <span class="dp-unit">DP</span>
          </div>
          <div class="dp-rates-row">
            <span>👆 ${formatNumber(swipeDp)}/swipe</span>
            <span>•</span>
            <span>⏱️ ${formatNumber(idleDps)}/sec</span>
            ${s.cloutShards > 0 || s.rebirthCount > 0 ? `<span>• 💎 ${s.cloutShards}</span>` : ''}
          </div>
        </div>

        <button class="rebirth-pill-btn ${pendingShards > 0 ? 'ready' : ''}" id="hud-rebirth-btn" title="Open Digital Rebirth">
          <div class="rebirth-pill-top">
            <span>🔮 REBIRTH</span>
            <span>${pendingShards > 0 ? `+${pendingShards} 💎 READY` : `${rebirthPct}%`}</span>
          </div>
          <div class="rebirth-pill-track"><div class="rebirth-pill-fill" style="width:${rebirthPct}%"></div></div>
        </button>

        ${
          surgeActive
            ? `<div class="surge-pill">🔥 ${this.engine.surgeMultiplier.toFixed(1)}x SURGE (${surgeSec}s)</div>`
            : ''
        }
      </div>

      <div class="hud-right">
        <button class="hud-icon-btn ${s.paused ? 'active' : ''}" id="btn-pause" title="Pause / Resume">${s.paused ? '▶' : '⏸'}</button>
        <button class="hud-icon-btn ${s.settings.muted ? 'muted' : ''}" id="btn-mute" title="Toggle Sound">${s.settings.muted ? '🔇' : '🔊'}</button>
        <button class="hud-icon-btn ${s.settings.musicEnabled ? 'active' : ''}" id="btn-music" title="Toggle Chiptune Music">🎵</button>
        <button class="hud-icon-btn" id="btn-help" title="How to Play">?</button>
      </div>
    `;

    container.querySelector('#hud-rebirth-btn')?.addEventListener('click', () => this.engine.setTab('rebirth'));
    container.querySelector('#btn-pause')?.addEventListener('click', () => this.engine.togglePause());
    container.querySelector('#btn-mute')?.addEventListener('click', () => this.engine.toggleMute());
    container.querySelector('#btn-music')?.addEventListener('click', () => this.engine.toggleMusic());
    container.querySelector('#btn-help')?.addEventListener('click', () => {
      this.helpOpen = !this.helpOpen;
      this.engine.emit();
    });
  }

  public renderSideLeft(container: HTMLElement): void {
    const s = this.engine.state;
    const html = `
      <div class="panel-box">
        <div class="panel-header">
          <span>📱 PHONE UPGRADES</span>
          <button class="panel-more-btn" data-go-shop="phone">All →</button>
        </div>
        <div class="panel-list">
          ${PHONE_UPGRADES.map((u) => {
            const lvl = s.phoneUpgrades[u.id] || 0;
            const cost = this.engine.getPhoneUpgradeCost(u.id);
            const can = s.dp >= cost;
            return `
              <button class="quick-card ${can ? 'can-afford' : ''}" data-side-phone="${u.id}" ${!can ? 'disabled' : ''}>
                <div class="qc-left">
                  <div class="qc-title">${u.icon} ${u.name} <span>Lv.${lvl}</span></div>
                  <div class="qc-sub">${u.effectText(lvl)}</div>
                </div>
                <div class="qc-cost">${formatNumber(cost)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="panel-box">
        <div class="panel-header">
          <span>🎯 DAILY CHALLENGES</span>
          <button class="panel-more-btn" id="side-go-awards">Awards →</button>
        </div>
        <div class="panel-list">
          ${s.dailyChallenges
            .map((ch) => {
              const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
              const ready = !ch.claimed && ch.progress >= ch.target;
              return `
                <div class="side-ch ${ch.claimed ? 'claimed' : ''}">
                  <div class="side-ch-row">
                    <span>${ch.title}</span>
                    <strong>${ch.progress}/${ch.target}</strong>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                  ${
                    ready
                      ? `<button class="claim-mini-btn" data-side-claim="${ch.id}">CLAIM +${formatNumber(ch.rewardDp)} DP</button>`
                      : ''
                  }
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
    if (html === this.sideLeftSig) return;
    this.sideLeftSig = html;
    container.innerHTML = html;

    container.querySelectorAll('[data-side-phone]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyPhoneUpgrade((el as HTMLElement).dataset.sidePhone as PhoneUpgradeId)
      )
    );
    container.querySelectorAll('[data-side-claim]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.claimDailyChallenge((el as HTMLElement).dataset.sideClaim!)
      )
    );
    container.querySelector('[data-go-shop]')?.addEventListener('click', () => {
      this.engine.setShopSection('phone');
      this.engine.setTab('shop');
    });
    container.querySelector('#side-go-awards')?.addEventListener('click', () => this.engine.setTab('awards'));
  }

  public renderSideRight(container: HTMLElement): void {
    const s = this.engine.state;
    const totalPhones = Object.values(s.farmPhones).reduce((a, b) => a + b, 0);
    const farmDps = this.engine.getTotalFarmDps();

    const html = `
      <div class="panel-box">
        <div class="panel-header">
          <span>📲 PHONE FARM (${totalPhones})</span>
          <span class="panel-stat">${formatNumber(farmDps)}/s</span>
        </div>
        <div class="bulk-bar compact">
          ${(['1', '10', 'max'] as const)
            .map(
              (amt) =>
                `<button class="bulk-pill ${String(s.buyAmount) === amt ? 'active' : ''}" data-side-bulk="${amt}">${amt === 'max' ? 'MAX' : amt + 'x'}</button>`
            )
            .join('')}
        </div>
        <div class="panel-list">
          ${FARM_PHONES.map((p) => {
            const owned = s.farmPhones[p.id] || 0;
            const unlocked = s.lifetimeDp >= p.unlockDp || owned > 0;
            if (!unlocked) {
              return `<div class="quick-card locked"><div class="qc-title">🔒 ${p.name}</div><div class="qc-cost">${formatNumber(p.unlockDp)}</div></div>`;
            }
            const maxInfo = this.engine.getMaxAffordableFarmPhone(p.id);
            const qty = s.buyAmount === 'max' ? Math.max(1, maxInfo.qty) : s.buyAmount;
            const cost = this.engine.getFarmPhoneBulkCost(p.id, qty);
            const can = s.dp >= cost;
            return `
              <button class="quick-card ${can ? 'can-afford' : ''}" data-side-farm="${p.id}" ${!can ? 'disabled' : ''}>
                <div class="qc-left">
                  <div class="qc-title">
                    <span class="mini-phone-dot" style="background:${p.screenColor};border-color:${p.bodyColor}"></span>
                    ${p.name} <span>x${owned}</span>
                  </div>
                  <div class="qc-sub">+${formatNumber(this.engine.getFarmPhoneUnitDps(p.id))}/s ea</div>
                </div>
                <div class="qc-cost">+${qty}<br/>${formatNumber(cost)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="panel-box">
        <div class="panel-header">
          <span>🤖 AUTOMATION</span>
          <button class="panel-more-btn" id="side-go-tech">More →</button>
        </div>
        <div class="panel-list">
          ${AUTOMATION_UPGRADES.slice(0, 4).map((a) => {
            const lvl = s.automation[a.id] || 0;
            const maxed = lvl >= a.maxLevel;
            const unlocked = s.lifetimeDp >= a.unlockDp || lvl > 0;
            if (!unlocked) {
              return `<div class="quick-card locked"><div class="qc-title">🔒 ${a.name}</div><div class="qc-cost">${formatNumber(a.unlockDp)}</div></div>`;
            }
            const cost = this.engine.getAutomationCost(a.id);
            const can = !maxed && s.dp >= cost;
            return `
              <button class="quick-card ${can ? 'can-afford' : ''}" data-side-auto="${a.id}" ${!can || maxed ? 'disabled' : ''}>
                <div class="qc-left">
                  <div class="qc-title">${a.icon} ${a.name} <span>${lvl}/${a.maxLevel}</span></div>
                  <div class="qc-sub">${a.description.slice(0, 42)}...</div>
                </div>
                <div class="qc-cost">${maxed ? 'MAX' : formatNumber(cost)}</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
    if (html === this.sideRightSig) return;
    this.sideRightSig = html;
    container.innerHTML = html;

    container.querySelectorAll('[data-side-bulk]').forEach((el) =>
      el.addEventListener('click', () => {
        const val = (el as HTMLElement).dataset.sideBulk;
        this.engine.setBuyAmount(val === 'max' ? 'max' : (Number(val) as 1 | 10));
      })
    );
    container.querySelectorAll('[data-side-farm]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyFarmPhone((el as HTMLElement).dataset.sideFarm as FarmPhoneId)
      )
    );
    container.querySelectorAll('[data-side-auto]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyAutomation((el as HTMLElement).dataset.sideAuto as AutomationId)
      )
    );
    container.querySelector('#side-go-tech')?.addEventListener('click', () => {
      this.engine.setShopSection('tech');
      this.engine.setTab('shop');
    });
  }

  public renderPhoneDock(container: HTMLElement): void {
    const tab = this.engine.state.activeTab;
    const unread = this.engine.getUnreadMessagesCount();
    const claimableDaily = this.engine.state.dailyChallenges.filter(
      (c) => !c.claimed && c.progress >= c.target
    ).length;
    const rebirthReady = this.engine.canRebirth();

    const items: { id: AppTab; icon: string; label: string; badge?: number | string }[] = [
      { id: 'swipes', icon: '📱', label: 'Swipes' },
      { id: 'shop', icon: '🛒', label: 'Shop' },
      { id: 'messages', icon: '💬', label: 'Msgs', badge: unread > 0 ? unread : undefined },
      { id: 'awards', icon: '🏆', label: 'Awards', badge: claimableDaily > 0 ? claimableDaily : undefined },
      { id: 'rebirth', icon: '🔮', label: 'Rebirth', badge: rebirthReady ? '!' : undefined },
      { id: 'stats', icon: '📊', label: 'Stats' },
      { id: 'settings', icon: '⚙️', label: 'Opts' },
    ];

    const html = items
      .map(
        (it) => `
        <button class="dock-btn ${tab === it.id ? 'active' : ''}" data-dock-tab="${it.id}">
          <span class="dock-icon">${it.icon}</span>
          <span class="dock-label">${it.label}</span>
          ${it.badge !== undefined ? `<span class="dock-badge">${it.badge}</span>` : ''}
        </button>`
      )
      .join('');
    if (html !== this.dockSig) {
      this.dockSig = html;
      container.innerHTML = html;
      container.querySelectorAll('[data-dock-tab]').forEach((btn) =>
        btn.addEventListener('click', () =>
          this.engine.setTab((btn as HTMLElement).dataset.dockTab as AppTab)
        )
      );
    }
  }

  public renderBonusDropButtons(layer: HTMLElement): void {
    const drops = this.engine.bonusDrops;
    const html = drops
      .map(
        (d) => `
        <button class="bonus-drop-btn" data-drop-id="${d.id}" style="left:${(d.x * 100).toFixed(1)}%;top:${(d.y * 100).toFixed(1)}%;border-color:${d.color};color:${d.color};">
          ${d.label}
        </button>`
      )
      .join('');
    if (html === this.dropsSig) return;
    this.dropsSig = html;
    layer.innerHTML = html;

    layer.querySelectorAll('[data-drop-id]').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number((btn as HTMLElement).dataset.dropId);
        this.engine.catchBonusDrop(id, false);
      })
    );
  }

  public renderOverlays(layer: HTMLElement): void {
    const toastsHtml = `
      <div class="toast-stack">
        ${this.engine.toasts
          .map(
            (t) => `
          <div class="toast-card" style="border-color:${t.color}">
            <div class="toast-icon">${t.icon}</div>
            <div>
              <div class="toast-title" style="color:${t.color}">${t.title}</div>
              <div class="toast-body">${t.body}</div>
            </div>
          </div>`
          )
          .join('')}
      </div>
    `;

    let modalHtml = '';
    if (this.engine.state.paused) {
      modalHtml = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2>⏸ GAME PAUSED</h2>
            <p>Your phone empire is waiting.</p>
            <button class="modal-primary-btn" id="btn-resume-game">▶ RESUME SWIPING</button>
          </div>
        </div>
      `;
    } else if (this.engine.offlineEarnedDp > 0 && !this.offlineDismissed) {
      modalHtml = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2>🌙 WELCOME BACK!</h2>
            <p>While you were away for <strong>${formatTime(this.engine.offlineSeconds)}</strong>, your phone farm earned:</p>
            <div class="offline-dp-big">+${formatNumber(this.engine.offlineEarnedDp)} DP</div>
            <button class="modal-primary-btn" id="btn-claim-offline">⚡ COLLECT!</button>
          </div>
        </div>
      `;
    } else if (this.helpOpen) {
      modalHtml = `
        <div class="modal-backdrop">
          <div class="modal-card help-modal">
            <h2>📱 HOW TO PLAY</h2>
            <ul>
              <li><strong>Swipe / Click / Space:</strong> Scroll posts on Phone Swipes to earn Dopamine Points (DP) and build Combo streaks!</li>
              <li><strong>Rarities:</strong> Upgrade <em>AI Algorithm</em> to discover Rare, Epic & Legendary posts worth massive multipliers.</li>
              <li><strong>Phone Farm:</strong> Buy extra phones in the Shop—watch them appear live across your bedroom!</li>
              <li><strong>Floating Drops:</strong> Click glowing Golden Likes & Mystery Boxes drifting in your room for surges!</li>
              <li><strong>Digital Rebirth:</strong> Reach 100K Run DP to ascend for permanent 💎 Clout Shards!</li>
            </ul>
            <button class="modal-primary-btn" id="btn-close-help">GOT IT!</button>
          </div>
        </div>
      `;
    }

    const html = toastsHtml + modalHtml;
    if (html === this.overlaysSig) return;
    this.overlaysSig = html;
    layer.innerHTML = html;

    layer.querySelector('#btn-resume-game')?.addEventListener('click', () => this.engine.togglePause());
    layer.querySelector('#btn-claim-offline')?.addEventListener('click', () => {
      this.offlineDismissed = true;
      this.engine.emit();
    });
    layer.querySelector('#btn-close-help')?.addEventListener('click', () => {
      this.helpOpen = false;
      this.engine.emit();
    });
  }

  private bottomBarSig = '';

  public renderBottomBar(container: HTMLElement): void {
    const s = this.engine.state;
    const rank = this.engine.getViralityRank();
    const followers = this.engine.getFollowers();
    const phones = Object.values(s.farmPhones).reduce((a, b) => a + b, 0);
    const decor = Object.values(s.decor).filter(Boolean).length;
    const goal = this.engine.getNextGoalHint();
    const autoRate = this.engine.getAutoScrollRatePerSec();

    const html = `
      <div class="bb-group">
        <span class="bb-rank" style="color:${rank.color};border-color:${rank.color}">${rank.label}</span>
        <span>👥 ${formatNumber(followers)} followers</span>
        <span>👆 ${s.totalSwipes.toLocaleString()} swipes</span>
      </div>
      <div class="bb-group">
        <span>📱 ${phones} Farm Phones</span>
        <span>🤖 Auto ${autoRate.toFixed(1)}/s</span>
        <span>🛋️ ${decor}/10 Decor</span>
        <span>✨ x${this.engine.getGlobalMultiplier().toFixed(2)} Mult</span>
      </div>
      <div class="bb-group">
        <button class="bb-goal-btn ${goal.ready ? 'ready' : ''}" id="bb-goal-btn">
          ${goal.ready ? `✨ BUY ${goal.label} (${formatNumber(goal.cost)})` : `🎯 ${goal.label} (${goal.pct}%)`}
        </button>
      </div>
    `;
    if (html === this.bottomBarSig) return;
    this.bottomBarSig = html;
    container.innerHTML = html;

    container.querySelector('#bb-goal-btn')?.addEventListener('click', () => {
      this.engine.setShopSection(goal.goShop);
      this.engine.setTab('shop');
    });
  }
}
