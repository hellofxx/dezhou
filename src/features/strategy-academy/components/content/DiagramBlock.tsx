import { Table2, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LessonSection } from '../../types';

interface SectionBlockProps {
  section: LessonSection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
}

/** 表格守卫：data.rows 为数组的数组，data.headers 为字符串数组（运行时类型守卫） */
function parseTable(data: Record<string, unknown> | undefined) {
  const rows = Array.isArray(data?.rows)
    ? data.rows.filter((r): r is unknown[] => Array.isArray(r))
    : null;
  const headers = Array.isArray(data?.headers)
    ? data.headers.filter((h): h is string => typeof h === 'string')
    : null;
  const caption = typeof data?.caption === 'string' ? data.caption : null;
  const hasTable = rows !== null && headers !== null && headers.length > 0 && rows.length > 0;
  return { rows, headers, caption, hasTable };
}

/** 示意图块：data.rows+headers → 简化表格；否则 content 文本 + 可选 caption */
export function DiagramBlock({ section, contentKey }: SectionBlockProps) {
  const { t } = useTranslation();
  const { rows, headers, caption, hasTable } = parseTable(section.data);
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  return (
    <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
      <div className="flex items-start gap-3">
        <Table2 className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          {hasTable ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {headers!.map((h, i) => (
                      <th
                        key={i}
                        className="text-left font-semibold text-[var(--ivory-muted)] pb-2 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows!.map((row, ri) => (
                    <tr key={ri} className="border-t border-[var(--walnut-border)]/60">
                      {row.slice(0, headers!.length).map((cell, ci) => (
                        <td key={ci} className="py-1.5 pr-4 text-[var(--ivory-dim)] whitespace-nowrap">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
              {content}
            </p>
          )}
          {caption && <p className="text-xs text-[var(--ivory-muted)] mt-2">{caption}</p>}
        </div>
      </div>
    </div>
  );
}

/** 手牌示例块：content 优先；为空时回退 data.scenario，再回退占位说明 */
export function HandExampleBlock({ section, contentKey }: SectionBlockProps) {
  const { t } = useTranslation();
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  const scenario =
    typeof section.data?.scenario === 'string' && section.data.scenario.trim() !== ''
      ? section.data.scenario
      : '';
  const text = content || scenario || t('academy.content.handExampleFallback');
  return (
    <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4 flex items-start gap-3">
      <Hand className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}
