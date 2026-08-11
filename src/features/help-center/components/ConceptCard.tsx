import { useTranslation } from 'react-i18next';
import { Gauge, Flame, Repeat, Award, Clock, Database, type LucideIcon } from 'lucide-react';
import type { ConceptIconKey } from '../types';

const ICON_MAP: Record<ConceptIconKey, LucideIcon> = {
  gauge: Gauge,
  flame: Flame,
  repeat: Repeat,
  award: Award,
  clock: Clock,
  database: Database,
};

interface Props {
  /** i18n key（如 'concepts.elo'），组件用 `help.${cardKey}.title` / `.body` 渲染 */
  cardKey: string;
  /** 图标 key（在 ICON_MAP 中查找，编译期校验） */
  iconKey: ConceptIconKey;
}

/**
 * 系统概念卡片 — 顶部 brass 描边圆图标 + 标题 + 描述。
 * 与 module-card（横向条目）形成视觉差异化：纵向多行内容卡。
 */
export default function ConceptCard({ cardKey, iconKey }: Props) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[iconKey];

  return (
    <article className="concept-card">
      <div className="concept-card-icon" aria-hidden="true">
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </div>
      <h3 className="concept-card-title">{t(`help.${cardKey}.title`)}</h3>
      <p className="concept-card-body">{t(`help.${cardKey}.body`)}</p>
    </article>
  );
}