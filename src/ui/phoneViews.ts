import {
  ACHIEVEMENTS,
  APP_THEMES,
  AUTOMATION_UPGRADES,
  DECOR_ITEMS,
  FARM_PHONES,
  MESSAGES_LIST,
  MILESTONES,
  PHONE_UPGRADES,
  POST_CATEGORIES,
  PRESTIGE_UPGRADES,
  RARITY_CONFIG,
  TECH_UPGRADES,
} from '../data/gameData';
import type { GameEngine } from '../engine/gameEngine';
import type { AppThemeId, DecorId, FarmPhoneId, PhoneUpgradeId, PostCategory, PrestigeUpgradeId, Rarity, ShopSection, TechUpgradeId, AutomationId } from '../types/game';
import { formatNumber, formatTime } from '../utils/format';

export class PhoneAppsView {
  private root: HTMLElement;
  private engine: GameEngine;
  private awardsSubtab: 'challenges' | 'achievements' | 'milestones' = 'challenges';
  private selectedMessageId: string | null = null;
  private confirmRebirth = false;
  private confirmHardReset = false;
  private importStatus = '';

  constructor(root: HTMLElement, engine: GameEngine) {
    this.root = root;
    this.engine = engine;
  }

  public render(): void {
    const tab = this.engine.state.activeTab;
    const theme = APP_THEMES[this.engine.state.activeTheme] || APP_THEMES.classic;
    const vars = `--th-primary:${theme.primary};--th-accent:${theme.accent};--th-bg:${theme.screenBg};--th-card:${theme.cardBg};--th-text:${theme.text};--th-muted:${theme.muted};--th-border:${theme.border};`;

    if (tab === 'shop') {
      this.renderShop(vars);
    } else if (tab === 'messages') {
      this.renderMessages(vars);
    } else if (tab === 'awards') {
      this.renderAwards(vars);
    } else if (tab === 'stats') {
      this.renderStats(vars);
    } else if (tab === 'rebirth') {
      this.renderRebirth(vars);
    } else if (tab === 'settings') {
      this.renderSettings(vars);
    }
  }

