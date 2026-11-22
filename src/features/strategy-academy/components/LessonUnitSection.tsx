import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import type { Lesson, LessonUnit } from '../types';
import { ContentBlock } from './content';
import { HandExampleComponent } from './HandExample';
import { lessonContentKey, resolveUnitTitleKeyed } from '../utils/contentKeys';

interface LessonUnitSectionProps {
  unit: LessonUnit;
  lesson: Lesson;
  /** unit 序数（0 起，§号 eyebrow 单源） */
  index: number;
  /** 是否参与渐进披露（标准课时 true；纯理论课 false 全量渲染） */
  collapsible: boolean;
  /** 披露判定结果：collapsible 且未释放时渲染折叠头 */
  revealed: boolean;
  /** 折叠头点击 → 本地展开（不写 store） */
  onExpand: (unitId: string) => void;
  /** checkpoint 已答状态（父层本地 state） */
  checkpointAnswered: boolean;
  onCheckpointAnswered: (unitId: string, answered: boolean) => void;
}

/**
 * 课时小节渲染单元（LessonContent 两条阅读分支共用）。
 * 折叠头保留 id={unit.id}（scrollIntoView / hash 直达目标恒在）+ §号 + 标题 +
 * ChevronDown + 展开文案；展开态渲染 h2 + 内容块 + 牌例（checkpoint 交互）。
 */
export function LessonUnitSection({
  unit,
  lesson,
  index,
  collapsible,
  revealed,
  onExpand,
  checkpointAnswered,
  onCheckpointAnswered,
}: LessonUnitSectionProps) {
  const { t } = useTranslation();
  const title = resolveUnitTitleKeyed(t, lesson, unit);
  const sectionNumber = `§${lesson.level}.${index + 1}`;
  const example = unit.exampleId
    ? lesson.examples?.find((ex) => ex.id === unit.exampleId)
    : undefined;

  if (collapsible && !revealed) {
    return (
      <section id={unit.id} className="scroll-mt-24">
        <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
          <button
            type="button"
            onClick={() => onExpand(unit.id)}
            aria-expanded={false}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border border-[var(--walnut-border)]',
              'bg-[var(--felt-deep)]/40 px-4 py-3 text-left transition-colors',
              'hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40',
              FOCUS_RING,
            )}
          >
            <span className="section-number">{sectionNumber}</span>
            <span className="min-w-0 flex-1 truncate">{title}</span>
            <span className="shrink-0 font-sans text-xs font-normal text-[var(--ivory-muted)]">
              {t('academy.lessonUnit.expandSection')}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ivory-muted)]" aria-hidden="true" />
          </button>
        </h2>
      </section>
    );
  }

  return (
    <section id={unit.id} className="scroll-mt-24 space-y-4">
      <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
        <span className="section-number">{sectionNumber}</span>
        {title}
      </h2>
      {unit.sections.length === 0 && !example ? (
        <p className="text-xs text-[var(--ivory-muted)]">
          {t('academy.lessonUnit.noContent')}
        </p>
      ) : null}
      {unit.sections.map((s, j) => {
        const idx = lesson.content.indexOf(s);
        return (
          <ContentBlock
            key={j}
            section={s}
            contentKey={idx >= 0 ? lessonContentKey(lesson.id, idx) : undefined}
          />
        );
      })}
      {example ? (
        unit.checkpoint ? (
          <HandExampleComponent
            example={example}
            index={index}
            interactive
            answered={checkpointAnswered}
            onAnswered={(v) => onCheckpointAnswered(unit.id, v)}
          />
        ) : (
          <HandExampleComponent example={example} index={index} />
        )
      ) : null}
    </section>
  );
}