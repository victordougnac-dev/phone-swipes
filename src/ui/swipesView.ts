import { APP_THEMES, POST_CATEGORIES, RARITY_CONFIG } from '../data/gameData';
import type { GameEngine, SwipeEventResult } from '../engine/gameEngine';
import { renderPostPixelArt } from '../pixel/postArt';
import { formatNumber } from '../utils/format';
import { formatKeyCode } from './phoneViews';

export class SwipesView {
  private root: HTMLElement;
  private engine: GameEngine;
  private artCanvas: HTMLCanvasElement | null = null;
  private artTick = 0;
  private lastPostInstanceId = -1;
  private dragStartY: number | null = null;
  private dragDeltaY = 0;
  private isAnimatingSwipe = false;

  constructor(root: HTMLElement, engine: GameEngine) {
    this.root = root;
    this.engine = engine;
    this.render();
    this.bindEvents();
  }

  private bindEvents(): void {
    this.engine.onSwipe((res) => {
      this.handleSwipeFeedback(res);
    });
  }

  public tickArt(): void {
    this.artTick += 1;
    if (this.artCanvas && this.engine.state.activeTab === 'swipes' && !this.engine.state.paused) {
      renderPostPixelArt(this.artCanvas, this.engine.currentPost.art, this.artTick);
      this.updateVideoScrubber();
    }
  }

  private updateVideoScrubber(): void {
    const prog = this.engine.videoProgress;
    const fill = this.root.querySelector('.video-scrub-fill') as HTMLElement | null;
    const timeEl = this.root.querySelector('.video-time-badge') as HTMLElement | null;
    const critPill = this.root.querySelector('.crit-zone-pill') as HTMLElement | null;
    const inSweet = this.engine.isVideoInSweetSpot();

    if (fill) {
      fill.style.width = `${Math.round(prog * 100)}%`;
      fill.classList.toggle('sweet', inSweet);
    }
    if (timeEl) {
      const dur = this.engine.currentPost.durationSec;
      const cur = Math.floor(prog * dur);
      timeEl.textContent = `▶ 0:0${cur} / 0:0${dur}`;
    }
    if (critPill) {
      critPill.classList.toggle('ready', inSweet);
      critPill.textContent = inSweet ? '⚡ SWIPE NOW! 2.2x CRIT' : '🎯 WATCH FOR GOLD ZONE';
    }
  }

  private handleSwipeFeedback(res: SwipeEventResult): void {
    if (this.engine.state.activeTab !== 'swipes') return;

    const card = this.root.querySelector('.post-card') as HTMLElement | null;
    if (card && !this.engine.state.settings.reducedMotion) {
      card.classList.remove('swipe-enter');
      void card.offsetWidth;
      card.classList.add('swipe-enter');
    }

    if (this.engine.state.settings.floatingNumbers) {
      this.spawnFloatingDp(res.dpGained, res.post.rarity, res.post.bonusTagged, res.isCrit);
    }

    if (
      res.isCrit ||
      res.post.rarity === 'rare' ||
      res.post.rarity === 'epic' ||
      res.post.rarity === 'legendary'
    ) {
      const rar = RARITY_CONFIG[res.post.rarity];
      const banner = document.getElementById('phone-rarity-flash') || (this.root.querySelector('.rarity-flash') as HTMLElement | null);
      if (banner) {
        const prefix = res.post.rarity !== 'common' ? `${rar.label}! ` : '';
        const critTag = res.isCrit ? '⚡ CRIT ' : '';
        banner.textContent = `${critTag}${prefix}+${formatNumber(res.dpGained)} DP`;
        banner.style.color = res.isCrit && res.post.rarity === 'common' ? '#facc15' : rar.color;
        banner.style.borderColor = res.isCrit && res.post.rarity === 'common' ? '#facc15' : rar.color;
        banner.classList.remove('show');
        void banner.offsetWidth;
        banner.classList.add('show');
      }
    }
  }

