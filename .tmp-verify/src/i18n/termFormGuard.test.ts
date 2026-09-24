import { describe, expect, it } from 'vitest';

/**
 * 3-bet 术语词形守卫（棘轮锁死为 0）。
 *
 * 背景：3Bet / 3-bet / 3bet 三形统一完成后，锁死 src/**（.ts/.tsx/.json）中的
 * 残留变体：`3Bet`（驼峰）、`3BET`（全大写）、独立 `3bet`（无连字符小写）、
 * `3-Bet` / `3-BET`（连字符大小写错误）。唯一合法词形是全小写连字符 `3-bet`
 * （`3-bets` / `3-betting` 等小写连字符派生同样合法）。
 *
 * 例外清单只收「代码标识符语境」：kebab/snake id、actionType 数据值、
 * 排序表键、常量名与数据值断言；文案 / 注释一律不得豁免。
 * 豁免遵循「只删不加」：后续统一推进产生的死条目应及时删除
 * （下方「例外清单全部有效」用例强制）。
 */

// 通过 Vite raw glob 全量载入 src 源码（含测试文件与 JSON，无 node:fs 依赖）
const SOURCE_FILES = import.meta.glob<string>('/src/**/*.{ts,tsx,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** 守卫自身豁免（本文件的例外清单源码含 `3bet` 字样） */
const SELF_PATH = '/src/i18n/termFormGuard.test.ts';

/** 词形匹配：匹配全部形态，仅精确全小写连字符 `3-bet` 放行 */
const TERM_FORM = /3[-_]?bet/gi;

/** 通用标识符形态豁免（全文件生效；id 全小写 kebab/snake 与全大写常量，不加 i 标志） */
const GENERIC_ID_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /[a-z0-9]-3bet/,
    reason: 'kebab id 内部（l2-3bet-basics / drill-l2-3bet / t-3bet / btn-3bet-vs-co 等）',
  },
  {
    pattern: /[a-z0-9]_3bet/,
    reason: 'snake 数据键（preflop-ranges.json 的 btn_vs_co_3bet / co_vs_hj_3bet）',
  },
  {
    pattern: /3bet-[a-z0-9]/,
    reason: 'kebab id 前缀（puzzleBank 题目 id 3bet-001…3bet-020）',
  },
  {
    pattern: /L2_3BET_U\d_SECTIONS/,
    reason: 'strategy-academy standardLevel2 分段常量名（引用相等契约）',
  },
];

