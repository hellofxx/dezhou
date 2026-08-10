"""Append Help Center CSS block to src/styles/globals.css (UTF-8 safe)."""

from pathlib import Path

GLOBALS = Path('src/styles/globals.css')

BLOCK = r'''
/* =========================================================
   Help Center（2026-08-10）— 签名元素「House Rules 立牌」
   Hero 同家族（academy-hero / theory-hero / rank-plaque-hero），
   差异化：立体倾斜立牌 + 黄铜底座阴影 + 象牙卡面。
   ========================================================= */

.help-hero {
  position: relative;
  overflow: hidden;
  padding: 22px 26px 26px;
  background:
    radial-gradient(ellipse 70% 150% at 0% 0%, rgba(201,162,94,0.08), transparent 60%),
    linear-gradient(180deg, var(--walnut) 0%, var(--felt-deep) 100%);
}
.help-hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 32px;
  align-items: center;
}
.help-hero-copy { min-width: 0; }
.help-hero-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--ivory);
  line-height: 1.25;
  margin: 8px 0 6px;
  letter-spacing: 0.01em;
  font-variation-settings: 'opsz' 144;
}
.help-hero-sub {
  font-size: 13px;
  color: var(--ivory-dim);
  line-height: 1.6;
  max-width: 460px;
}
.help-hero-actions {
  display: flex; align-items: center; gap: 14px;
  margin-top: 18px; flex-wrap: wrap;
}
.help-hero-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px;
  border-radius: var(--poker-radius-md);
  background: linear-gradient(180deg, var(--brass-bright) 0%, var(--brass) 100%);
  color: var(--primary-foreground);
  font-size: 13px; font-weight: 600;
  border: 1px solid var(--brass-dark);
  box-shadow: 0 3px 10px rgba(201,162,94,0.25), inset 0 1px 0 rgba(255,240,200,0.55);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  cursor: pointer;
  min-height: 38px;
}
.help-hero-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(201,162,94,0.32), inset 0 1px 0 rgba(255,240,200,0.55);
}
.help-hero-meta {
  font-size: 11px; color: var(--ivory-muted);
  letter-spacing: 0.05em;
}

/* ---- House Rules 立牌（签名元素） ---- */
.help-hero-plaque-wrap {
  position: relative;
  perspective: 900px;
  display: flex; flex-direction: column; align-items: center;
  padding-top: 6px;
}
.house-rules-card {
  position: relative;
  width: 100%;
  max-width: 320px;
  padding: 18px 18px 16px;
  background: linear-gradient(180deg, var(--stable-ivory) 0%, #e8dcc0 100%);
  border: 1px solid rgba(201,162,94,0.6);
  border-radius: var(--poker-radius-md);
  box-shadow:
    0 12px 32px rgba(0,0,0,0.45),
    inset 0 0 0 3px rgba(255,255,255,0.42),
    inset 0 0 0 4px rgba(201,162,94,0.3);
  color: var(--stable-ink);
  transform: rotateY(-7deg) rotateX(2deg);
  transform-origin: 50% 100%;
  transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);
}
.help-hero-plaque-wrap:hover .house-rules-card,
.help-hero-plaque-wrap:focus-within .house-rules-card {
  transform: rotateY(-2deg) rotateX(1deg);
}
.house-rules-rail {
  position: absolute;
  top: 6px; left: 14px; right: 14px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,162,94,0.7), transparent);
}
.house-rules-eyebrow {
  font-family: var(--font-display);
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--brass-dark);
  text-align: center;
  margin-bottom: 4px;
}
.house-rules-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(160,125,61,0.5), transparent);
  margin: 0 auto 12px;
  width: 60%;
}
.house-rules-list {
  display: flex; flex-direction: column; gap: 6px;
  padding: 0; margin: 0;
}
.house-rules-list > li { list-style: none; }
.house-rules-item {
  display: flex; align-items: flex-start; gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(201,162,94,0.2);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--stable-ink);
  min-height: 40px;
}
.house-rules-item:hover {
  background: rgba(255,255,255,0.7);
  border-color: rgba(160,125,61,0.5);
  transform: translateX(2px);
  box-shadow: 0 2px 6px rgba(160,125,61,0.18);
}
.house-rules-item:focus-visible {
  outline: 2px solid var(--brass);
  outline-offset: 1px;
}
.house-rules-num {
  font-family: var(--font-display);
  font-size: 14px; font-weight: 700;
  color: var(--brass-deep);
  min-width: 22px;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.house-rules-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.house-rules-text-title {
  font-size: 12px; font-weight: 600;
  color: var(--stable-ink);
}
.house-rules-text-body {
  font-size: 10px;
  color: rgba(42,33,19,0.65);
  line-height: 1.4;
}
.house-rules-foot {
  text-align: center;
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--brass-dark);
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(160,125,61,0.4);
}
.house-rules-stand {
  width: 60%;
  max-width: 200px;
  height: 8px;
  margin-top: -2px;
  background: radial-gradient(ellipse at 50% 0%, rgba(160,125,61,0.5) 0%, rgba(160,125,61,0.05) 60%, transparent 100%);
  border-radius: 50%;
  filter: blur(3px);
}

/* ---- Help Section Head（图标 + 标题 + 副标） ---- */
.help-section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.help-section-head-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border-radius: 6px;
  background: rgba(201,162,94,0.12);
  color: var(--brass-bright);
  flex-shrink: 0;
}
.help-section-head-icon svg { width: 14px; height: 14px; }
.help-section-head-title {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 600;
  color: var(--ivory);
  margin: 0;
  font-variation-settings: 'opsz' 144;
}
.help-section-head-sub {
  font-size: 11px; color: var(--ivory-muted);
  letter-spacing: 0.04em;
  margin-left: auto;
  padding-left: 12px;
}

/* ---- Quick Start Path（节点轨迹） ---- */
.quick-path {
  display: flex; align-items: flex-start;
  flex-wrap: nowrap;
  gap: 0;
}
.quick-path-step {
  display: flex; align-items: center;
  flex: 1; min-width: 0;
}
.quick-path-node {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  flex: 0 0 auto;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  min-height: 44px;
}
.quick-path-node-num {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--walnut);
  border: 1.5px solid var(--brass-dark);
  color: var(--brass-bright);
  font-family: var(--font-display);
  font-size: 13px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.quick-path-node:hover .quick-path-node-num,
.quick-path-node:focus-visible .quick-path-node-num {
  background: var(--brass);
  color: var(--stable-ink);
  border-color: var(--brass-bright);
  transform: scale(1.06);
  box-shadow: 0 4px 10px rgba(201,162,94,0.32);
}
.quick-path-node:focus-visible {
  outline: 2px solid var(--brass);
  outline-offset: 2px;
  border-radius: 8px;
}
.quick-path-node-label {
  font-size: 11px; font-weight: 500;
  color: var(--ivory-dim);
  white-space: nowrap;
  max-width: 96px;
  text-align: center;
  overflow: hidden; text-overflow: ellipsis;
}
.quick-path-node:hover .quick-path-node-label {
  color: var(--ivory);
}
.quick-path-trail {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--brass-deep), var(--brass-muted));
  margin: 15px 6px 0;
  border-radius: 1px;
  position: relative;
}
.quick-path-trail::after {
  content: '';
  position: absolute;
  top: 50%; right: -3px;
  transform: translateY(-50%);
  width: 0; height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid var(--brass-bright);
}

/* ---- Concept Cards（系统概念卡片） ---- */
.concept-card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(38,28,16,0.75) 0%, rgba(28,20,12,0.85) 100%);
  border: 1px solid rgba(201,162,94,0.12);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  min-height: 110px;
}
.concept-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,162,94,0.4), transparent);
  opacity: 0.5;
}
.concept-card:hover {
  border-color: rgba(201,162,94,0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.concept-card-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(201,162,94,0.12);
  color: var(--brass-bright);
  border: 1px solid rgba(201,162,94,0.18);
}
.concept-card-title {
  font-family: var(--font-display);
  font-size: 13px; font-weight: 600;
  color: var(--ivory);
  margin: 0;
  font-variation-settings: 'opsz' 144;
}
.concept-card-body {
  font-size: 12px; line-height: 1.6;
  color: var(--ivory-muted);
  margin: 0;
}

/* ---- FAQ Accordion（编号 + brass 描边） ---- */
.faq-list {
  display: flex; flex-direction: column;
  gap: 8px;
}
.faq-item {
  border-left: 2px solid var(--walnut-border);
  border-radius: 0 8px 8px 0;
  background: linear-gradient(180deg, rgba(38,28,16,0.7) 0%, rgba(28,20,12,0.85) 100%);
  overflow: hidden;
  transition: border-left-color 0.25s ease, background 0.25s ease;
}
.faq-item:hover { border-left-color: var(--brass-dark); }
.faq-item.open { border-left-color: var(--brass); background: linear-gradient(180deg, rgba(38,28,16,0.85) 0%, rgba(28,20,12,0.95) 100%); }
.faq-item-button {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
  min-height: 44px;
}
.faq-item-button:focus-visible {
  outline: 2px solid var(--brass);
  outline-offset: -2px;
}
.faq-item-num {
  font-family: var(--font-display);
  font-size: 11px; font-weight: 700;
  color: var(--brass-deep);
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  min-width: 24px;
  padding-left: 2px;
}
.faq-item.open .faq-item-num { color: var(--brass-bright); }
.faq-item-question {
  flex: 1; min-width: 0;
  font-size: 13px; font-weight: 500;
  color: var(--ivory);
  line-height: 1.45;
}
.faq-item-chevron {
  flex-shrink: 0;
  color: var(--ivory-dim);
  transition: transform 0.2s ease, color 0.2s ease;
}
.faq-item-chevron.open {
  transform: rotate(180deg);
  color: var(--brass-bright);
}
.faq-item-panel-wrap { overflow: hidden; }
.faq-item-panel {
  padding: 0 14px 14px 50px;
  font-size: 12px;
  color: var(--ivory-muted);
  line-height: 1.7;
}

/* ---- Help Light Theme ---- */
html[data-theme="light"] .help-hero {
  background:
    radial-gradient(ellipse 70% 150% at 0% 0%, rgba(161,121,45,0.06), transparent 60%),
    linear-gradient(180deg, var(--felt) 0%, var(--felt-raised) 100%);
}
html[data-theme="light"] .concept-card {
  background: linear-gradient(135deg, rgba(240,233,214,0.7) 0%, rgba(228,218,194,0.85) 100%);
  border-color: rgba(161,121,45,0.18);
}
html[data-theme="light"] .concept-card-body { color: rgba(40,32,18,0.72); }
html[data-theme="light"] .faq-item {
  background: linear-gradient(180deg, rgba(240,233,214,0.7) 0%, rgba(228,218,194,0.85) 100%);
  border-left-color: rgba(161,121,45,0.18);
}
html[data-theme="light"] .faq-item:hover { border-left-color: rgba(161,121,45,0.4); }
html[data-theme="light"] .faq-item.open { border-left-color: var(--brass-deep); }
html[data-theme="light"] .faq-item-panel { color: rgba(40,32,18,0.7); }
html[data-theme="light"] .quick-path-node-num { background: var(--stable-ivory); }

/* ---- Help Responsive ---- */
@media (max-width: 767px) {
  .help-hero { padding: 18px 18px 22px; }
  .help-hero-grid { grid-template-columns: 1fr; gap: 20px; }
  .help-hero-title { font-size: 21px; }
  .help-hero-sub { font-size: 12px; }
  .house-rules-card { transform: none; max-width: 360px; margin: 0 auto; }
  .help-hero-plaque-wrap:hover .house-rules-card,
  .help-hero-plaque-wrap:focus-within .house-rules-card { transform: none; }

  .quick-path { flex-direction: column; align-items: stretch; gap: 0; }
  .quick-path-step { flex-direction: column; align-items: stretch; gap: 4px; }
  .quick-path-node {
    flex-direction: row; gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(38,28,16,0.6);
    border: 1px solid rgba(201,162,94,0.12);
    min-height: 44px;
  }
  .quick-path-node-num { width: 26px; height: 26px; font-size: 11px; }
  .quick-path-node-label {
    max-width: none;
    font-size: 12px;
    text-align: left;
    white-space: normal;
  }
  .quick-path-trail {
    height: 18px; width: 2px;
    background: linear-gradient(180deg, var(--brass-deep), var(--brass-muted));
    margin: 0 auto;
  }
  .quick-path-trail::after {
    top: auto; right: auto;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    border-top: 6px solid var(--brass-bright);
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }
  .help-section-head-sub { margin-left: 0; padding-left: 0; width: 100%; margin-top: 2px; }
}
'''

text = GLOBALS.read_text(encoding='utf-8')
if 'Help Center（2026-08-10）' in text:
    print('Help Center CSS already present; skipped append.')
else:
    GLOBALS.write_text(text.rstrip() + '\n' + BLOCK.lstrip('\n'), encoding='utf-8')
    print('Appended Help Center CSS block.')