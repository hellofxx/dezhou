/* PokerLab · 牌室学院原型 — 应用逻辑（路由 / 状态 / 视图 / 交互） */
(function () {
  const { MENTORS, STAGES, LESSONS, QUESTIONS, DRILL_SET, QUICK_SET, MODULES, ACHIEVEMENTS, SEED } = window.PL;
  const LS_KEY = 'pokerlab-prototype-v1';
  const ORDER = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'];
  const DIM_NAMES = { preflop: '翻前范围', odds: '赔率计算', gto: 'GTO 决策', mental: '心理纪律', review: '复盘能力' };
  const GRADES = [
    { id: 'best', name: '最佳决策', icon: 'sparkles', max: 0 },
    { id: 'good', name: '良好', icon: 'check', max: 0.5 },
    { id: 'ok', name: '一般', icon: 'info', max: 1.5 },
    { id: 'wrong', name: '失误', icon: 'x', max: 3 },
    { id: 'blunder', name: '严重失误', icon: 'alert', max: Infinity },
  ];
  const PAPER_GRADE_COLOR = { best: '#2f6b3a', good: '#8a641f', ok: '#3f6b5c', wrong: '#a63f30', blunder: '#7a2a20' };

  /* ===== 图标（Lucide 风格内联 SVG，离线可用） ===== */
  const PATHS = {
    spade: '<path d="M12 2C9 7 4 9.2 4 13.2a4.2 4.2 0 0 0 7.2 2.9V22h1.6v-5.9A4.2 4.2 0 0 0 20 13.2C20 9.2 15 7 12 2z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 1.07-1.7 2.5-2.5 2.5-5 4.5 3 6.5 6.5 6.5 10a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    snowflake: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    book: '<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    brain: '<path d="M12 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 1 5.8A3 3 0 0 0 12 20a3 3 0 0 0 5-4.2A3 3 0 0 0 18 10a3 3 0 0 0-3-3 3 3 0 0 0-3-3zM12 4v16"/>',
    puzzle: '<path d="M14 7V4a2 2 0 0 0-4 0v3H7a2 2 0 0 0-2 2v3h3a2 2 0 0 1 0 4H5v3a2 2 0 0 0 2 2h3v-3a2 2 0 0 1 4 0v3h3a2 2 0 0 0 2-2v-3h-3a2 2 0 0 1 0-4h3V9a2 2 0 0 0-2-2z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    sparkles: '<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8-5.8-1.9 5.8-1.9zM5 3v4M3 5h4"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    lightbulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    key: '<path d="M2 18v3h3l10.5-10.5a6 6 0 1 0-3-3L2 18z"/><circle cx="16.5" cy="7.5" r=".5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    play: '<path d="M6 3l14 9-14 9V3z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>',
    chart: '<path d="M3 3v18h18M19 9l-5 5-4-4-3 3"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    meh: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/>',
    frown: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>',
    pin: '<path d="M12 17v5M9 10.8V6a3 3 0 0 1 6 0v4.8l2 3.2H7z"/>',
    bookmark: '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  };
  function icon(name, size = 16, cls = '') {
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.info}</svg>`;
  }
  const SUIT_RED = { '♥': 1, '♦': 1 };
  function cardHTML(rank, suit, size = '') {
    const red = SUIT_RED[suit] ? ' red' : '';
    return `<div class="playing-card ${size}${red}"><div class="pc-corner"><span class="pc-rank">${rank}</span><span class="pc-suit">${suit}</span></div><div class="pc-center">${suit}</div><div class="pc-corner bottom"><span class="pc-rank">${rank}</span><span class="pc-suit">${suit}</span></div></div>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ===== 状态 ===== */
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return Object.assign({}, SEED, JSON.parse(raw));
    } catch (e) { /* 首次或损坏 → 种子 */ }
    return JSON.parse(JSON.stringify(SEED));
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式降级为内存 */ } }
  function mutate(fn) { fn(state); save(); }

  function stageUnlocked(idx) {
    if (state.demoUnlock || idx === 0) return true;
    return STAGES[idx - 1].lessons.every((id) => state.lessons[id] === 'done');
  }
  function lessonStatus(id) {
    if (state.lessons[id] === 'done') return 'done';
    const si = STAGES.findIndex((s) => s.lessons.includes(id));
    if (!stageUnlocked(si)) return 'locked';
    const firstOpen = ORDER.find((lid) => state.lessons[lid] !== 'done' && stageUnlocked(STAGES.findIndex((s) => s.lessons.includes(lid))));
    return firstOpen === id ? 'current' : 'open';
  }
  function currentLesson() {
    return ORDER.find((id) => lessonStatus(id) === 'current') || ORDER.find((id) => lessonStatus(id) === 'open') || 'l7';
  }
  function stageProgress(stage) {
    const done = stage.lessons.filter((id) => state.lessons[id] === 'done').length;
    return done / stage.lessons.length;
  }
  function currentStageIdx() {
    const cur = currentLesson();
    return STAGES.findIndex((s) => s.lessons.includes(cur));
  }
  function rankName(elo) { return elo < 1100 ? '青铜' : elo < 1200 ? '白银' : elo < 1350 ? '黄金' : elo < 1500 ? '铂金' : '钻石'; }
  function nextRankAt(elo) { return elo < 1100 ? 1100 : elo < 1200 ? 1200 : elo < 1350 ? 1350 : elo < 1500 ? 1500 : 1700; }
  function gradeOf(ev) { return GRADES.find((g) => ev <= g.max); }
  function avgAccuracy() {
    const vals = state.accuracy7.filter((v) => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  function weakestDim() { return Object.keys(state.dims).sort((a, b) => state.dims[a] - state.dims[b])[0]; }

  /* ===== 小件渲染 ===== */
  function ringSVG(pct, size = 56, stroke = 3) {
    const r = (size - stroke * 2) / 2;
    const c = 2 * Math.PI * r;
    const color = pct >= 1 ? 'var(--success)' : pct > 0 ? 'var(--brass)' : 'var(--walnut-border)';
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--walnut-border)" stroke-width="${stroke}" opacity="0.3"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  }
  function sparkline(vals) {
    const w = 64, h = 12;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / 100) * h}`).join(' ');
    return `<svg class="sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="var(--brass)" stroke-width="1"/></svg>`;
  }
  function plaqueHTML(value, label, sub, extra = '') {
    return `<div class="plaque ${extra}"><div class="plaque-value font-numeric" data-count="${value}">${value}</div><div class="plaque-label">${label}</div>${sub ? `<div class="plaque-sub">${sub}</div>` : ''}</div>`;
  }
  function countUpAll(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target) || state.motion === false) return;
      const suffix = el.textContent.replace(/[\d.,\s]/g, '');
      const t0 = performance.now();
      const dur = 600;
      (function tick(t) {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  /* ===== 视图：学习路径首页 ===== */
  function viewHome() {
    const cur = currentLesson();
    const curL = LESSONS[cur];
    const si = currentStageIdx();
    const acc = state.accuracy7[6] || avgAccuracy();
    const weak = weakestDim();
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const journey = STAGES.map((s, i) => {
      const unlocked = stageUnlocked(i);
      const p = stageProgress(s);
      const cls = !unlocked ? 'locked' : p >= 1 ? 'done' : i === si ? 'current' : '';
      const chips = s.lessons.map((lid) => {
        const st = lessonStatus(lid);
        const stateIcon = st === 'done' ? icon('check', 13) : st === 'locked' ? icon('lock', 12) : icon('chevron-right', 13);
        return `<button class="lesson-chip ${st}" data-action="open-lesson" data-id="${lid}"><span>${esc(LESSONS[lid].title)}</span><span class="chip-state">${stateIcon}</span></button>`;
      }).join('');
      return `<div class="stage-node ${cls}">
        <div class="stage-ring">${ringSVG(p)}<span class="stage-glyph">${icon(unlocked ? s.glyph : 'lock', 20)}</span></div>
        <div class="stage-plaque">
          <div class="stage-name">${s.name}</div>
          <div class="stage-sub">${s.sub}</div>
          <div class="stage-meta">${unlocked ? `${Math.round(p * 100)}% · ${s.lessons.length} 课` : '未解锁'}</div>
          <div class="stage-lessons">${chips}</div>
        </div>
      </div>`;
    }).join('');

    const recs = [
      { color: 'var(--success)', icon: 'book', title: `继续课程 · ${curL.title}`, tags: '<span class="tag tag-moss">课程</span>', time: `${curL.minutes} 分钟`, action: 'open-lesson', id: cur, done: state.tasks.lesson },
      { color: 'var(--brass)', icon: 'target', title: `弱项补强 · ${DIM_NAMES[weak]}`, tags: '<span class="tag tag-brass">弱项</span>', time: '5 题 · 约 4 分钟', action: 'start-drill', id: 'range', done: state.tasks.drill },
      { color: 'var(--info)', icon: 'refresh', title: `间隔复习 · ${state.srs.length} 张到期卡片`, tags: '<span class="tag tag-sage">SRS</span>', time: '约 2 分钟', action: 'start-drill', id: 'range', done: state.tasks.srs },
    ].map((r) => `<div class="rec-item ${r.done ? 'rec-done' : ''}" style="--rec-color:${r.color}">
      <span class="rec-icon">${icon(r.icon, 16)}</span>
      <div class="grow"><div class="rec-title">${esc(r.title)}</div><div class="rec-tags">${r.tags}<span class="rec-time">${r.time}</span></div></div>
      <button class="rec-go" data-action="${r.action}" data-id="${r.id}" data-mode="${r.id}" aria-label="前往">${icon('arrow-right', 14)}</button>
    </div>`).join('');

    const srsItems = state.srs.slice(0, 4).map((s) => `<div class="srs-item"><span class="srs-icon">${icon('refresh', 13)}</span><div class="grow"><div class="srs-front">${esc(s.front)}</div><div class="srs-meta">${esc(s.meta)}</div></div><span class="tag tag-sage srs-due">今日到期</span></div>`).join('');

    const textures = {
      grid: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(201,162,94,.06) 3px,rgba(201,162,94,.06) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(201,162,94,.06) 3px,rgba(201,162,94,.06) 4px)',
      dots: 'radial-gradient(circle,rgba(201,162,94,.07) 1px,transparent 1px)',
      diag: 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(201,162,94,.05) 4px,rgba(201,162,94,.05) 5px)',
      lines: 'repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(201,162,94,.05) 6px,rgba(201,162,94,.05) 7px)',
    };
    const modules = MODULES.map((m) => `<button class="module-card" data-action="nav" data-to="${m.to}" style="--mod-color:${m.color}">
      <span class="module-icon" style="--mod-texture:${textures[m.texture]};background-size:8px 8px">${icon(m.icon, 20)}</span>
      <span class="grow"><span class="module-title">${m.title}</span><span class="module-desc" style="display:block">${m.desc}</span></span>
      <span class="module-arrow">${icon('chevron-right', 16)}</span>
      <span class="last-badge ${m.id === 'range' ? 'today' : ''}">${m.id === 'range' ? '今日已练' : '2 天前'}</span>
    </button>`).join('');

    const weekDots = state.week.map((v, i) => `<div class="streak-dot ${v ? 'done' : i === 4 ? 'today' : 'missed'}"><span></span><em>${days[i]}</em></div>`).join('');

    return `
    <div class="arena-wrap anim-slide-up">
      <div class="felt-arena">
        <div class="arena-plaque left">${plaqueHTML(state.elo, 'ELO 能力分', rankName(state.elo))}</div>
        <div class="arena-plaque right">${plaqueHTML(state.streakDays, '连续训练', '天')}</div>
        <div class="eyebrow arena-eyebrow">Private Card Room · 学习路径</div>
        <h2 class="arena-title font-display">从入门到精通，一条清晰的牌桌之路</h2>
        <div class="motto-engraved"><span class="motto-line"></span><span class="motto-text">知其道者 · 不惑于局</span><span class="motto-line"></span></div>
        <div class="arena-center">
          <div class="card-fan"><div class="playing-card card-back sm"></div>${cardHTML('A', '♠', 'sm')}</div>
          <div class="chip-stack"><div class="chip chip-brass"></div><div class="chip chip-clay"></div><div class="chip chip-brass"></div></div>
        </div>
        <div class="arena-note">当前段位 ${rankName(state.elo)} · 距${rankName(nextRankAt(state.elo))}还需 ${nextRankAt(state.elo) - state.elo} ELO · 今日已学 ${state.tasks.lesson ? 6 : 0} 分钟</div>
      </div>
      <div class="streak-rail">
        <div class="streak-flame">${icon('flame', 18)}<span class="streak-days font-numeric">${state.streakDays}</span><span class="streak-label">连续天数</span></div>
        <div class="streak-dots">${weekDots}</div>
        <span class="freeze-chip">${icon('snowflake', 13)}<span class="font-numeric">${state.freeze}</span><span class="streak-label">冻结卡</span></span>
        <span class="rail-sep"></span>
        <div class="rail-acc"><span class="rail-acc-value font-numeric">${acc}%</span><span class="streak-label">今日正确率</span></div>
        ${sparkline(state.accuracy7.map((v) => v || avgAccuracy()))}
      </div>
    </div>

    <div class="brass-banner anim-slide-up" style="animation-delay:80ms">
      <div class="banner-body">
        <div class="banner-title">每日速训 · 3 题混合 Drill</div>
        <div class="banner-meta"><span class="banner-pill">约 3 分钟</span><span class="banner-pill">赔率 + 决策 + 谜题</span><span class="banner-pill">维持连击</span></div>
      </div>
      <button class="btn btn-metal" data-action="start-drill" data-mode="quick">${icon('zap', 16)} 开始速训</button>
    </div>

    <div class="panel panel-live anim-slide-up" style="animation-delay:140ms">
      <div class="panel-head"><span class="panel-title">${icon('target', 18)} 学习旅程 · 四段进阶</span><span class="grow"></span><span class="eyebrow eyebrow-brass">脚手架路径</span></div>
      <div class="journey"><div class="journey-track">${journey}</div></div>
      <div class="next-lesson">
        <span class="nl-icon">${icon('play', 18)}</span>
        <div class="grow"><div class="nl-title">下一步 · ${esc(curL.title)}</div><div class="nl-sub">${STAGES[si].name} · 预计 ${curL.minutes} 分钟 · 课后检验 ${curL.exam ? '4/5' : '2/3'} 掌握门槛</div></div>
        <button class="btn btn-brass" data-action="open-lesson" data-id="${cur}">${icon('book', 16)} 继续学习</button>
      </div>
    </div>

    <div class="grid-2 mt-16 stagger">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('pin', 18)} 今日计划</span><span class="grow"></span><span class="eyebrow">${Object.values(state.tasks).filter(Boolean).length}/3 完成</span></div>
        ${recs}
        <div class="mt-auto mt-12 muted" style="font-size:10px">按「弱项优先 + 到期复习 + 课程推进」编排 · 刻意练习原则</div>
      </div>
      <div class="panel panel-live">
        <div class="panel-head"><span class="panel-title">${icon('refresh', 18)} 间隔复习</span><span class="grow"></span><span class="live-dot"></span></div>
        ${srsItems || '<div class="empty-note">暂无到期卡片 · 答错的题会自动进入队列</div>'}
        <button class="btn btn-quiet btn-block mt-auto mt-12" data-action="start-drill" data-mode="range">${icon('refresh', 14)} 开始复习（并入训练）</button>
      </div>
    </div>

    <div class="section-title">${icon('grid', 18)} 训练场</div>
    <div class="module-grid stagger">${modules}</div>`;
  }

  /* ===== 视图：课程学习 ===== */
  let quizAnswers = {};
  function viewLesson(id) {
    const L = LESSONS[id];
    if (!L) return viewHome();
    const st = lessonStatus(id);
    if (st === 'locked') { setTimeout(() => { location.hash = '#/home'; lockedSlip(id); }, 0); return viewHome(); }
    quizAnswers = {};
    const si = STAGES.findIndex((s) => s.lessons.includes(id));
    const stage = STAGES[si];
    const passNeed = L.exam ? 4 : 2;
    const blocks = L.blocks.map((b, i) => {
      if (b.type === 'hand-example') {
        return `<div class="content-block hand-example"><div class="cb-label" style="color:var(--brass-bright)">${esc(b.label || '手牌示例')}</div><div class="hand-row">${b.cards.map((c) => cardHTML(c[0], c[1], 'sm')).join('')}<span class="hand-note">${esc(b.note)}</span></div></div>`;
      }
      const icons = { 'key-point': 'key', 'pro-tip': 'lightbulb', formula: 'sigma', 'counter-intuitive': 'lightbulb', highlight: 'alert' };
      return `<div class="content-block ${b.type}"><span class="cb-icon">${icon(icons[b.type] || 'info', 20)}</span><div>${b.label ? `<div class="cb-label">${esc(b.label)}</div>` : ''}<div class="cb-body">${esc(b.text).replace(/\n/g, '<br>')}</div></div></div>`;
    }).join('');
    const toc = stage.lessons.map((lid) => {
      const lst = lessonStatus(lid);
      return `<button class="toc-item ${lid === id ? 'active' : ''} ${lst === 'done' ? 'done' : ''}" data-action="open-lesson" data-id="${lid}"><span>${esc(LESSONS[lid].title)}</span><span class="toc-state">${lst === 'done' ? icon('check', 13) : lst === 'locked' ? icon('lock', 12) : ''}</span></button>`;
    }).join('');
    const quiz = L.quiz.map((q, qi) => `<div class="quiz-q" id="qq-${qi}">
      <div class="quiz-q-text"><span class="quiz-q-num">${String(qi + 1).padStart(2, '0')}</span>${esc(q.q)}</div>
      <div class="quiz-opts">${q.opts.map((o, oi) => `<button class="quiz-opt" data-action="quiz-opt" data-q="${qi}" data-opt="${oi}"><span class="opt-key">${'ABC'[oi]}</span><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="quiz-explain-slot"></div>
    </div>`).join('');

    return `
    <button class="back-link" data-action="nav" data-to="#/home">${icon('chevron-left', 15)} 返回学习路径</button>
    <div class="lesson-head">
      <span class="eyebrow eyebrow-brass">${stage.name} · 第 ${si + 1} 段</span>
      <h2 class="lesson-title font-display">${esc(L.title)}</h2>
      <div class="lesson-meta">
        <span class="pill">${icon('clock', 13)} 预计 ${L.minutes} 分钟</span>
        <span class="pill">${icon('key', 13)} ${L.takeaway.length} 个要点</span>
        <span class="pill">${icon('target', 13)} 掌握门槛 ${passNeed}/${L.quiz.length}</span>
        ${st === 'done' ? `<span class="stamp">${icon('check', 12)} 已掌握 · 得分 ${state.lessonScores[id] || 0}/${L.quiz.length}</span>` : ''}
      </div>
    </div>
    <div class="reading-plane">
      <div class="reading-col">
        <div class="lesson-prose anim-slide-up"><p>${esc(L.intro)}</p></div>
        <div class="stagger">${blocks}</div>
        <div class="lesson-takeaway anim-slide-up">
          <div class="takeaway-title">${icon('bookmark', 15)} 要点总结</div>
          <ul>${L.takeaway.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="quiz-zone" id="quiz-zone">
          <div class="quiz-head"><span class="panel-title">${icon('target', 18)} ${L.exam ? '认证考试' : '课后检验'}</span><span class="quiz-score" id="quiz-score">0/${L.quiz.length}</span></div>
          <p class="muted mb-12" style="font-size:11px">答对 ${passNeed} 题即达掌握门槛${L.exam ? '，通过认证' : '，解锁下一课'}。答错会给出解释——错误也是教材。</p>
          ${quiz}
          <div id="quiz-result-slot"></div>
        </div>
      </div>
      <aside class="lesson-rail">
        <div class="panel rail-block">
          <div class="panel-title">${icon('book', 15)} 本段目录</div>
          ${toc}
        </div>
        <div class="panel rail-block">
          <div class="panel-title">${icon('chart', 15)} 学习进度</div>
          <div class="row gap-12">
            ${ringSVG(stageProgress(stage), 48)}
            <div><div class="font-display" style="font-size:18px;font-weight:600">${Math.round(stageProgress(stage) * 100)}%</div><div class="muted" style="font-size:10px">${stage.name}</div></div>
          </div>
          <div class="muted mt-12" style="font-size:10px;line-height:1.6">掌握学习：达标才前进。未通过可重读重答，不扣任何奖励。</div>
        </div>
      </aside>
    </div>`;
  }

  function handleQuizOpt(qi, oi) {
    const id = location.hash.split('/')[2];
    const L = LESSONS[id];
    if (!L || quizAnswers[qi] !== undefined) return;
    const q = L.quiz[qi];
    quizAnswers[qi] = oi;
    const qEl = document.getElementById(`qq-${qi}`);
    qEl.querySelectorAll('.quiz-opt').forEach((btn, idx) => {
      btn.classList.add('dim');
      btn.disabled = true;
      if (idx === q.a) { btn.classList.remove('dim'); btn.classList.add('correct'); }
      if (idx === oi && oi !== q.a) { btn.classList.remove('dim'); btn.classList.add('wrong'); btn.classList.add('anim-shake'); }
      if (idx === oi && oi === q.a) btn.classList.add('anim-pop');
    });
    qEl.querySelector('.quiz-explain-slot').innerHTML = `<div class="quiz-explain">${oi === q.a ? '✓ ' : '✗ '}${esc(q.explain)}</div>`;
    const score = Object.entries(quizAnswers).filter(([k, v]) => L.quiz[k].a === v).length;
    document.getElementById('quiz-score').textContent = `${score}/${L.quiz.length}`;
    if (Object.keys(quizAnswers).length === L.quiz.length) {
      const passNeed = L.exam ? 4 : 2;
      const pass = score >= passNeed;
      document.getElementById('quiz-result-slot').innerHTML = `<div class="quiz-result ${pass ? 'pass' : 'fail'} anim-scale-in">
        <span style="color:${pass ? 'var(--success)' : 'var(--brass-text)'}">${icon(pass ? 'check' : 'refresh', 22)}</span>
        <div class="grow"><div style="font-weight:600;font-size:13px">${pass ? `掌握达标 · ${score}/${L.quiz.length}` : `未达门槛 · ${score}/${L.quiz.length}（需 ${passNeed} 题）`}</div>
        <div class="muted" style="font-size:11px">${pass ? (L.exam ? '认证通过，精通段训练已开放。' : '本课已掌握，下一课已解锁。') : '重读要点总结后再来一次——不扣奖励，错题会进入复习队列。'}</div></div>
        ${pass ? `<button class="btn btn-brass btn-sm" data-action="lesson-complete" data-id="${id}" data-score="${score}">${icon('check', 14)} ${L.exam ? '领取认证' : '完成本课'}</button>` : `<button class="btn btn-quiet btn-sm" data-action="quiz-retry">${icon('refresh', 14)} 重新作答</button>`}
      </div>`;
    }
  }

  function completeLesson(id, score) {
    const L = LESSONS[id];
    const firstTime = state.lessons[id] !== 'done';
    const si = STAGES.findIndex((s) => s.lessons.includes(id));
    const stageWasDone = STAGES[si].lessons.every((lid) => state.lessons[lid] === 'done');
    const gain = firstTime ? (L.exam ? 24 : 8) : 0;
    mutate((s) => {
      s.lessons[id] = 'done';
      s.lessonScores[id] = Math.max(s.lessonScores[id] || 0, score);
      s.elo += gain;
      s.eloHistory.push(s.elo);
      if (s.eloHistory.length > 14) s.eloHistory.shift();
      s.tasks.lesson = true;
      if (L.exam && !s.achievements.includes('certified')) s.achievements.push('certified');
      if (s.dims.odds >= 60 && !s.achievements.includes('odds-master')) s.achievements.push('odds-master');
    });
    const stageNowDone = STAGES[si].lessons.every((lid) => state.lessons[lid] === 'done');
    const newStage = !stageWasDone && stageNowDone && si < STAGES.length - 1;
    const next = ORDER.find((lid) => lessonStatus(lid) === 'current');
    openSlip(`
      <div class="result-hero">
        <div class="anim-pop" style="display:inline-grid;place-items:center;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f0d48a,#c9a25e 60%,#8a6b30);color:#3a2810;margin-bottom:10px">${icon(L.exam ? 'trophy' : 'check', 30)}</div>
        <div class="slip-title">${L.exam ? '认证通过 · 牌室认证' : '本课已掌握'}</div>
        <div class="slip-sub">${esc(L.title)} · 得分 ${score}/${L.quiz.length}</div>
      </div>
      <div class="row gap-8" style="justify-content:center"><span class="stamp">${icon('check', 12)} 钢印已落</span>${gain ? `<span class="stamp">+${gain} ELO</span>` : ''}${newStage ? `<span class="stamp">${icon('sparkles', 12)} 新阶段解锁</span>` : ''}</div>
      ${newStage ? `<div class="slip-body mt-12" style="text-align:center">${STAGES[si + 1].name} 已开放 —— ${STAGES[si + 1].sub}。</div>` : ''}
      <div class="slip-body mt-12" style="text-align:center">${esc(MENTORS[state.mentor].name)}：「${L.exam ? '从今天起，你可以独立复盘任何一手牌。' : '掌握不是记住，是能在牌桌上用出来。下一课见。'}」</div>
      <div class="slip-actions" style="justify-content:center">
        ${next ? `<button class="btn btn-brass" data-action="open-lesson" data-id="${next}">${icon('arrow-right', 15)} 下一课 · ${esc(LESSONS[next].title)}</button>` : `<button class="btn btn-brass" data-action="nav" data-to="#/progress">${icon('chart', 15)} 查看成长</button>`}
        <button class="btn btn-quiet" data-action="nav" data-to="#/home">返回路径</button>
      </div>`, { wide: false });
  }

  /* ===== 视图：训练（范围 / 速训） ===== */
  let session = null;
  let timerId = null;
  function startSession(mode) {
    clearTimer();
    const ids = mode === 'quick' ? QUICK_SET : DRILL_SET;
    session = { mode, ids, idx: 0, answers: [], timeLeft: 20 };
  }
  function clearTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function viewDrill(mode) {
    if (!session || session.mode !== mode) startSession(mode);
    const q = QUESTIONS.find((x) => x.id === session.ids[session.idx]);
    const pips = session.ids.map((_, i) => `<span class="drill-pip ${i < session.idx ? 'done' : i === session.idx ? 'now' : ''}"></span>`).join('');
    const answered = session.answers[session.idx];
    return `
    <div class="drill-top">
      <button class="back-link" data-action="drill-quit">${icon('chevron-left', 15)} 退出</button>
      <span class="pill active">${mode === 'quick' ? icon('zap', 13) + ' 每日速训' : icon('grid', 13) + ' 范围训练'}</span>
      <div class="drill-progress">${pips}</div>
      <span class="muted font-numeric" style="font-size:11px">${session.idx + 1}/${session.ids.length}</span>
      <span class="grow"></span>
      ${mode === 'quick' ? `<span class="timer ${session.timeLeft <= 5 ? 'urgent' : ''}" id="drill-timer">${icon('clock', 14)} <span id="timer-num">${session.timeLeft}</span>s</span>` : ''}
    </div>
    <div class="drill-layout">
      <div class="scenario-card anim-deal">
        <div class="scenario-head"><span class="pos-badge">${q.pos}</span><span class="scenario-street">${esc(q.street)}</span></div>
        <div class="hole-cards">${q.cards.map((c) => cardHTML(c[0], c[1])).join('')}</div>
        ${q.board ? `<div class="board-cards">${q.board.map((c) => cardHTML(c[0], c[1], 'sm')).join('')}</div>` : ''}
        <div class="scenario-meta">
          <div class="meta-item"><span class="meta-label">底池</span><span class="meta-value">${esc(q.pot)}</span></div>
          <div class="meta-item"><span class="meta-label">有效筹码</span><span class="meta-value">${esc(q.stack)}</span></div>
          <div class="meta-item"><span class="meta-label">模式</span><span class="meta-value">${mode === 'quick' ? '限时' : '标准'}</span></div>
        </div>
        <div class="scenario-note">${esc(q.note)}</div>
      </div>
      <div class="panel question-card" id="qcard">${questionCardHTML(q, answered)}</div>
    </div>
    <div class="strip-grid mt-16" id="session-strip">${sessionStripHTML()}</div>`;
  }
  function sessionStripHTML() {
    if (!session) return '';
    const ans = session.answers.filter((a) => a !== undefined);
    const counts = {};
    let evSum = 0;
    ans.forEach((a) => { const g = gradeOf(a.ev).id; counts[g] = (counts[g] || 0) + 1; evSum += a.ev; });
    const correct = ans.filter((a) => a.ev === 0).length;
    const acc = ans.length ? Math.round((correct / ans.length) * 100) : 0;
    const tally = GRADES.filter((g) => counts[g.id]).map((g) => `<span class="tag tag-${g.id === 'best' ? 'moss' : g.id === 'good' ? 'brass' : g.id === 'ok' ? 'sage' : 'terra'}">${g.name} ×${counts[g.id]}</span>`).join('') || '<span class="empty-note">作答后实时统计</span>';
    const last = ans[ans.length - 1];
    const tips = {
      best: '保持。+EV 的动作重复一千次，就是风格。',
      good: '方向对了，尺寸和频率再抠一层。',
      ok: '不亏不赚的动作，长期是漏水的缝。',
      wrong: '先问赔率，再问感觉。错题已进复习队列。',
      blunder: '停三秒。把这条 EV 损失记进复盘本。',
    };
    const tip = last ? (last.timeout ? '时间也是决策的一部分：速训练的就是直觉校准。' : tips[gradeOf(last.ev).id]) : '每答一题，这里会给出累计评级与 EV 账单——反馈即教学。';
    const m = MENTORS[state.mentor];
    return `
      <div class="panel"><div class="panel-head"><span class="panel-title">${icon('chart', 16)} 本组评级</span></div><div class="grade-tally">${tally}</div><div class="muted mt-12" style="font-size:10px">已答 ${ans.length}/${session.ids.length} · 正确率 ${acc}%</div></div>
      <div class="panel"><div class="panel-head"><span class="panel-title">${icon('sigma', 16)} EV 账单</span></div><div class="strip-value font-numeric ${evSum > 0 ? 'danger-text' : 'success-text'}">${evSum > 0 ? '−' + evSum.toFixed(1) : '0.0'}</div><div class="muted mt-8" style="font-size:10px">累计 EV 损失 · 越低越好</div></div>
      <div class="panel"><div class="panel-head"><span class="panel-title">${icon('user', 16)} ${esc(m.name)} · ${m.style}</span></div><div class="mentor-quote">${esc(tip)}</div></div>`;
  }
  function questionCardHTML(q, answered) {
    const opts = q.opts.map((o, oi) => {
      if (o.ev >= 99) return `<button class="act-btn act-call" disabled style="opacity:.35"><span>${esc(o.label)}</span><small>${esc(o.sub)}</small></button>`;
      const cls = oi === 0 ? 'act-fold' : oi === 1 ? 'act-call' : 'act-raise';
      let extra = '';
      if (answered !== undefined) {
        extra = answered.opt === oi ? (o.ev === 0 ? ' is-correct' : ' is-wrong') : '';
        return `<button class="act-btn ${cls}${extra}" disabled><span>${esc(o.label)}</span><small>${esc(o.sub)}</small></button>`;
      }
      return `<button class="act-btn ${cls}" data-action="drill-answer" data-opt="${oi}"><span>${esc(o.label)}</span><small>${esc(o.sub)}</small></button>`;
    }).join('');
    let feedback = '';
    if (answered !== undefined) {
      const g = gradeOf(answered.ev);
      const best = q.opts.reduce((a, b) => (a.ev <= b.ev ? a : b));
      const picked = q.opts[answered.opt];
      feedback = `<div class="feedback grade-${g.id} ${g.id === 'best' ? 'anim-pop' : answered.ev > 1.5 ? 'anim-shake' : ''}">
        <div class="grade-head"><span class="grade-icon">${icon(g.icon, 18)}</span><span class="grade-name font-display">${g.name}</span><span class="grade-ev font-numeric">${answered.ev === 0 ? 'EV 损失 0' : `EV −${answered.ev.toFixed(1)}${q.kind === 'preflop' ? 'bb' : ''}`}</span></div>
        <div class="grade-comment">${esc(q.explain)}</div>
        ${answered.ev > 0 ? `<div class="comparison"><div class="cmp-col"><div class="cmp-label">你的决策</div><div class="cmp-value">${esc(picked.label)} ${esc(picked.sub)}</div></div><div class="cmp-col gto"><div class="cmp-label">GTO 最优</div><div class="cmp-value">${esc(best.label)} ${esc(best.sub)}</div></div></div>` : ''}
        <button class="related-chip" data-action="open-lesson" data-id="${q.lesson}">${icon('external', 12)} 相关课程 · ${esc(LESSONS[q.lesson].title)}</button>
        <div class="feedback-actions">
          <span class="muted" style="font-size:10px">${answered.timeout ? '超时未答 · 已按最劣动作计' : '反馈即教学：先懂为什么，再下一题'}</span>
          <span class="grow"></span>
          <button class="btn btn-brass btn-sm" data-action="drill-next">${session.idx + 1 >= session.ids.length ? '查看结算' : '下一题'} ${icon('arrow-right', 14)}</button>
        </div>
      </div>`;
    }
    return `<div class="question-text">${esc(q.q)}</div><div class="action-row">${opts}</div>${feedback}`;
  }
  function answerDrill(oi, timeout = false) {
    if (!session || session.answers[session.idx] !== undefined) return;
    clearTimer();
    const q = QUESTIONS.find((x) => x.id === session.ids[session.idx]);
    session.answers[session.idx] = { opt: oi, ev: q.opts[oi].ev, timeout };
    document.getElementById('qcard').innerHTML = questionCardHTML(q, session.answers[session.idx]);
    const strip = document.getElementById('session-strip');
    if (strip) strip.innerHTML = sessionStripHTML();
    const timerEl = document.getElementById('drill-timer');
    if (timerEl) timerEl.classList.remove('urgent');
  }
  function nextDrill() {
    if (!session) return;
    if (session.idx + 1 >= session.ids.length) return drillSummary();
    session.idx += 1;
    session.timeLeft = 20;
    render();
    startQuickTimer();
  }
  function startQuickTimer() {
    clearTimer();
    if (!session || session.mode !== 'quick') return;
    timerId = setInterval(() => {
      if (!session) return clearTimer();
      session.timeLeft -= 1;
      const num = document.getElementById('timer-num');
      const wrap = document.getElementById('drill-timer');
      if (num) num.textContent = session.timeLeft;
      if (wrap && session.timeLeft <= 5) wrap.classList.add('urgent');
      if (session.timeLeft <= 0) {
        const q = QUESTIONS.find((x) => x.id === session.ids[session.idx]);
        const worst = q.opts.reduce((a, b, i) => (b.ev > q.opts[a].ev && b.ev < 99 ? i : a), 0);
        answerDrill(worst, true);
      }
    }, 1000);
  }
  function drillSummary() {
    clearTimer();
    const answers = session.answers;
    const total = answers.length;
    const correct = answers.filter((a) => a.ev === 0).length;
    const acc = Math.round((correct / total) * 100);
    const counts = {};
    let eloDelta = 0;
    const DELTA = { best: 4, good: 2, ok: 0, wrong: -3, blunder: -6 };
    answers.forEach((a) => { const g = gradeOf(a.ev).id; counts[g] = (counts[g] || 0) + 1; eloDelta += DELTA[g]; });
    const mode = session.mode;
    const newSrs = [];
    answers.forEach((a, i) => {
      if (a.ev > 1.5) {
        const q = QUESTIONS.find((x) => x.id === session.ids[i]);
        newSrs.push({ front: q.q.length > 22 ? q.q.slice(0, 22) + '…' : q.q, meta: '间隔 1 天 · 新错题' });
      }
    });
    const wasToday = state.week[4] === 1;
    mutate((s) => {
      s.elo = Math.max(800, s.elo + eloDelta);
      s.eloHistory.push(s.elo);
      if (s.eloHistory.length > 14) s.eloHistory.shift();
      s.sessions += 1;
      s.accuracy7[6] = acc;
      s.tasks.drill = true;
      s.tasks.srs = true;
      if (!wasToday) { s.week[4] = 1; s.streakDays += 1; }
      answers.forEach((a, i) => {
        const q = QUESTIONS.find((x) => x.id === session.ids[i]);
        const dim = q.kind === 'odds' ? 'odds' : q.kind === 'gto' || q.kind === 'puzzle' ? 'gto' : 'preflop';
        s.dims[dim] = Math.min(100, s.dims[dim] + (a.ev === 0 ? 3 : a.ev <= 1.5 ? 1 : 0));
      });
      s.srs = s.srs.concat(newSrs).slice(0, 8);
      if (s.dims.odds >= 60 && !s.achievements.includes('odds-master')) s.achievements.push('odds-master');
      if (s.streakDays >= 3 && !s.achievements.includes('streak-3')) s.achievements.push('streak-3');
      s.lastDrill = { acc, eloDelta, at: Date.now() };
    });
    const gradeChips = GRADES.filter((g) => counts[g.id]).map((g) => `<span class="result-grade"><i style="background:${PAPER_GRADE_COLOR[g.id]}"></i>${g.name} ×${counts[g.id]}</span>`).join('');
    const mentor = MENTORS[state.mentor];
    openSlip(`
      <div class="result-hero">
        <div class="result-acc font-numeric" data-count="${acc}">${acc}%</div>
        <div class="result-acc-label">本组正确率 · ${correct}/${total}</div>
      </div>
      <div class="result-grades">${gradeChips}</div>
      <div class="result-stats">
        <div class="result-stat"><div class="result-stat-value ${eloDelta >= 0 ? 'up' : ''} font-numeric">${eloDelta >= 0 ? '+' : ''}${eloDelta}</div><div class="result-stat-label">ELO</div></div>
        <div class="result-stat"><div class="result-stat-value font-numeric">${state.streakDays}</div><div class="result-stat-label">连续天数</div></div>
        <div class="result-stat"><div class="result-stat-value font-numeric">+${newSrs.length}</div><div class="result-stat-label">复习卡片</div></div>
      </div>
      <div class="row gap-8 mt-12" style="justify-content:center">${!wasToday ? `<span class="stamp">${icon('flame', 12)} 今日打卡成功</span>` : `<span class="stamp">${icon('check', 12)} 今日已打卡</span>`}${newSrs.length ? `<span class="stamp">${icon('refresh', 12)} 错题已入 SRS</span>` : ''}</div>
      <hr class="hairline">
      <div class="slip-body" style="text-align:center">${esc(mentor.name)}：「${acc >= 80 ? '稳定的 +EV 来自稳定的纪律。明天同一时间，这张桌子等你。' : acc >= 50 ? '错的那几手，正是明天复习队列里等你的人。' : '别急，把错题的解释读一遍——理解比正确率先到。'}」</div>
      <div class="slip-actions" style="justify-content:center">
        <button class="btn btn-brass" data-action="drill-restart" data-mode="${mode}">${icon('refresh', 15)} 再来一组</button>
        <button class="btn btn-quiet" data-action="nav" data-to="#/home">返回路径</button>
        <button class="btn btn-quiet" data-action="nav" data-to="#/progress">查看成长</button>
      </div>`);
    session = null;
    location.hash = '#/home';
  }

  /* ===== 视图：进度中心 ===== */
  function viewProgress() {
    const nextAt = nextRankAt(state.elo);
    const lo = 1000, hi = 1400;
    const pct = Math.max(0, Math.min(1, (state.elo - lo) / (hi - lo)));
    const mPct = Math.max(0, Math.min(1, (nextAt - lo) / (hi - lo)));
    const hist = state.eloHistory;
    const min = Math.min(...hist) - 20, max = Math.max(...hist) + 20;
    const W = 560, H = 150;
    const pts = hist.map((v, i) => [20 + (i / (hist.length - 1)) * (W - 40), H - 20 - ((v - min) / (max - min)) * (H - 40)]);
    const line = pts.map((p) => p.join(',')).join(' ');
    const area = `20,${H - 20} ${line} ${W - 20},${H - 20}`;
    const gridLines = [0.25, 0.5, 0.75].map((f) => `<line x1="20" x2="${W - 20}" y1="${20 + f * (H - 40)}" y2="${20 + f * (H - 40)}" stroke="rgba(201,162,94,0.08)"/>`).join('');
    const weak = weakestDim();
    const dims = Object.keys(state.dims).map((k) => `<div class="dim-row"><span class="dim-name">${DIM_NAMES[k]}${k === weak ? ' <span class="tag tag-terra">弱项</span>' : ''}</span><div class="dim-bar"><div class="dim-fill ${k === weak ? 'weak' : ''}" style="width:${state.dims[k]}%"></div></div><span class="dim-val">${state.dims[k]}</span></div>`).join('');
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const prevWeek = [1, 1, 2, 1, 1, 1, 1];
    const calCells = prevWeek.concat(state.week).map((v, i) => {
      const cls = v === 2 ? 'freeze' : v === 1 ? (i === 11 ? 'today' : 'done') : i === 11 ? 'today' : '';
      return `<div class="cal-cell ${cls}"><span class="cal-dot"></span><span class="cal-day">${days[i % 7]}</span></div>`;
    }).join('');
    const srsItems = state.srs.map((s) => `<div class="srs-item"><span class="srs-icon">${icon('refresh', 13)}</span><div class="grow"><div class="srs-front">${esc(s.front)}</div><div class="srs-meta">${esc(s.meta)}</div></div><span class="tag tag-sage srs-due">到期</span></div>`).join('');
    const achv = ACHIEVEMENTS.map((a) => {
      const got = state.achievements.includes(a.id);
      return `<div class="achv ${got ? '' : 'locked'}"><span class="achv-medal ${got ? a.medal : 'locked'}">${icon(got ? a.icon : 'lock', 20)}</span><span class="achv-name">${a.name}</span></div>`;
    }).join('');
    const m = MENTORS[state.mentor];
    const moodCls = { good: 'active-good', ok: 'active-ok', bad: 'active-bad' };
    return `
    <div class="rank-hero anim-slide-up">
      <div class="plaque rank-plaque"><div class="plaque-value font-numeric" data-count="${state.elo}">${state.elo}</div><div class="plaque-label">ELO 能力分</div><div class="plaque-sub">${rankName(state.elo)}</div></div>
      <div class="rank-body">
        <div class="rank-name font-display">${rankName(state.elo)} 牌手</div>
        <div class="rank-next">距${rankName(nextAt)}还需 <span class="brass font-numeric">${nextAt - state.elo}</span> ELO · 里程碑已标注</div>
        <div class="progress-track elo-track"><div class="progress-fill" style="width:${pct * 100}%"></div><span class="milestone" style="left:${mPct * 100}%"></span><span class="milestone-label" style="left:${mPct * 100}%">${nextAt}</span></div>
      </div>
      <div class="rank-stats">
        <div class="stat"><span class="stat-value font-numeric" data-count="${state.sessions}">${state.sessions}</span><span class="stat-label">总训练</span></div>
        <div class="stat"><span class="stat-value font-numeric">${avgAccuracy()}%</span><span class="stat-label">平均正确率</span></div>
        <div class="stat"><span class="stat-value font-numeric" data-count="${state.streakDays}">${state.streakDays}</span><span class="stat-label">连续天数</span></div>
        <div class="stat"><span class="stat-value font-numeric">${state.achievements.length}</span><span class="stat-label">成就</span></div>
      </div>
    </div>
    <div class="grid-even stagger">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('chart', 18)} ELO 趋势 · 近 ${hist.length} 次</span></div>
        <svg class="chart-svg" viewBox="0 0 ${W} ${H}">
          ${gridLines}
          <polygon points="${area}" fill="rgba(201,162,94,0.1)"/>
          <polyline points="${line}" fill="none" stroke="var(--brass-bright)" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="3.5" fill="var(--brass-bright)"/>
          <text x="20" y="12" fill="var(--ivory-muted)" font-size="9" font-family="JetBrains Mono,monospace">${max}</text>
          <text x="20" y="${H - 6}" fill="var(--ivory-muted)" font-size="9" font-family="JetBrains Mono,monospace">${min}</text>
          <text x="${W - 20}" y="${pts[pts.length - 1][1] - 8}" text-anchor="end" fill="var(--brass-text)" font-size="10" font-family="JetBrains Mono,monospace">${state.elo}</text>
        </svg>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('target', 18)} 五维能力</span><span class="grow"></span><span class="eyebrow">弱项优先训练</span></div>
        ${dims}
        <button class="btn btn-quiet btn-sm btn-block mt-12" data-action="start-drill" data-mode="range">${icon('target', 14)} 针对弱项开始训练</button>
      </div>
    </div>
    <div class="grid-even mt-16 stagger">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('flame', 18)} 14 日打卡</span><span class="grow"></span><span class="freeze-chip">${icon('snowflake', 12)} ${state.freeze}</span></div>
        <div class="calendar">${calCells}</div>
        <div class="muted mt-12" style="font-size:10px">冻结卡可在断档日自动保护连击 · 奖励坚持，不惩罚中断</div>
      </div>
      <div class="panel panel-live">
        <div class="panel-head"><span class="panel-title">${icon('refresh', 18)} SRS 复习队列</span><span class="grow"></span><span class="live-dot"></span></div>
        ${srsItems || '<div class="empty-note">队列为空</div>'}
        <button class="btn btn-quiet btn-sm btn-block mt-12" data-action="start-drill" data-mode="range">${icon('refresh', 14)} 开始复习</button>
      </div>
    </div>
    <div class="grid-even mt-16 stagger">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('trophy', 18)} 成就墙</span></div>
        <div class="achv-row">${achv}</div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${icon('heart', 18)} 情绪签到 · 导师</span></div>
        <div class="mood-row mb-12">
          <button class="mood-btn ${state.mood === 'good' ? moodCls.good : ''}" data-action="mood" data-mood="good">${icon('smile', 20)} 冷静</button>
          <button class="mood-btn ${state.mood === 'ok' ? moodCls.ok : ''}" data-action="mood" data-mood="ok">${icon('meh', 20)} 一般</button>
          <button class="mood-btn ${state.mood === 'bad' ? moodCls.bad : ''}" data-action="mood" data-mood="bad">${icon('frown', 20)} 上头</button>
        </div>
        <div class="mentor-quote-card">
          <span class="mentor-avatar ${state.mentor}" style="width:38px;height:38px;flex-shrink:0">${icon(m.icon, 17)}</span>
          <div><div class="mentor-quote">${esc(m.quote)}</div><div class="mentor-quote-name">${esc(m.name)} · ${m.style}</div></div>
        </div>
        <button class="btn btn-quiet btn-sm btn-block mt-12" data-action="open-settings">${icon('settings', 14)} 更换导师 / 牌室设置</button>
      </div>
    </div>`;
  }

  /* ===== 纸条浮层 ===== */
  const slipRoot = () => document.getElementById('slip-root');
  function openSlip(html, opts = {}) {
    slipRoot().innerHTML = `<div class="slip-overlay" data-action="slip-backdrop"><div class="dealer-slip" role="dialog" aria-modal="true" style="${opts.wide ? 'width:min(680px,100%)' : ''}"><button class="slip-close" data-action="slip-close" aria-label="关闭">${icon('x', 16)}</button>${html}</div></div>`;
    const first = slipRoot().querySelector('.btn, .mentor-card, .pill');
    if (first) first.focus();
    countUpAll(slipRoot());
  }
  function closeSlip() { slipRoot().innerHTML = ''; }
  function welcomeSlip() {
    const mentors = Object.entries(MENTORS).map(([id, m]) => `<button class="mentor-card ${state.mentor === id ? 'active' : ''}" data-action="mentor-pick" data-mentor="${id}"><span class="mentor-avatar ${id}">${icon(m.icon, 19)}</span><span><span class="mentor-name" style="display:block">${m.name}</span><span class="mentor-style">${m.style}</span></span></button>`).join('');
    openSlip(`
      <div class="slip-title">欢迎落座 · 牌室学院</div>
      <div class="slip-sub">发牌员递给你一张纸条：选一位导师，定一个每日目标，然后开局。</div>
      <hr class="hairline">
      <div class="slip-body"><strong style="color:var(--paper-ink)">你的导师</strong>（可随时在设置中更换）</div>
      <div class="mentor-row">${mentors}</div>
      <div class="slip-body"><strong style="color:var(--paper-ink)">每日目标</strong> · 小目标保护连击，冻结卡为你兜底</div>
      <div class="goal-pills">${[3, 5, 10].map((g) => `<button class="pill ${state.goal === g ? 'active' : ''}" data-action="goal-pick" data-goal="${g}">${g} 分钟</button>`).join('')}</div>
      <div class="slip-actions"><button class="btn btn-brass btn-block" data-action="welcome-done">${icon('spade', 16)} 落座开局</button></div>`);
  }
  function lockedSlip(id) {
    const si = STAGES.findIndex((s) => s.lessons.includes(id));
    openSlip(`
      <div class="slip-title">${icon('lock', 18)} 课程尚未解锁</div>
      <div class="slip-sub">${esc(LESSONS[id].title)} · ${STAGES[si].name}</div>
      <div class="slip-body">掌握学习原则：先完成前置阶段的全部课程与课后检验，再进入下一段。${STAGES[si].gate}。<br><br>这不是限制，是脚手架——每一段都只比你现在的能力高一步。</div>
      <div class="slip-actions"><button class="btn btn-brass" data-action="open-lesson" data-id="${currentLesson()}">${icon('arrow-right', 15)} 回到当前课程</button><button class="btn btn-quiet" data-action="slip-close">关闭</button></div>`);
  }
  function settingsSlip() {
    const m = state.mentor;
    openSlip(`
      <div class="slip-title">牌室设置</div>
      <div class="slip-sub">同一间牌室，你来掌灯。</div>
      <div class="settings-row"><div class="grow"><div class="settings-label">主题</div><div class="settings-desc">暗色牌室 / 白天牌室（拉开窗帘）</div></div>
        <div class="seg"><button data-action="set-theme" data-theme="dark" class="${state.theme === 'dark' ? 'active' : ''}">${icon('moon', 13)} 暗</button><button data-action="set-theme" data-theme="light" class="${state.theme === 'light' ? 'active' : ''}">${icon('sun', 13)} 亮</button></div></div>
      <div class="settings-row"><div class="grow"><div class="settings-label">导师</div><div class="settings-desc">反馈寄语的人格</div></div>
        <div class="seg">${Object.entries(MENTORS).map(([id, mm]) => `<button data-action="mentor-pick" data-mentor="${id}" class="${m === id ? 'active' : ''}">${mm.name}</button>`).join('')}</div></div>
      <div class="settings-row"><div class="grow"><div class="settings-label">动效</div><div class="settings-desc">发牌、 pop、辉光等状态动效</div></div><button class="switch ${state.motion ? 'on' : ''}" data-action="toggle-motion" aria-label="切换动效"></button></div>
      <div class="settings-row"><div class="grow"><div class="settings-label">演示解锁</div><div class="settings-desc">跳过掌握门禁，预览全部阶段（调试用）</div></div><button class="switch ${state.demoUnlock ? 'on' : ''}" data-action="toggle-demo" aria-label="切换演示解锁"></button></div>
      <div class="settings-row"><div class="grow"><div class="settings-label">重置演示数据</div><div class="settings-desc">回到种子状态并重新体验引导</div></div><button class="btn btn-fold btn-sm" data-action="reset-data">${icon('refresh', 13)} 重置</button></div>`);
  }

  /* ===== Toast ===== */
  let toastTimer = null;
  function toast(msg, ic = 'info') {
    const root = document.getElementById('toast-root');
    root.innerHTML = `<div class="toast">${icon(ic, 15)} ${esc(msg)}</div>`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { root.innerHTML = ''; }, 2600);
  }

  /* ===== 路由与壳层 ===== */
  const NAV = [
    { group: '01 · 学习', items: [{ to: '#/home', icon: 'home', label: '学习路径' }, { to: '#/lesson', icon: 'book', label: '课程学习' }] },
    { group: '02 · 训练', items: [{ to: '#/drill', icon: 'grid', label: '范围训练' }, { to: '#/quick', icon: 'zap', label: '每日速训' }] },
    { group: '03 · 数据', items: [{ to: '#/progress', icon: 'chart', label: '进度中心' }] },
    { group: '04 · 设置', items: [{ to: '#settings', icon: 'settings', label: '牌室设置' }] },
  ];
  const TITLES = { home: ['00', '学习路径'], lesson: ['01', '课程学习'], drill: ['02', '范围训练'], quick: ['02', '每日速训'], progress: ['03', '进度中心'] };
  function route() {
    const h = location.hash || '#/home';
    const parts = h.replace('#/', '').split('/');
    return { name: parts[0] || 'home', arg: parts[1] };
  }
  function renderShell() {
    const r = route();
    const t = TITLES[r.name] || TITLES.home;
    document.getElementById('topbar-num').textContent = t[0];
    document.getElementById('page-title').textContent = t[1];
    document.getElementById('streak-badge-num').textContent = state.streakDays;
    const navHTML = NAV.map((g) => `<div class="nav-section"><div class="nav-section-label"><span class="nav-num">${g.group.split(' ')[0]}</span><span class="eyebrow">${g.group.split('· ')[1]}</span></div>${g.items.map((it) => {
      const active = it.to === '#/lesson' ? r.name === 'lesson' : it.to === '#settings' ? false : r.name === it.to.replace('#/', '');
      if (it.to === '#settings') return `<button class="nav-item" data-action="open-settings"><span class="nav-icon">${icon(it.icon, 18)}</span><span>${it.label}</span></button>`;
      const to = it.to === '#/lesson' ? `#/lesson/${currentLesson()}` : it.to;
      return `<button class="nav-item ${active ? 'active' : ''}" data-action="nav" data-to="${to}"><span class="nav-icon">${icon(it.icon, 18)}</span><span>${it.label}</span>${active ? '<span class="dealer-dot">D</span>' : ''}</button>`;
    }).join('')}</div>`).join('');
    document.getElementById('nav-groups').innerHTML = navHTML;
    const mnav = [
      { to: '#/home', icon: 'home', label: '路径', name: 'home' },
      { to: `#/lesson/${currentLesson()}`, icon: 'book', label: '课程', name: 'lesson' },
      { to: '#/drill', icon: 'grid', label: '训练', name: 'drill' },
      { to: '#/quick', icon: 'zap', label: '速训', name: 'quick' },
      { to: '#/progress', icon: 'chart', label: '进度', name: 'progress' },
    ].map((it) => `<button class="mnav-item ${r.name === it.name ? 'active' : ''}" data-action="nav" data-to="${it.to}">${icon(it.icon, 20)}<span>${it.label}</span><span class="mnav-dot"></span></button>`).join('');
    document.getElementById('mobile-nav').innerHTML = mnav;
    document.getElementById('theme-btn').innerHTML = icon(state.theme === 'dark' ? 'sun' : 'moon', 18);
  }
  function render() {
    clearTimer();
    const r = route();
    const view = document.getElementById('view');
    view.classList.toggle('view-wide', false);
    if (r.name === 'lesson') view.innerHTML = viewLesson(r.arg || currentLesson());
    else if (r.name === 'drill') view.innerHTML = viewDrill('range');
    else if (r.name === 'quick') view.innerHTML = viewDrill('quick');
    else if (r.name === 'progress') view.innerHTML = viewProgress();
    else view.innerHTML = viewHome();
    renderShell();
    countUpAll(view);
    window.scrollTo({ top: 0 });
    updateReadingBar();
    if ((r.name === 'drill' || r.name === 'quick') && session && session.answers[session.idx] === undefined) startQuickTimer();
  }

  function applyPrefs() {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.motion = state.motion ? 'on' : 'off';
  }
  function updateReadingBar() {
    const bar = document.getElementById('reading-bar');
    if (route().name !== 'lesson' || window.innerWidth >= 768) { bar.style.width = '0'; return; }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }

  /* ===== 事件委托 ===== */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    switch (a) {
      case 'nav': closeSlip(); location.hash = el.dataset.to; break;
      case 'open-lesson': {
        const id = el.dataset.id;
        if (lessonStatus(id) === 'locked') { lockedSlip(id); break; }
        closeSlip();
        location.hash = `#/lesson/${id}`;
        break;
      }
      case 'quiz-opt': handleQuizOpt(Number(el.dataset.q), Number(el.dataset.opt)); break;
      case 'quiz-retry': render(); break;
      case 'lesson-complete': completeLesson(el.dataset.id, Number(el.dataset.score)); renderShell(); break;
      case 'start-drill': closeSlip(); startSession(el.dataset.mode || 'range'); location.hash = el.dataset.mode === 'quick' ? '#/quick' : '#/drill'; if (route().name === (el.dataset.mode === 'quick' ? 'quick' : 'drill')) render(); break;
      case 'drill-answer': answerDrill(Number(el.dataset.opt)); break;
      case 'drill-next': nextDrill(); break;
      case 'drill-quit': clearTimer(); session = null; location.hash = '#/home'; break;
      case 'drill-restart': closeSlip(); startSession(el.dataset.mode); location.hash = el.dataset.mode === 'quick' ? '#/quick' : '#/drill'; render(); break;
      case 'mood': {
        const mood = el.dataset.mood;
        mutate((s) => { s.mood = mood; });
        render();
        toast(mood === 'bad' ? '已记录 · 上头时先离桌 5 分钟，这是 +EV 的第一步' : mood === 'ok' ? '已记录 · 平稳的心态是长期赢率的底座' : '已记录 · 冷静是最好的筹码', 'heart');
        break;
      }
      case 'open-settings': settingsSlip(); break;
      case 'slip-close': closeSlip(); break;
      case 'slip-backdrop': if (e.target === el) closeSlip(); break;
      case 'mentor-pick': mutate((s) => { s.mentor = el.dataset.mentor; }); if (document.querySelector('.mentor-row')) welcomeSlip(); else settingsSlip(); renderShell(); break;
      case 'goal-pick': mutate((s) => { s.goal = Number(el.dataset.goal); }); welcomeSlip(); break;
      case 'welcome-done': mutate((s) => { s.onboarded = true; if (!s.achievements.includes('first-seat')) s.achievements.push('first-seat'); }); closeSlip(); toast(`欢迎落座 · 导师${MENTORS[state.mentor].name}已就位`, 'spade'); break;
      case 'set-theme': mutate((s) => { s.theme = el.dataset.theme; }); applyPrefs(); settingsSlip(); renderShell(); break;
      case 'toggle-theme': mutate((s) => { s.theme = s.theme === 'dark' ? 'light' : 'dark'; }); applyPrefs(); renderShell(); break;
      case 'toggle-motion': mutate((s) => { s.motion = !s.motion; }); applyPrefs(); settingsSlip(); break;
      case 'toggle-demo': mutate((s) => { s.demoUnlock = !s.demoUnlock; }); settingsSlip(); toast(state.demoUnlock ? '演示解锁已开启 · 全部阶段可预览' : '演示解锁已关闭 · 恢复掌握门禁', 'lock'); render(); break;
      case 'reset-data': localStorage.removeItem(LS_KEY); location.hash = '#/home'; location.reload(); break;
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSlip(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('scroll', updateReadingBar, { passive: true });
  window.addEventListener('resize', updateReadingBar, { passive: true });

  /* ===== 启动 ===== */
  applyPrefs();
  if (!location.hash) location.hash = '#/home';
  render();
  if (!state.onboarded) setTimeout(welcomeSlip, 450);
})();