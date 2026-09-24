/**
 * FormulaDisplay — 公式展示块（§13.3.2 设计规范）。
 * brass 6% 透明底 + mono 字体 + 居中 + 变量名 brass 高亮。
 * 与 shared FormulaBlock（felt-deep 底 + 左对齐）视觉不同，两者并存不冲突。
 * 实现：纯 React 元素拆分（split + map），无 innerHTML。
 */

/** 扑克/数学关键变量名（brass 高亮），用捕获组让 split 保留匹配结果 */
const VARIABLE_RE = /\b(EV|P\(win\)|P\(lose\)|P\(call\)|P\(fold\)|P\(raise\)|Pot|MDF|SPR|BB|SB|BU|CO|HJ|UTG|BTN|GTO|ICM|VPIP|PFR|AFq|AF|WTSD|WWSF)\b/g;

function HighlightLine({ line }: { line: string }) {
  // split 带捕获组：奇数索引元素必为匹配到的变量 token（无状态，可靠）
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

export function FormulaDisplay({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="formula-display">
      {lines.map((line, i) => (
        <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
          <HighlightLine line={line} />
        </div>
      ))}
    </div>
  );
}