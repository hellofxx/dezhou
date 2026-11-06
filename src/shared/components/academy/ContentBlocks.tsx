import type { LucideIcon } from 'lucide-react';
import { Sigma } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 课程内容块共享视觉组件（theory-academy / strategy-academy 共用）。
 * 统一骨架：rounded-lg p-4 / 图标 20px 语义色 shrink-0 / 标签 text-xs font-semibold /
 * 正文 text-sm text-[var(--ivory-dim)] leading-relaxed。
 * 归属 shared 依据：被两学院 ContentBlock 渲染链路消费（≥2 模块使用准入门槛）。
 */

/** 图标 + 标签 + 正文的通用骨架（key-point / pro-tip / counter-intuitive 共用） */
export function LabeledBlock({
  icon: Icon,
  iconClass,
  label,
  labelClass,
  wrapClass,
  content,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  labelClass: string;
  wrapClass: string;
  content: string;
}) {
  return (
    <div className={`rounded-lg ${wrapClass} p-4 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold mb-1.5 ${labelClass}`}>{label}</p>
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}

/** 行级 font-mono 文本：仅当行含 ASCII 字母/数字时使用等宽字体（中文行保持无衬线） */
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
  const { t } = useTranslation();
  return (
    <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--brass-deep)]/40 p-4">
      <div className="flex items-start gap-3">
        <Sigma className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--brass-bright)] mb-1.5">
            {t('academy.content.formula')}
          </p>
          <AsciiMonoText content={content} />
        </div>
      </div>
    </div>
  );
}
