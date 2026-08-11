import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LessonSection } from '../../types';

interface TheoryReferenceBlockProps {
  section: LessonSection;
}

/** 跳转目标解析：data.lessonId 存在（string）时生成跳转链接；target 决定路径形态 */
function resolveLink(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const lessonId = data.lessonId;
  if (typeof lessonId !== 'string' || lessonId.trim() === '') return null;
  // data.target === 'theory' → 理论学院章节路径；其他/缺失 → 学院课程路径
  return data.target === 'theory'
    ? `/theory/chapter/${lessonId}`
    : `/academy/lesson/${lessonId}`;
}

/** 理论支撑块：info 系边框 + ExternalLink 图标；data.lessonId 存在时标签可点击跳转 */
export function TheoryReferenceBlock({ section }: TheoryReferenceBlockProps) {
  const { t } = useTranslation();
  const href = resolveLink(section.data);
  return (
    <div className="rounded-lg border border-[var(--info)]/30 bg-[var(--info)]/10 p-4">
      <div className="flex items-start gap-3">
        <ExternalLink className="w-5 h-5 text-[var(--info)] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5">
            {href ? (
              <a
                href={href}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--info)] underline decoration-dotted underline-offset-4 hover:text-[var(--ivory)] transition-colors"
              >
                {t('academy.content.theoryReference')}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-xs font-semibold text-[var(--info)]">{t('academy.content.theoryReference')}</p>
            )}
          </div>
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </div>
      </div>
    </div>
  );
}
