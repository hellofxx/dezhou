import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LessonSection } from '../../types';

interface TheoryReferenceBlockProps {
  section: LessonSection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
}

/**
 * 跳转目标解析（优先理论章节，回退学院课时；二者皆无 → null 渲染为纯文本标签）：
 *  - data.theoryChapterId（非空字符串）→ `/theory/chapter/<id>`：当前课时数据的实际形态，
 *    目标存在性由 data/theoryReferenceIntegrity.test.ts 守卫
 *  - data.lessonId（非空字符串）→ 旧形态向后兼容：data.target === 'theory' 走理论章节路径，
 *    其他/缺失走学院课程路径
 */
function resolveLink(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const chapterId = data.theoryChapterId;
  if (typeof chapterId === 'string' && chapterId.trim() !== '') {
    return `/theory/chapter/${chapterId}`;
  }
  const lessonId = data.lessonId;
  if (typeof lessonId !== 'string' || lessonId.trim() === '') return null;
  // data.target === 'theory' → 理论学院章节路径；其他/缺失 → 学院课程路径
  return data.target === 'theory'
    ? `/theory/chapter/${lessonId}`
    : `/academy/lesson/${lessonId}`;
}

/** 理论支撑块：info 系边框 + ExternalLink 图标；data.theoryChapterId / data.lessonId 存在时标签可点击跳转 */
export function TheoryReferenceBlock({ section, contentKey }: TheoryReferenceBlockProps) {
  const { t } = useTranslation();
  const href = resolveLink(section.data);
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
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
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}
