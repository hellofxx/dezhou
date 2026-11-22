/**
 * FormulaDerivation — 公式推导单源（理论 / 策略两院共用，DESIGN.md §13.3.2）。
 * brass 6% 透明底（.formula-display）+ 变量名 brass 高亮。
 *
 * 两种形态：
 * - 非结构化（纯公式简单行，无散文/标题/注脚且 numbered=false）：与策略原 FormulaDisplay
 *   逐 DOM 等价（div > div.mt-1.5 > 高亮 spans，无标签无编号），既有测试零迁移。
 * - 结构化（numbered=true，或含散文/标题/引文注脚）：追加 .formula-display--structured，
 *   标题左对齐 + ①–⑳ 编号徽章 + 公式居中 mono + 散文左对齐 + 引文注脚。
 *   含散文的推导即使不足 3 步也走结构化，保证「为何÷2」类长散文行左对齐可跟读。
 *
 * 解析算法在 ./formulaParse（纯函数）；本文件只负责渲染。
 */
import { parseFormulaContent, type ParsedFormula } from './formulaParse';

/**
 * 扑克/数学关键变量名（brass 高亮），用捕获组让 split 保留匹配结果。
 *
 * 尾随边界用负向前瞻 `(?![A-Za-z0-9_])` 而非 `\b`：带右括号的变量（P(win) / P(call) 等）
 * 以非单词字符 `)` 结尾，与后随空格之间不构成单词边界，`\b` 会让它们永远无法高亮。
 * 负向前瞻保留「不吞掉更长标识符」的边界语义（EVs / PFRq 不误命中），同时容纳右括号结尾变量。
 * 前导边界同理用负向后顾 `(?<![A-Za-z0-9_])`，兼容 CJK 紧邻（如「跟注EV」「所需Outs」）。
 */
const VARIABLE_RE =
  /(?<![A-Za-z0-9_])(EV|P\(win\)|P\(lose\)|P\(call\)|P\(fold\)|P\(raise\)|Pot|MDF|SPR|BB|SB|BU|CO|HJ|UTG|BTN|GTO|ICM|VPIP|PFR|AFq|AF|WTSD|WWSF|Outs|P\(胜\)|P\(负\))(?![A-Za-z0-9_])/g;

/** 行内变量高亮（split 带捕获组：奇数索引元素必为匹配到的变量 token，无状态可靠） */
export function HighlightFormulaLine({ line }: { line: string }) {
  const parts = line.split(VARIABLE_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-[var(--brass-bright)] font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** ①–⑳ 带圈编号（超出回退 `n.`） */
function stepBadge(index: number): string {
  return index >= 1 && index <= 20 ? String.fromCodePoint(0x2460 + index - 1) : `${index}.`;
}

const PROSE_CLASS = 'formula-prose text-[13px] leading-[1.7] text-left text-[var(--ivory-dim)]';

/** 结构化推导：标题 + 编号步骤（公式居中 / 散文左对齐）+ 引文注脚 */
function StructuredDerivation({ parsed }: { parsed: ParsedFormula }) {
  return (
    <div className="formula-display formula-display--structured">
      {parsed.groups.map((group, gi) => (
        <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
          {group.title !== undefined ? (
            <p className="font-sans text-[12px] font-semibold text-[var(--brass-text)] text-left mb-1.5">
              {group.title}
            </p>
          ) : null}
          {group.intro.map((line, i) => (
            <p key={`intro-${i}`} className={PROSE_CLASS}>
              <HighlightFormulaLine line={line} />
            </p>
          ))}
          {group.steps.map((step) => (
            <div key={step.index} className="grid grid-cols-[auto,1fr] items-start gap-x-2.5 mt-2">
              <span
                aria-hidden="true"
                className="font-numeric text-[14px] leading-[1.6] text-[var(--brass-bright)] select-none"
              >
                {stepBadge(step.index)}
              </span>
              <div className="min-w-0">
                <div className="formula-line font-mono text-center text-[14px]">
                  <HighlightFormulaLine line={step.formula} />
                </div>
                {step.prose.map((line, i) => (
                  <p key={i} className={`${PROSE_CLASS} mt-1`}>
                    <HighlightFormulaLine line={line} />
                  </p>
                ))}
              </div>
            </div>
          ))}
          {group.loose.map((line, i) => (
            <p key={`loose-${i}`} className={PROSE_CLASS}>
              <HighlightFormulaLine line={line} />
            </p>
          ))}
        </div>
      ))}
      {parsed.sourceNote !== undefined ? (
        <p className="text-[11px] leading-[1.6] text-left text-[var(--ivory-dim)] mt-2.5">
          {parsed.sourceNote}
        </p>
      ) : null}
    </div>
  );
}

/** 含散文/标题/引文注脚：即使步数不足编号阈值，也需结构化布局让散文左对齐可跟读 */
function hasProseContent(parsed: ParsedFormula): boolean {
  return (
    parsed.sourceNote !== undefined ||
    parsed.groups.some(
      (group) =>
        group.title !== undefined ||
        group.intro.length > 0 ||
        group.loose.length > 0 ||
        group.steps.some((step) => step.prose.length > 0),
    )
  );
}

export function FormulaDerivation({ content }: { content: string }) {
  const parsed = parseFormulaContent(content);
  if (!parsed.numbered && !hasProseContent(parsed)) {
    // legacy 形态：纯公式简单行，与原 FormulaDisplay 逐 DOM 等价（逐行，无标签无编号）
    const lines = content.split('\n');
    return (
      <div className="formula-display">
        {lines.map((line, i) => (
          <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
            <HighlightFormulaLine line={line} />
          </div>
        ))}
      </div>
    );
  }
  return <StructuredDerivation parsed={parsed} />;
}