/** 文件级标识符语境豁免（文案 / 注释不得列入；词形统一推进后死条目必须删除） */
const FILE_EXCEPTIONS: ReadonlyArray<{ file: string; pattern: RegExp; reason: string }> = [
  {
    file: '/src/features/range-trainer/types.ts',
    pattern: /'3bet' \| '4bet'/,
    reason: 'actionType 类型联合中的数据值',
  },
  {
    file: '/src/features/range-trainer/utils/questionGenerator.ts',
    pattern: /open\/3bet\/4bet/,
    reason: '注释描述 actionType 枚举值序列',
  },
  {
    file: '/src/features/range-trainer/hooks/useQuizEngine.ts',
    pattern: /act\.includes\('3bet'\)|3bet\/4bet| \/ 3bet \/ |\/\/ 3bet \/|call-vs-raise \/ 3bet/,
    reason: 'actionType → 课程 id 映射逻辑（数据值判断与注释）',
  },
  {
    file: '/src/features/range-trainer/store.ts',
    pattern: /CO\+3bet/,
    reason: '注释描述 actionType 组合场景（CO 位置 + 3bet 会话）',
  },
  {
    file: '/src/features/range-trainer/storeQuizSlice.test.ts',
    pattern: /'3bet'|toBe\('(CO|UTG) 3bet'\)|CO \+ 3bet/,
    reason: 'actionType 数据值传参/断言 + 运行时拼接文本（position+actionType）',
  },
  {
    file: '/src/features/range-trainer/constants.ts',
    pattern: /value: '3bet'|actionType: '3bet'/,
    reason: 'actionType 数据值（下拉选项 value + 4 处预置范围 preset 的 actionType 字段）',
  },
  {
    file: '/src/features/strategy-academy/utils/practiceOptionOrder.ts',
    pattern: /\['3bet', 5\]/,
    reason: '动作排序表数据键（strategy-academy 选项文本未使用该形态）',
  },
  {
    file: '/src/features/puzzle-trainer/utils/optionOrder.ts',
    pattern: /\['3bet', 5\]|Raise \/ 3bet \/ 4bet|Raise·3bet/,
    reason: '动作排序表数据键及其注释描述（表键 3bet 与新增 3-bet 并存，向后兼容）',
  },
  {
    file: '/src/features/gto-simulator/utils/spotKey.ts',
    pattern: /_3bet`/,
    reason: 'spot key 模板字符串结尾（运行时数据键生成，与 preflop-ranges.json 键名契约）',
  },
  {
    file: '/src/rangePresetGtoConsistency.test.ts',
    pattern: /\['3bet', '4bet'\]/,
    reason: 'actionType 数据值断言（含 toContain）',
  },
];

interface Residual {
  path: string;
  line: number;
  snippet: string;
}

/** 扫描全部源码，返回未被例外清单豁免的词形残留 */
function findResiduals(): Residual[] {
  const residuals: Residual[] = [];
  for (const [path, content] of Object.entries(SOURCE_FILES)) {
    if (path === SELF_PATH) continue;
    const fileExceptions = FILE_EXCEPTIONS.filter((e) => e.file === path);
    content.split('\n').forEach((rawLine, idx) => {
      const matched = [...rawLine.matchAll(TERM_FORM)].map((m) => m[0]);
      const bad = matched.filter((m) => m !== '3-bet');
      if (bad.length === 0) return;
      // 行级豁免：该行命中标识符形态 → 整行豁免（例外行均为纯标识符语境）
      const exempt =
        GENERIC_ID_PATTERNS.some((g) => g.pattern.test(rawLine)) ||
        fileExceptions.some((e) => e.pattern.test(rawLine));
      if (!exempt) {
        residuals.push({ path, line: idx + 1, snippet: rawLine.trim().slice(0, 140) });
      }
    });
  }
  return residuals;
}

describe('3-bet 术语词形守卫（棘轮锁死为 0）', () => {
  it('扫描范围有效（应覆盖全部 src 源码文件，含 JSON 与测试文件）', () => {
    const paths = Object.keys(SOURCE_FILES);
    expect(paths.length).toBeGreaterThan(150);
    expect(paths).toContain('/src/i18n/locales/zh/puzzle.json');
    expect(paths).toContain('/src/features/puzzle-trainer/data/puzzleBank.ts');
  });

  it('词形正则有效（正确词形 3-bet 存在于已统一文件，防空转）', () => {
    const zhPuzzle = SOURCE_FILES['/src/i18n/locales/zh/puzzle.json'];
    expect(zhPuzzle).toBeDefined();
    expect(zhPuzzle!).toContain('3-bet 策略');
    const bank = SOURCE_FILES['/src/features/puzzle-trainer/data/puzzleBank.ts'];
    expect(bank!).toContain("'3-bet'");
  });

  it('src 全量无 3Bet / 3BET / 独立 3bet / 3-Bet 残留（非例外计数 = 0）', () => {
    const residuals = findResiduals();
    expect(
      residuals.map((r) => `${r.path}:${r.line} → ${r.snippet}`),
      `发现 ${residuals.length} 处词形残留：请统一为 3-bet，或确认属代码标识符后在例外清单登记依据`
    ).toEqual([]);
  });

  it('例外清单全部有效（模式在当前源码中仍命中，死条目应删除——只删不加）', () => {
    for (const e of FILE_EXCEPTIONS) {
      const content = SOURCE_FILES[e.file];
      expect(content, `例外文件不存在：${e.file}`).toBeDefined();
      const hit = content!.split('\n').some((line) => e.pattern.test(line));
      expect(hit, `例外已死（请删除该条目）：${e.file} ← ${e.reason}`).toBe(true);
    }
  });
});
