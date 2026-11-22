/**
 * formulaParse — 公式推导内容解析纯函数（FormulaDerivation 的计算层）。
 *
 * 把课程 formula 块的原始字符串解析为「分组 → 编号步骤 + 散文」结构：
 * ① 尾部剥离引文（（概念源自：…）→ sourceNote 注脚，不编号）；
 * ② 按空行切 group，组内按换行切行（trim 滤空）；
 * ③ 行分类：标题行 / `Step N:` 前缀强制开步 / 公式符号行（排除长中文散文）/ 散文；
 * ④ 每条公式行开新 step，紧随散文挂 step.prose，step 前散文进 group.intro；
 *    无步骤的纯散文组进 group.loose。编号跨 group 连续（1-based）。
 *
 * numbered 阈值（设计决策 D9）：总步数 ≥3 或组数 ≥2 才编号；
 * 单/双行简单公式保持 legacy DOM（渲染层直接按原内容逐行输出）。
 * 纯函数、无副作用；启发式阈值（CJK 0.45 / 行长 60 / 运算符密度 0.2）针对现有
 * 中英课程内容标定，不改内容数据。引文剥离双语（概念源自 / Concepts from）。
 */

export interface FormulaStep {
  /** 跨 group 连续的 1-based 序号 */
  index: number;
  /** 公式行原文（Step 前缀已剥离） */
  formula: string;
  /** 紧随其后的散文行 */
  prose: string[];
}

export interface FormulaGroup {
  /** 标题行（以 ：/: 结尾且冒号后无 =/≈），可缺省 */
  title?: string;
  /** 首个 step 之前的散文行 */
  intro: string[];
  steps: FormulaStep[];
  /** 无公式步骤的纯散文组的散文行 */
  loose: string[];
}

export interface ParsedFormula {
  groups: FormulaGroup[];
  /** 尾部引文注脚（含括号原文） */
  sourceNote?: string;
  /** 总步数 ≥3 或组数 ≥2 */
  numbered: boolean;
}

/** 尾部引文：（概念源自：《教材》章节…）/ (Concepts from: …)，全/半角括号双语、不跨行 */
const SOURCE_NOTE_RE = /[（(](?:概念源自|Concepts from)[:：][^）)]*[）)]\s*$/;
/** 显式步骤前缀：Step 1: / Step 2：（读牌四步法等流程型内容） */
const STEP_PREFIX_RE = /^Step\s*\d+[:：]\s*/;
/** 公式符号（含全角对照分隔符 ｜） */
const FORMULA_SYMBOL_RE = /[=≈∝→÷×]|｜/;
/** CJK 字符（含中文标点与全角符号，用于长散文判据） */
const CJK_RE = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/g;
/** 数学运算符（不含自然语言标点 ：;,.，用于拉丁语系散文的运算符密度判据） */
const MATH_OPERATOR_RE = /[=≈∝→÷×+\-*\/[\](){}!%｜√Σ]/g;

/**
 * 长散文判据（语言无关）：行长 > 60 且满足其一——
 * ① CJK 占非空白字符 > 0.45（中文推导说明，如「为何÷2」）；
 * ② 数学运算符密度 < 0.2（英文等拉丁语系推导长句以自然语言词为主，运算符稀疏）。
 * 纯公式行（运算符密集，如 bet EV 展开式）密度高，仍判公式居中。
 */
function isLongProse(line: string): boolean {
  if (line.length <= 60) return false;
  const nonWhitespace = line.replace(/\s/g, '').length;
  if (nonWhitespace === 0) return false;
  const cjkCount = (line.match(CJK_RE) ?? []).length;
  if (cjkCount / nonWhitespace > 0.45) return true;
  const mathOps = (line.match(MATH_OPERATOR_RE) ?? []).length;
  return mathOps / nonWhitespace < 0.2;
}

/** 标题行：以 ：/: 结尾，且首个冒号之后不含 =/≈（排除「推导：EV = …」型公式行） */
function isTitleLine(line: string): boolean {
  if (!/[：:]$/.test(line)) return false;
  const colonIndex = line.search(/[：:]/);
  return !/[=≈]/.test(line.slice(colonIndex + 1));
}

function isFormulaLine(line: string): boolean {
  return FORMULA_SYMBOL_RE.test(line) && !isLongProse(line);
}

interface GroupDraft {
  group: FormulaGroup;
  /** 尚未遇到首个 step 时暂存的散文行 */
  pending: string[];
}

function parseGroup(lines: string[], startIndex: number): { group: FormulaGroup; nextIndex: number } {
  const draft: GroupDraft = { group: { intro: [], steps: [], loose: [] }, pending: [] };
  let index = startIndex;

  const openStep = (formula: string) => {
    if (draft.group.steps.length === 0) {
      draft.group.intro = draft.pending;
      draft.pending = [];
    }
    draft.group.steps.push({ index, formula, prose: [] });
    index += 1;
  };

  for (const line of lines) {
    if (draft.group.title === undefined && draft.group.steps.length === 0 && isTitleLine(line)) {
      draft.group.title = line;
      continue;
    }
    const stepPrefix = STEP_PREFIX_RE.exec(line);
    if (stepPrefix) {
      // 显式 Step 前缀：剥离后强制开新 step（即使行内无公式符号）
      openStep(line.slice(stepPrefix[0].length).trim());
      continue;
    }
    if (isFormulaLine(line)) {
      openStep(line);
      continue;
    }
    const current = draft.group.steps[draft.group.steps.length - 1];
    if (current) {
      current.prose.push(line);
    } else {
      draft.pending.push(line);
    }
  }

  if (draft.group.steps.length === 0) {
    draft.group.loose = draft.pending;
  }
  return { group: draft.group, nextIndex: index };
}

function isEmptyGroup(group: FormulaGroup): boolean {
  return (
    group.title === undefined &&
    group.intro.length === 0 &&
    group.steps.length === 0 &&
    group.loose.length === 0
  );
}

/** 解析公式块原始内容为结构化推导（纯函数，渲染决策见 FormulaDerivation） */
export function parseFormulaContent(content: string): ParsedFormula {
  const noteMatch = SOURCE_NOTE_RE.exec(content);
  const sourceNote = noteMatch ? noteMatch[0].trim() : undefined;
  const body = noteMatch ? content.slice(0, noteMatch.index) : content;

  const groups: FormulaGroup[] = [];
  let index = 1;
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    const parsed = parseGroup(lines, index);
    index = parsed.nextIndex;
    if (!isEmptyGroup(parsed.group)) groups.push(parsed.group);
  }

  const totalSteps = groups.reduce((sum, group) => sum + group.steps.length, 0);
  return {
    groups,
    sourceNote,
    numbered: totalSteps >= 3 || groups.length >= 2,
  };
}