  private spawnFloatingDp(amount: number, rarity: keyof typeof RARITY_CONFIG, bonus: boolean, isCrit = false): void {
    const shell = document.getElementById('phone-shell') || this.root;
    const el = document.createElement('div');
    el.className = `float-dp${isCrit ? ' crit' : ''}`;
    const rar = RARITY_CONFIG[rarity];
    el.style.color = isCrit ? '#facc15' : rarity === 'common' ? '#4ade80' : rar.color;
    el.textContent = `${isCrit ? '⚡CRIT ' : ''}+${formatNumber(amount)} DP${bonus ? ' ★' : ''}`;
    const leftPct = 24 + Math.random() * 52;
    const topPct = 36 + Math.random() * 22;
    el.style.left = `${leftPct}%`;
    el.style.top = `${topPct}%`;
    shell.appendChild(el);
    window.setTimeout(() => el.remove(), 850);
  }

  public render(): void {
    const s = this.engine.state;
    const theme = APP_THEMES[s.activeTheme] || APP_THEMES.classic;
    const post = this.engine.currentPost;
    const rar = RARITY_CONFIG[post.rarity];
    const combo = this.engine.combo;
    const maxCombo = this.engine.getMaxCombo();
    const fever = this.engine.isFeverActive();
    const hyper = this.engine.isHyperViralActive();
    const comboPct = Math.min(100, Math.round((combo / maxCombo) * 100));
    const autoRate = this.engine.getAutoScrollRatePerSec();
    const rank = this.engine.getViralityRank();
    const goal = this.engine.getNextGoalHint();
    const streakRem = 20 - (s.totalSwipes % 20);

    const unlockedCats = POST_CATEGORIES.filter((c) => s.unlockedCategories[c.id]);

    const existingStage = this.root.querySelector('.swipes-feed-stage');
    if (existingStage && this.lastPostInstanceId === post.instanceId) {
      const comboText = this.root.querySelector('.combo-label') as HTMLElement | null;
      const comboFill = this.root.querySelector('.combo-fill') as HTMLElement | null;
      const likeBtn = this.root.querySelector('.like-btn') as HTMLButtonElement | null;
      const swipeDpVal = this.root.querySelector('.swipe-dp-pill') as HTMLElement | null;
      const goalStrip = this.root.querySelector('.next-goal-strip') as HTMLElement | null;
      if (comboText) {
        comboText.textContent = hyper
          ? `⚡ HYPER VIRAL x${this.engine.getComboMultiplier().toFixed(1)}! (${streakRem} to 🎉)`
          : fever
            ? `🔥 FEVER x${this.engine.getComboMultiplier().toFixed(2)} (${streakRem} to 🎉)`
            : combo > 0
              ? `⚡ COMBO ${combo} (x${this.engine.getComboMultiplier().toFixed(2)}) • ${streakRem} to 🎉`
              : `SWIPE FOR DOPAMINE! • ${streakRem} to 🎉 JACKPOT`;
        comboText.classList.toggle('fever', fever);
      }
      if (comboFill) {
        comboFill.style.width = `${comboPct}%`;
        comboFill.classList.toggle('fever', fever);
      }
      if (likeBtn) {
        likeBtn.classList.toggle('liked', post.liked);
        likeBtn.innerHTML = `${post.liked ? '❤️' : '🤍'} <span>${formatNumber(post.likes)}</span>`;
      }
      if (swipeDpVal) {
        swipeDpVal.textContent = `+${formatNumber(this.engine.getSwipeBaseDp())}/swipe`;
      }
      if (goalStrip) {
        goalStrip.classList.toggle('ready', goal.ready);
        goalStrip.innerHTML = goal.ready
          ? `<span>✨ READY: <strong>${goal.label}</strong> (${formatNumber(goal.cost)} DP)</span><span class="goal-tap">TAP TO BUY →</span>`
          : `<span>🎯 Next: ${goal.label} (${formatNumber(s.dp)}/${formatNumber(goal.cost)})</span><span>${goal.pct}%</span>`;
      }
      this.updateVideoScrubber();
      return;
    }

    this.lastPostInstanceId = post.instanceId;

    this.root.innerHTML = `
      <div class="swipes-app" style="--th-primary:${theme.primary};--th-accent:${theme.accent};--th-bg:${theme.screenBg};--th-card:${theme.cardBg};--th-text:${theme.text};--th-muted:${theme.muted};--th-border:${theme.border};">
        <div class="swipes-header">
          <div class="swipes-brand">
            <span class="brand-dot"></span>
            <span>PHONE SWIPES</span>
            <span class="rank-pill" style="color:${rank.color};border-color:${rank.color}">${rank.label}</span>
          </div>
          <div class="swipe-dp-pill">+${formatNumber(this.engine.getSwipeBaseDp())}/swipe</div>
        </div>

        <div class="cat-pills">
          <button class="cat-pill ${s.activeCategory === 'all' ? 'active' : ''}" data-cat="all">🌐 All</button>
          ${unlockedCats
            .map(
              (c) =>
                `<button class="cat-pill ${s.activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name.split(' ')[0]}</button>`
            )
            .join('')}
        </div>

        <button class="next-goal-strip ${goal.ready ? 'ready' : ''}" id="btn-next-goal">
          ${
            goal.ready
              ? `<span>✨ READY: <strong>${goal.label}</strong> (${formatNumber(goal.cost)} DP)</span><span class="goal-tap">TAP TO BUY →</span>`
              : `<span>🎯 Next: ${goal.label} (${formatNumber(s.dp)}/${formatNumber(goal.cost)})</span><span>${goal.pct}%</span>`
          }
        </button>

        <div class="combo-bar-wrap">
          <div class="combo-label ${fever ? 'fever' : ''}">
            ${
              hyper
                ? `⚡ HYPER VIRAL x${this.engine.getComboMultiplier().toFixed(1)}! (${streakRem} to 🎉)`
                : fever
                  ? `🔥 FEVER x${this.engine.getComboMultiplier().toFixed(2)} (${streakRem} to 🎉)`
                  : combo > 0
                    ? `⚡ COMBO ${combo} (x${this.engine.getComboMultiplier().toFixed(2)}) • ${streakRem} to 🎉`
                    : `SWIPE FOR DOPAMINE! • ${streakRem} to 🎉 JACKPOT`
            }
          </div>
          <div class="combo-track">
            <div class="combo-fill ${fever ? 'fever' : ''}" style="width:${comboPct}%"></div>
          </div>
        </div>

        <div class="swipes-feed-stage" id="swipe-stage">
          <div class="rarity-flash" id="phone-rarity-flash"></div>

          <article class="post-card rarity-${post.rarity}" style="border-color:${rar.color};">
            <div class="post-top">
              <div class="post-author">
                <div class="px-avatar" style="background:${post.avatarColor}">${post.author[0].toUpperCase()}</div>
                <div>
                  <div class="author-name">${post.author}</div>
                  <div class="author-handle">${post.handle} • 👁️ ${formatNumber(post.views)}</div>
                </div>
              </div>
              <div class="rarity-badge" style="color:${rar.color};background:${rar.bg};border-color:${rar.color};">
                ${rar.label} ${rar.multiplier > 1 ? `x${this.engine.getRarityEffectiveMultiplier(post.rarity).toFixed(0)}` : ''}
              </div>
            </div>

            <div class="post-art-frame ${post.bonusTagged ? 'bonus-glow' : ''}">
              <canvas class="post-art-canvas"></canvas>
              <span class="video-time-badge">▶ 0:00 / 0:0${post.durationSec}</span>
              <span class="crit-zone-pill">🎯 WATCH FOR GOLD ZONE</span>
              ${post.bonusTagged ? '<span class="bonus-post-tag">★ VIRAL BONUS</span>' : ''}
              <div class="video-scrub-track">
                <div class="video-scrub-sweet"></div>
                <div class="video-scrub-fill"></div>
              </div>
            </div>

            <div class="post-body">
              <div class="post-title">${post.title}</div>
              <div class="post-caption">${post.caption}</div>
              <div class="post-tags">${post.tags.join(' ')}</div>
            </div>

            <div class="post-actions">
              <button class="like-btn ${post.liked ? 'liked' : ''}" id="btn-like-post" title="Like post for bonus DP">
                ${post.liked ? '❤️' : '🤍'} <span>${formatNumber(post.likes)}</span>
              </button>
              <button class="swipe-next-btn" id="btn-swipe-next">
                ▲ SWIPE NEXT
              </button>
            </div>
          </article>
        </div>

        <div class="swipes-footer-hint">
          ${
            autoRate > 0
              ? `🤖 Auto: ${autoRate.toFixed(1)}/s • 👥 ${formatNumber(this.engine.getFollowers())} followers`
              : `👥 ${formatNumber(this.engine.getFollowers())} followers • Press ${formatKeyCode(s.settings.keybinds.swipePrimary)} / ${formatKeyCode(s.settings.keybinds.swipeSecondary)}`
          }
        </div>
      </div>
    `;

    this.artCanvas = this.root.querySelector('.post-art-canvas') as HTMLCanvasElement | null;
    if (this.artCanvas) {
      renderPostPixelArt(this.artCanvas, post.art, this.artTick);
    }
    this.updateVideoScrubber();

    this.root.querySelector('#btn-next-goal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.engine.setShopSection(goal.goShop);
      this.engine.setTab('shop');
    });

    this.root.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = (btn as HTMLElement).dataset.cat as typeof s.activeCategory;
        this.engine.setActiveCategory(cat);
      });
    });

    const likeBtn = this.root.querySelector('#btn-like-post');
    likeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const gained = this.engine.likeCurrentPost();
      if (gained > 0 && this.engine.state.settings.floatingNumbers) {
        this.spawnFloatingDp(gained, 'uncommon', false, false);
      }
    });

    const nextBtn = this.root.querySelector('#btn-swipe-next');
    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerSwipe();
    });

    const stage = this.root.querySelector('#swipe-stage') as HTMLElement | null;
    if (stage) {
      stage.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        this.dragStartY = e.clientY;
        this.dragDeltaY = 0;
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {
          // Ignore pointer capture errors in sandboxed iframes
        }
      });

      stage.addEventListener('pointermove', (e) => {
        if (this.dragStartY === null) return;
        this.dragDeltaY = e.clientY - this.dragStartY;
        const card = stage.querySelector('.post-card') as HTMLElement | null;
        if (card) {
          const clamped = Math.max(-70, Math.min(40, this.dragDeltaY));
          card.style.transform = `translateY(${clamped}px)`;
        }
      });

      stage.addEventListener('pointerup', (e) => {
        if (this.dragStartY === null) return;
        const delta = this.dragDeltaY;
        this.dragStartY = null;
        this.dragDeltaY = 0;
        const card = stage.querySelector('.post-card') as HTMLElement | null;
        if (card) card.style.transform = '';
        // Swipe up (delta < -22) OR quick tap inside card!
        if (delta < -22 || Math.abs(delta) < 8) {
          if (!(e.target as HTMLElement).closest('button')) {
            this.triggerSwipe();
          }
        }
      });

      stage.addEventListener(
        'wheel',
        (e) => {
          if (Math.abs(e.deltaY) > 12 && !this.isAnimatingSwipe) {
            e.preventDefault();
            this.triggerSwipe();
          }
        },
        { passive: false }
      );
    }
  }

  public triggerSwipe(): void {
    if (this.isAnimatingSwipe) return;
    this.isAnimatingSwipe = true;
    this.engine.performSwipe(false);
    window.setTimeout(() => {
      this.isAnimatingSwipe = false;
    }, 65);
  }
}