  private renderShop(vars: string): void {
    const s = this.engine.state;
    const sec = s.activeShopSection;

    let bodyHtml = '';
    if (sec === 'phone') {
      bodyHtml = PHONE_UPGRADES.map((u) => {
        const lvl = s.phoneUpgrades[u.id] || 0;
        const cost = this.engine.getPhoneUpgradeCost(u.id);
        const can = s.dp >= cost;
        const tierName = u.tiers[Math.min(u.tiers.length - 1, Math.floor(lvl / 3))];
        return `
          <div class="shop-item">
            <div class="shop-item-main">
              <div class="shop-item-title">${u.icon} ${u.name} <span class="lvl-tag">Lv.${lvl}</span></div>
              <div class="shop-item-sub">${tierName} • ${u.effectText(lvl)}</div>
            </div>
            <button class="buy-btn ${can ? 'can-afford' : ''}" data-buy-phone="${u.id}" ${!can ? 'disabled' : ''}>
              ${formatNumber(cost)} DP
            </button>
          </div>`;
      }).join('');
    } else if (sec === 'farm') {
      bodyHtml = `
        <div class="bulk-bar">
          <span>Buy Qty:</span>
          ${(['1', '10', 'max'] as const)
            .map(
              (amt) =>
                `<button class="bulk-pill ${String(s.buyAmount) === amt ? 'active' : ''}" data-bulk="${amt}">${amt === 'max' ? 'MAX' : amt + 'x'}</button>`
            )
            .join('')}
        </div>
        ${FARM_PHONES.map((p) => {
          const owned = s.farmPhones[p.id] || 0;
          const unlocked = s.lifetimeDp >= p.unlockDp || owned > 0;
          if (!unlocked) {
            return `
              <div class="shop-item locked">
                <div class="shop-item-main">
                  <div class="shop-item-title">🔒 ${p.name}</div>
                  <div class="shop-item-sub">Unlock at ${formatNumber(p.unlockDp)} lifetime DP</div>
                </div>
              </div>`;
          }
          const maxInfo = this.engine.getMaxAffordableFarmPhone(p.id);
          const qty = s.buyAmount === 'max' ? Math.max(1, maxInfo.qty) : s.buyAmount;
          const cost = this.engine.getFarmPhoneBulkCost(p.id, qty);
          const can = s.dp >= cost;
          const unitDps = this.engine.getFarmPhoneUnitDps(p.id);
          const ocLvl = s.farmOverclocks[p.id] || 0;
          const ocCost = this.engine.getFarmOverclockCost(p.id);
          const canOc = owned > 0 && s.dp >= ocCost;

          return `
            <div class="shop-item">
              <div class="shop-item-main">
                <div class="shop-item-title">
                  <span class="mini-phone-dot" style="background:${p.screenColor};border-color:${p.bodyColor}"></span>
                  ${p.name} <span class="lvl-tag">x${owned}</span>
                </div>
                <div class="shop-item-sub">${formatNumber(unitDps)}/s each • Total: ${formatNumber(unitDps * owned)}/s</div>
                ${
                  owned > 0
                    ? `<button class="mini-oc-btn ${canOc ? 'can-afford' : ''}" data-oc="${p.id}" ${!canOc ? 'disabled' : ''}>
                        ⚡ Overclock Lv.${ocLvl} (+55%) — ${formatNumber(ocCost)} DP
                      </button>`
                    : ''
                }
              </div>
              <button class="buy-btn ${can ? 'can-afford' : ''}" data-buy-farm="${p.id}" ${!can ? 'disabled' : ''}>
                +${qty}<br/>${formatNumber(cost)}
              </button>
            </div>`;
        }).join('')}
      `;
    } else if (sec === 'automation') {
      bodyHtml = AUTOMATION_UPGRADES.map((a) => {
        const lvl = s.automation[a.id] || 0;
        const maxed = lvl >= a.maxLevel;
        const unlocked = s.lifetimeDp >= a.unlockDp || lvl > 0;
        if (!unlocked) {
          return `
            <div class="shop-item locked">
              <div class="shop-item-main">
                <div class="shop-item-title">🔒 ${a.name}</div>
                <div class="shop-item-sub">Unlock at ${formatNumber(a.unlockDp)} lifetime DP</div>
              </div>
            </div>`;
        }
        const cost = this.engine.getAutomationCost(a.id);
        const can = !maxed && s.dp >= cost;
        return `
          <div class="shop-item">
            <div class="shop-item-main">
              <div class="shop-item-title">${a.icon} ${a.name} <span class="lvl-tag">${lvl}/${a.maxLevel}</span></div>
              <div class="shop-item-sub">${a.description}</div>
            </div>
            <button class="buy-btn ${can ? 'can-afford' : ''}" data-buy-auto="${a.id}" ${!can || maxed ? 'disabled' : ''}>
              ${maxed ? 'MAX' : `${formatNumber(cost)} DP`}
            </button>
          </div>`;
      }).join('');
    } else if (sec === 'tech') {
      bodyHtml = TECH_UPGRADES.map((t) => {
        const lvl = s.techUpgrades[t.id] || 0;
        const maxed = lvl >= t.maxLevel;
        const cost = this.engine.getTechCost(t.id);
        const can = !maxed && s.dp >= cost;
        const tier = t.tiers[Math.min(t.tiers.length - 1, Math.floor(lvl / 2))];
        return `
          <div class="shop-item">
            <div class="shop-item-main">
              <div class="shop-item-title">${t.icon} ${t.name} <span class="lvl-tag">${lvl}/${t.maxLevel}</span></div>
              <div class="shop-item-sub">${tier} • ${t.description}</div>
            </div>
            <button class="buy-btn ${can ? 'can-afford' : ''}" data-buy-tech="${t.id}" ${!can || maxed ? 'disabled' : ''}>
              ${maxed ? 'MAX' : `${formatNumber(cost)} DP`}
            </button>
          </div>`;
      }).join('');
    } else if (sec === 'customize') {
      bodyHtml = `
        <div class="sub-head">📚 POST CATEGORIES</div>
        ${POST_CATEGORIES.map((c) => {
          const owned = s.unlockedCategories[c.id];
          const can = s.dp >= c.cost;
          return `
            <div class="shop-item">
              <div class="shop-item-main">
                <div class="shop-item-title">${c.icon} ${c.name}</div>
                <div class="shop-item-sub">${c.description}</div>
              </div>
              <button class="buy-btn ${owned ? 'owned' : can ? 'can-afford' : ''}" data-buy-cat="${c.id}" ${!owned && !can ? 'disabled' : ''}>
                ${owned ? (s.activeCategory === c.id ? 'ACTIVE' : 'FILTER') : `${formatNumber(c.cost)} DP`}
              </button>
            </div>`;
        }).join('')}

        <div class="sub-head">🎨 APP THEMES</div>
        ${(Object.keys(APP_THEMES) as AppThemeId[])
          .map((id) => APP_THEMES[id])
          .map((th) => {
            const owned = s.unlockedThemes[th.id];
            const active = s.activeTheme === th.id;
            const lockedRebirth = th.requiresRebirth && s.rebirthCount < 1;
            const can = !lockedRebirth && (owned || s.dp >= th.cost);
            return `
              <div class="shop-item">
                <div class="shop-item-main">
                  <div class="shop-item-title">
                    <span class="theme-swatch" style="background:${th.primary};border-color:${th.accent}"></span>
                    ${th.name}
                  </div>
                  <div class="shop-item-sub">${lockedRebirth ? 'Unlocked via Digital Rebirth' : owned ? 'Unlocked' : 'Custom OS skin'}</div>
                </div>
                <button class="buy-btn ${active ? 'owned' : can ? 'can-afford' : ''}" data-buy-theme="${th.id}" ${!can ? 'disabled' : ''}>
                  ${active ? 'EQUIPPED' : owned ? 'EQUIP' : lockedRebirth ? 'LOCKED' : `${formatNumber(th.cost)} DP`}
                </button>
              </div>`;
          })
          .join('')}

        <div class="sub-head">🛋️ BEDROOM DECOR</div>
        ${DECOR_ITEMS.map((d) => {
          const owned = s.decor[d.id];
          const can = !owned && s.dp >= d.cost;
          return `
            <div class="shop-item">
              <div class="shop-item-main">
                <div class="shop-item-title">${owned ? '✅' : '🛋️'} ${d.name}</div>
                <div class="shop-item-sub">${d.buffLabel} • ${d.description}</div>
              </div>
              <button class="buy-btn ${owned ? 'owned' : can ? 'can-afford' : ''}" data-buy-decor="${d.id}" ${owned || !can ? 'disabled' : ''}>
                ${owned ? 'PLACED' : `${formatNumber(d.cost)} DP`}
              </button>
            </div>`;
        }).join('')}
      `;
    }

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar">
          <span>🛒 EMPIRE SHOP</span>
          <span class="dp-chip">${formatNumber(s.dp)} DP</span>
        </div>
        <div class="subtab-row">
          ${(
            [
              ['phone', '📱 Phone'],
              ['farm', '📲 Farm'],
              ['automation', '🤖 Auto'],
              ['tech', '🌐 Tech'],
              ['customize', '🎨 Room'],
            ] as [ShopSection, string][]
          )
            .map(
              ([id, label]) =>
                `<button class="subtab-btn ${sec === id ? 'active' : ''}" data-shop-sec="${id}">${label}</button>`
            )
            .join('')}
        </div>
        <div class="app-scroll">${bodyHtml}</div>
      </div>
    `;

    this.root.querySelectorAll('[data-shop-sec]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.setShopSection((el as HTMLElement).dataset.shopSec as ShopSection)
      )
    );
    this.root.querySelectorAll('[data-bulk]').forEach((el) =>
      el.addEventListener('click', () => {
        const val = (el as HTMLElement).dataset.bulk;
        this.engine.setBuyAmount(val === 'max' ? 'max' : (Number(val) as 1 | 10));
      })
    );
    this.root.querySelectorAll('[data-buy-phone]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyPhoneUpgrade((el as HTMLElement).dataset.buyPhone as PhoneUpgradeId)
      )
    );
    this.root.querySelectorAll('[data-buy-farm]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyFarmPhone((el as HTMLElement).dataset.buyFarm as FarmPhoneId)
      )
    );
    this.root.querySelectorAll('[data-oc]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyFarmOverclock((el as HTMLElement).dataset.oc as FarmPhoneId)
      )
    );
    this.root.querySelectorAll('[data-buy-auto]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyAutomation((el as HTMLElement).dataset.buyAuto as AutomationId)
      )
    );
    this.root.querySelectorAll('[data-buy-tech]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyTechUpgrade((el as HTMLElement).dataset.buyTech as TechUpgradeId)
      )
    );
    this.root.querySelectorAll('[data-buy-cat]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.unlockCategory((el as HTMLElement).dataset.buyCat as PostCategory)
      )
    );
    this.root.querySelectorAll('[data-buy-theme]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.unlockOrSelectTheme((el as HTMLElement).dataset.buyTheme as AppThemeId)
      )
    );
    this.root.querySelectorAll('[data-buy-decor]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyDecor((el as HTMLElement).dataset.buyDecor as DecorId)
      )
    );
  }

  private renderMessages(vars: string): void {
    const s = this.engine.state;
    const unlocked = MESSAGES_LIST.filter((m) => s.messages[m.id]?.unlocked);

    if (this.selectedMessageId) {
      const def = MESSAGES_LIST.find((m) => m.id === this.selectedMessageId);
      const st = def ? s.messages[def.id] : undefined;
      if (def && st) {
        const chosen = st.chosenIndex !== null ? def.choices[st.chosenIndex] : null;
        this.root.innerHTML = `
          <div class="app-pane" style="${vars}">
            <div class="app-title-bar">
              <button class="back-btn" id="msg-back">◀ Inbox</button>
              <span>${def.sender}</span>
            </div>
            <div class="app-scroll">
              <div class="msg-thread-card">
                <div class="msg-sender-row">
                  <div class="px-avatar" style="background:${def.avatarColor}">${def.sender[0]}</div>
                  <div>
                    <div class="author-name">${def.sender}</div>
                    <div class="author-handle">${def.handle}</div>
                  </div>
                </div>
                <div class="msg-bubble incoming">${def.body}</div>
                ${
                  chosen
                    ? `<div class="msg-bubble outgoing">${chosen.label}</div>
                       <div class="msg-bubble incoming">${chosen.replyText}</div>`
                    : `<div class="msg-choices">
                        ${def.choices
                          .map(
                            (ch, idx) =>
                              `<button class="choice-btn" data-reply-idx="${idx}">${ch.label}</button>`
                          )
                          .join('')}
                       </div>`
                }
              </div>
            </div>
          </div>
        `;
        this.root.querySelector('#msg-back')?.addEventListener('click', () => {
          this.selectedMessageId = null;
          this.render();
        });
        this.root.querySelectorAll('[data-reply-idx]').forEach((btn) =>
          btn.addEventListener('click', () => {
            const idx = Number((btn as HTMLElement).dataset.replyIdx);
            this.engine.replyToMessage(def.id, idx);
          })
        );
        return;
      }
      this.selectedMessageId = null;
    }

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar">
          <span>💬 MESSAGES</span>
          <span class="dp-chip">${unlocked.length}/${MESSAGES_LIST.length}</span>
        </div>
        <div class="app-scroll">
          ${
            unlocked.length === 0
              ? `<div class="empty-note">Swipe a few posts to start getting DMs!</div>`
              : unlocked
                  .map((m) => {
                    const st = s.messages[m.id];
                    const unread = !st.read;
                    return `
                      <button class="msg-row ${unread ? 'unread' : ''}" data-open-msg="${m.id}">
                        <div class="px-avatar" style="background:${m.avatarColor}">${m.sender[0]}</div>
                        <div class="msg-row-text">
                          <div class="msg-row-top">
                            <strong>${m.sender}</strong>
                            ${unread ? '<span class="unread-dot">NEW</span>' : st.chosenIndex !== null ? '<span class="replied-tag">✓</span>' : ''}
                          </div>
                          <div class="msg-preview">${m.preview}</div>
                        </div>
                      </button>
                    `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;

    this.root.querySelectorAll('[data-open-msg]').forEach((el) =>
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.openMsg!;
        this.selectedMessageId = id;
        this.engine.markMessageRead(id);
        this.render();
      })
    );
  }

  private renderAwards(vars: string): void {
    const s = this.engine.state;
    const sub = this.awardsSubtab;

    let body = '';
    if (sub === 'challenges') {
      body = `
        <div class="sub-head">🎯 DAILY CHALLENGES (Completed: ${s.dailyCompletedCount})</div>
        ${s.dailyChallenges
          .map((ch) => {
            const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
            const ready = !ch.claimed && ch.progress >= ch.target;
            return `
              <div class="challenge-card ${ch.claimed ? 'claimed' : ''}">
                <div class="ch-top">
                  <strong>${ch.title}</strong>
                  <span>${ch.progress}/${ch.target}</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                <div class="ch-foot">
                  <span>Reward: ${formatNumber(ch.rewardDp)} DP${ch.rewardShards ? ` + ${ch.rewardShards} 💎` : ''}</span>
                  <button class="buy-btn ${ready ? 'can-afford' : ''}" data-claim-ch="${ch.id}" ${!ready ? 'disabled' : ''}>
                    ${ch.claimed ? 'CLAIMED' : ready ? 'CLAIM!' : 'IN PROGRESS'}
                  </button>
                </div>
              </div>
            `;
          })
          .join('')}
      `;
    } else if (sub === 'achievements') {
      const unlockedCount = ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length;
      const bonusPct = Math.round((this.engine.getAchievementBonusMultiplier() - 1) * 100);
      body = `
        <div class="sub-head">🏆 ${unlockedCount}/${ACHIEVEMENTS.length} UNLOCKED (+${bonusPct}% ALL DP)</div>
        ${ACHIEVEMENTS.map((a) => {
          const done = !!s.achievements[a.id];
          return `
            <div class="ach-row ${done ? 'done' : ''}">
              <div class="ach-icon">${done ? a.icon : '🔒'}</div>
              <div class="ach-info">
                <div class="ach-title">${a.name} <span class="lvl-tag">+${a.rewardPercent}%</span></div>
                <div class="shop-item-sub">${a.description}</div>
              </div>
            </div>
          `;
        }).join('')}
      `;
    } else {
      body = `
        <div class="sub-head">🏁 PROGRESSION MILESTONES</div>
        ${MILESTONES.map((m) => {
          const done = !!s.milestonesClaimed[m.id];
          const pct = Math.min(100, Math.round((s.lifetimeDp / m.targetLifetimeDp) * 100));
          return `
            <div class="challenge-card ${done ? 'claimed' : ''}">
              <div class="ch-top">
                <strong>${done ? '✅' : '🏁'} ${m.name}</strong>
                <span>${pct}%</span>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
              <div class="ch-foot">
                <span>Goal: ${formatNumber(m.targetLifetimeDp)} DP</span>
                <span>${m.rewardDesc}</span>
              </div>
            </div>
          `;
        }).join('')}
      `;
    }

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar"><span>🏆 AWARDS & GOALS</span></div>
        <div class="subtab-row">
          <button class="subtab-btn ${sub === 'challenges' ? 'active' : ''}" data-aw="challenges">🎯 Daily</button>
          <button class="subtab-btn ${sub === 'achievements' ? 'active' : ''}" data-aw="achievements">🏆 Trophies</button>
          <button class="subtab-btn ${sub === 'milestones' ? 'active' : ''}" data-aw="milestones">🏁 Milestones</button>
        </div>
        <div class="app-scroll">${body}</div>
      </div>
    `;

    this.root.querySelectorAll('[data-aw]').forEach((el) =>
      el.addEventListener('click', () => {
        this.awardsSubtab = (el as HTMLElement).dataset.aw as typeof sub;
        this.render();
      })
    );
    this.root.querySelectorAll('[data-claim-ch]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.claimDailyChallenge((el as HTMLElement).dataset.claimCh!)
      )
    );
  }

  private renderStats(vars: string): void {
    const s = this.engine.state;
    const totalPhones = Object.values(s.farmPhones).reduce((a, b) => a + b, 0);
    const decorCount = Object.values(s.decor).filter(Boolean).length;
    const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar"><span>📊 EMPIRE STATS</span></div>
        <div class="app-scroll">
          <div class="stat-grid">
            <div class="stat-box"><span>Current DP</span><strong>${formatNumber(s.dp)}</strong></div>
            <div class="stat-box"><span>Run DP</span><strong>${formatNumber(s.runDp)}</strong></div>
            <div class="stat-box"><span>Lifetime DP</span><strong>${formatNumber(s.lifetimeDp)}</strong></div>
            <div class="stat-box"><span>Idle DP/sec</span><strong>${formatNumber(this.engine.getTotalIdleDps())}</strong></div>
            <div class="stat-box"><span>Base Swipe DP</span><strong>${formatNumber(this.engine.getSwipeBaseDp())}</strong></div>
            <div class="stat-box"><span>Global Mult</span><strong>x${this.engine.getGlobalMultiplier().toFixed(2)}</strong></div>
            <div class="stat-box"><span>Total Swipes</span><strong>${s.totalSwipes.toLocaleString()}</strong></div>
            <div class="stat-box"><span>Posts Liked</span><strong>${s.totalLikes.toLocaleString()}</strong></div>
            <div class="stat-box"><span>Best Combo</span><strong>${s.bestCombo}x</strong></div>
            <div class="stat-box"><span>Room Phones</span><strong>${totalPhones}</strong></div>
            <div class="stat-box"><span>Room Decor</span><strong>${decorCount}/${DECOR_ITEMS.length}</strong></div>
            <div class="stat-box"><span>Playtime</span><strong>${formatTime(s.playTimeSeconds)}</strong></div>
          </div>

          <div class="sub-head">🎲 POST DISCOVERIES</div>
          <div class="rarity-stats">
            ${rarities
              .map((r) => {
                const cfg = RARITY_CONFIG[r];
                return `
                  <div class="rarity-stat-row">
                    <span style="color:${cfg.color}">${cfg.label}</span>
                    <strong>${(s.rarityCounts[r] || 0).toLocaleString()}</strong>
                  </div>`;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderRebirth(vars: string): void {
    const s = this.engine.state;
    const pending = this.engine.getPendingCloutShards();
    const canRebirth = this.engine.canRebirth();
    const pct = Math.min(100, Math.round((s.runDp / this.engine.REBIRTH_THRESHOLD) * 100));

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar">
          <span>🔮 DIGITAL REBIRTH</span>
          <span class="dp-chip">💎 ${s.cloutShards}</span>
        </div>
        <div class="app-scroll">
          <div class="rebirth-hero">
            <div class="rebirth-title">TRANSCEND YOUR FEED</div>
            <p class="rebirth-desc">
              Reset DP, upgrades & phones to earn <strong>Clout Shards 💎</strong> for permanent multipliers & cosmic perks.
            </p>
            <div class="progress-track"><div class="progress-fill rebirth-bar" style="width:${pct}%"></div></div>
            <div class="rebirth-meter-text">
              Run DP: ${formatNumber(s.runDp)} / ${formatNumber(this.engine.REBIRTH_THRESHOLD)}
            </div>
            <div class="rebirth-reward">
              Pending Gain: <strong>+${pending} 💎 Clout Shards</strong>
            </div>
            ${
              this.confirmRebirth
                ? `<div class="confirm-row">
                    <button class="rebirth-go-btn" id="btn-rebirth-confirm">CONFIRM REBIRTH (+${pending} 💎)</button>
                    <button class="cancel-btn" id="btn-rebirth-cancel">Cancel</button>
                   </div>`
                : `<button class="rebirth-go-btn ${canRebirth ? 'ready' : ''}" id="btn-rebirth-start" ${!canRebirth ? 'disabled' : ''}>
                    ${canRebirth ? `✨ DIGITAL REBIRTH (+${pending} 💎)` : 'Need 100K Run DP'}
                   </button>`
            }
          </div>

          <div class="sub-head">💎 PERMANENT PRESTIGE SHOP (Rebirths: ${s.rebirthCount})</div>
          ${PRESTIGE_UPGRADES.map((p) => {
            const lvl = s.prestigeUpgrades[p.id] || 0;
            const maxed = lvl >= p.maxLevel;
            const cost = this.engine.getPrestigeUpgradeCost(p.id);
            const can = !maxed && s.cloutShards >= cost;
            return `
              <div class="shop-item">
                <div class="shop-item-main">
                  <div class="shop-item-title">${p.icon} ${p.name} <span class="lvl-tag">${lvl}/${p.maxLevel}</span></div>
                  <div class="shop-item-sub">${p.description}</div>
                </div>
                <button class="buy-btn ${can ? 'can-afford' : ''}" data-buy-prestige="${p.id}" ${!can || maxed ? 'disabled' : ''}>
                  ${maxed ? 'MAX' : `${cost} 💎`}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.root.querySelector('#btn-rebirth-start')?.addEventListener('click', () => {
      this.confirmRebirth = true;
      this.render();
    });
    this.root.querySelector('#btn-rebirth-cancel')?.addEventListener('click', () => {
      this.confirmRebirth = false;
      this.render();
    });
    this.root.querySelector('#btn-rebirth-confirm')?.addEventListener('click', () => {
      this.confirmRebirth = false;
      this.engine.performDigitalRebirth();
    });
    this.root.querySelectorAll('[data-buy-prestige]').forEach((el) =>
      el.addEventListener('click', () =>
        this.engine.buyPrestigeUpgrade((el as HTMLElement).dataset.buyPrestige as PrestigeUpgradeId)
      )
    );
  }

  private renderSettings(vars: string): void {
    const st = this.engine.state.settings;

    this.root.innerHTML = `
      <div class="app-pane" style="${vars}">
        <div class="app-title-bar"><span>⚙️ SETTINGS</span></div>
        <div class="app-scroll">
          <div class="setting-row">
            <span>🔇 Mute All Audio</span>
            <button class="toggle-btn ${st.muted ? 'on' : ''}" id="set-mute">${st.muted ? 'MUTED' : 'SOUND ON'}</button>
          </div>
          <div class="setting-row">
            <span>🔊 SFX Volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${st.sfxVolume}" id="set-sfx-vol" />
          </div>
          <div class="setting-row">
            <span>🎵 Chiptune Music</span>
            <button class="toggle-btn ${st.musicEnabled ? 'on' : ''}" id="set-music">${st.musicEnabled ? 'ON' : 'OFF'}</button>
          </div>
          <div class="setting-row">
            <span>🎶 Music Volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${st.musicVolume}" id="set-music-vol" />
          </div>
          <div class="setting-row">
            <span>📳 Screen Shake</span>
            <button class="toggle-btn ${st.screenShake ? 'on' : ''}" id="set-shake">${st.screenShake ? 'ON' : 'OFF'}</button>
          </div>
          <div class="setting-row">
            <span>✨ Room Particles</span>
            <button class="toggle-btn ${st.particles ? 'on' : ''}" id="set-particles">${st.particles ? 'ON' : 'OFF'}</button>
          </div>
          <div class="setting-row">
            <span>💬 Floating +DP</span>
            <button class="toggle-btn ${st.floatingNumbers ? 'on' : ''}" id="set-float">${st.floatingNumbers ? 'ON' : 'OFF'}</button>
          </div>

          <div class="sub-head">💾 SAVE MANAGEMENT</div>
          <div class="save-actions">
            <button class="action-btn" id="btn-save-now">💾 Save Now</button>
            <button class="action-btn" id="btn-export-save">📤 Copy Save Code</button>
          </div>
          <div class="import-box">
            <input type="text" id="import-input" placeholder="Paste save code here..." />
            <button class="action-btn" id="btn-import-save">📥 Load</button>
          </div>
          ${this.importStatus ? `<div class="status-note">${this.importStatus}</div>` : ''}

          <div class="danger-zone">
            ${
              this.confirmHardReset
                ? `<button class="danger-btn" id="btn-reset-confirm">CONFIRM WIPE ALL SAVE DATA</button>
                   <button class="cancel-btn" id="btn-reset-cancel">Cancel</button>`
                : `<button class="danger-btn" id="btn-reset-start">🗑️ Hard Reset Save</button>`
            }
          </div>
        </div>
      </div>
    `;

    this.root.querySelector('#set-mute')?.addEventListener('click', () => this.engine.toggleMute());
    this.root.querySelector('#set-music')?.addEventListener('click', () => this.engine.toggleMusic());
    this.root.querySelector('#set-sfx-vol')?.addEventListener('input', (e) => {
      this.engine.updateSettings({ sfxVolume: Number((e.target as HTMLInputElement).value) });
    });
    this.root.querySelector('#set-music-vol')?.addEventListener('input', (e) => {
      this.engine.updateSettings({ musicVolume: Number((e.target as HTMLInputElement).value) });
    });
    this.root.querySelector('#set-shake')?.addEventListener('click', () =>
      this.engine.updateSettings({ screenShake: !st.screenShake })
    );
    this.root.querySelector('#set-particles')?.addEventListener('click', () =>
      this.engine.updateSettings({ particles: !st.particles })
    );
    this.root.querySelector('#set-float')?.addEventListener('click', () =>
      this.engine.updateSettings({ floatingNumbers: !st.floatingNumbers })
    );

    this.root.querySelector('#btn-save-now')?.addEventListener('click', () => {
      this.engine.saveState();
      this.importStatus = 'Saved to browser storage!';
      this.render();
    });

    this.root.querySelector('#btn-export-save')?.addEventListener('click', async () => {
      const code = this.engine.exportSaveString();
      try {
        await navigator.clipboard.writeText(code);
        this.importStatus = 'Save code copied to clipboard!';
      } catch {
        const inp = this.root.querySelector('#import-input') as HTMLInputElement | null;
        if (inp) inp.value = code;
        this.importStatus = 'Save code placed in box below — copy it!';
      }
      this.render();
    });

    this.root.querySelector('#btn-import-save')?.addEventListener('click', () => {
      const inp = this.root.querySelector('#import-input') as HTMLInputElement | null;
      if (!inp || !inp.value.trim()) {
        this.importStatus = 'Paste a valid save code first.';
        this.render();
        return;
      }
      const ok = this.engine.importSaveString(inp.value);
      this.importStatus = ok ? 'Save loaded!' : 'Invalid save code.';
      this.render();
    });

    this.root.querySelector('#btn-reset-start')?.addEventListener('click', () => {
      this.confirmHardReset = true;
      this.render();
    });
    this.root.querySelector('#btn-reset-cancel')?.addEventListener('click', () => {
      this.confirmHardReset = false;
      this.render();
    });
    this.root.querySelector('#btn-reset-confirm')?.addEventListener('click', () => {
      this.confirmHardReset = false;
      this.engine.hardReset();
    });
  }
}
