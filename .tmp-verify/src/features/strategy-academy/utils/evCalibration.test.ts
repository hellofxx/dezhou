import { describe, expect, it } from 'vitest';

/**
 * 五级反馈 EV 标定覆盖率棘轮守卫（可追踪指标，非行为断言）。
 *
 * 现状（实测）：标准课时（standard）practice 选项**没有任何**数值型 `evLoss`，
 * 只有自由文本 `evImpact`。因此五级反馈在标准课时上只能靠 `isCorrect` 兜底推断，
 * 属于伪造精度 —— 呈现层已改为「三态诚实渲染」（见 utils/practiceFeedbackView.ts）。
 *
 * 本测试把「标定覆盖率」固化为只能上升的棘轮：将来有人真去给选项标定 EV 损失时，
 * `calibrated` 数字上升即可（把 BASELINE 一起上调）；下降则失败。
 *
 * 数据源用 Vite 原生 `import.meta.glob(..., '?raw')` 读源码文本，
 * 既不为测试引入整个题库模块（跨域成本），也不依赖 Node fs/类型（src 的 typecheck 为浏览器口径）。
 */

const lessonSources = import.meta.glob<string>(
  '../data/lessons/variants/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

/** 标准课时基线：当前携带数值型 evLoss 的 practice 选项数（只能上升） */
const STANDARD_CALIBRATED_BASELINE = 0;

/** practice 选项对象：单行 `{ action: ..., isCorrect: ... }` 形态（含跨行但对象内无嵌套花括号） */
const OPTION_PATTERN = /\{\s*action:[^}]*?\bisCorrect:/g;
/** 数值型 evLoss（`evLoss: 0.5`）；自由文本 evImpact 与 HandExample 的 `evLoss: '...'` 字符串均不匹配 */
const NUMERIC_EV_LOSS_PATTERN = /evLoss:\s*-?\d+(?:\.\d+)?/g;

interface ScanResult {
  options: number;
  calibrated: number;
}

/** 扫描指定变体目录（path 片段，如 '/standard/'）下的 practice 选项与 EV 标定数 */
function scanVariant(fragment: string): ScanResult {
  let options = 0;
  let calibrated = 0;
  for (const [file, src] of Object.entries(lessonSources)) {
    if (file.endsWith('.test.ts') || !file.includes(fragment)) continue;
    options += (src.match(OPTION_PATTERN) ?? []).length;
    calibrated += (src.match(NUMERIC_EV_LOSS_PATTERN) ?? []).length;
  }
  return { options, calibrated };
}

describe('五级反馈 EV 标定覆盖率（棘轮）', () => {
  const standard = scanVariant('/standard/');

  it('守卫确实扫描到标准课时 practice 选项（防 glob/正则失配导致空断言）', () => {
    expect(Object.keys(lessonSources).length).toBeGreaterThan(5);
    expect(standard.options).toBeGreaterThan(500);
  });

  it('标准课时携带数值型 evLoss 的选项数只增不减', () => {
    const coverage = standard.options === 0
      ? '0%'
      : `${((standard.calibrated / standard.options) * 100).toFixed(1)}%`;
    // 输出实际值：随题库标定进度上升，届时把 STANDARD_CALIBRATED_BASELINE 同步上调
    console.info(
      `[evCalibration] standard practice options=${standard.options} ` +
        `calibrated(evLoss)=${standard.calibrated} coverage=${coverage}`,
    );
    expect(standard.calibrated).toBeGreaterThanOrEqual(STANDARD_CALIBRATED_BASELINE);
  });

  it('非标准变体（heads-up / short-deck）已标定，覆盖率不得倒退', () => {
    const headsUp = scanVariant('/heads-up/');
    const shortDeck = scanVariant('/short-deck/');
    console.info(
      `[evCalibration] heads-up=${headsUp.calibrated}/${headsUp.options} ` +
        `short-deck=${shortDeck.calibrated}/${shortDeck.options}`,
    );
    expect(headsUp.calibrated).toBeGreaterThan(0);
    expect(shortDeck.calibrated).toBeGreaterThan(0);
  });
});
