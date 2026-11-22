/**
 * AcademyTakeawayCard — 章末要点卡单源（理论 / 策略两院共用，DESIGN.md §13.3.1）。
 * DOM 与两院原 LessonTakeawayBlock 逐字一致：.lesson-takeaway（walnut-raised 底 +
 * brass-deep 顶边 + brass 左侧竖线）+ 标题 p + brass 圆点列表。
 * 显式 takeaway 块与自动装配（utils/academyTakeaway.assembleTakeawayItems）共用此卡；
 * items 支持含换行的字符串（按换行拆分、trim 滤空），空 items 整卡不渲染。
 */
import { useTranslation } from 'react-i18next';

interface AcademyTakeawayCardProps {
  /** 要点条目（可含换行，渲染前按换行拆分并滤空） */
  items: string[];
  /** 标题缺省走 academy.content.takeaway（要点总结 / Key Takeaways） */
  title?: string;
}

export function AcademyTakeawayCard({ items, title }: AcademyTakeawayCardProps) {
  const { t } = useTranslation();
  const lines = items
    .flatMap((item) => item.split('\n'))
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <div className="lesson-takeaway">
      <p className="text-sm font-semibold text-[var(--ivory)] mb-2">
        {title ?? t('academy.content.takeaway')}
      </p>
      <ul className="space-y-1.5">
        {lines.map((item, i) => (
          <li
            key={i}
            className="text-sm text-[var(--ivory-dim)] leading-[1.7] flex items-start gap-2"
          >
            <span aria-hidden="true" className="mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--brass)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}