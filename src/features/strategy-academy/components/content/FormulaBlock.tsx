import { Sigma } from 'lucide-react';

/**
 * 行级 font-mono 文本：仅当行含 ASCII 字母/数字时使用等宽字体
 * （中文行保持无衬线，避免中文字符等宽渲染无意义；JetBrains Mono 仅作用于英文/数字）。
 */
export function AsciiMonoText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
      {lines.map((line, i) => (
        <span key={i} className={/[A-Za-z0-9]/.test(line) ? 'font-mono' : ''}>
          {line}
          {i < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </p>
  );
}

/** 公式推导块：felt-deep 底 + brass-deep 边框 + Sigma 图标 + 公式行 font-mono */
export function FormulaBlock({ content }: { content: string }) {
  return (
    <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--brass-deep)]/40 p-4">
      <div className="flex items-start gap-3">
        <Sigma className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--brass-bright)] mb-1.5">公式推导</p>
          <AsciiMonoText content={content} />
        </div>
      </div>
    </div>
  );
}
