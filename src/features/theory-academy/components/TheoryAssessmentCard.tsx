import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ClipboardCheck, Compass } from 'lucide-react';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { transitionStandard } from '@/shared/utils/motion';

/** 定位测评 / 检查点路由（由 platform 侧注册；本模块只拼字符串，不 import 评估侧组件） */
const PLACEMENT_ROUTE = '/theory/placement';

interface TheoryAssessmentCardProps {
  /** 当前进行中的 Level id；为 null 时不渲染检查点入口（无「进行中 Level」可自查） */
  levelId: string | null;
}

const ROW_CLASS =
  `group flex min-h-11 items-center gap-3 rounded-md px-1 text-xs font-semibold text-[var(--ivory)] transition-colors hover:text-[var(--brass-bright)] ${FOCUS_RING}`;

/**
 * 理论地图评估区（聚合入口）。
 *
 * 把「定位测评」与「检查点」两个评估入口收在同一 section 内：地图只保留一套评估心智，
 * 掌握度卡不再各自复制检查点入口。两条入口都是只读导航：
 * - 定位测评：放宽解锁 + 推荐起点（不写已读章节）
 * - 检查点：按当前进行中的 Level 进入形成性自查（页面自处理未读完 / 锁定态）
 */
export function TheoryAssessmentCard({ levelId }: TheoryAssessmentCardProps) {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.11 }}
      aria-label={t('nav.assessment')}
    >
      <SectionLabel as="h2" className="mb-2.5 px-1">
        {t('nav.assessment')}
      </SectionLabel>
      <div className="panel divide-y divide-[var(--walnut-border)]/60">
        <Link to={PLACEMENT_ROUTE} className={ROW_CLASS}>
          <span className="w-7 h-7 rounded-md bg-[var(--walnut-raised)] flex items-center justify-center text-[var(--brass-bright)] shrink-0">
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="flex-1">{t('nav.theoryPlacement')}</span>
          <ChevronRight
            className="w-3.5 h-3.5 text-[var(--ivory-dim)] group-hover:text-[var(--brass-bright)] transition-colors shrink-0"
            aria-hidden="true"
          />
        </Link>
        {levelId ? (
          <Link to={`/theory/checkpoint/${levelId}`} className={ROW_CLASS}>
            <span className="w-7 h-7 rounded-md bg-[var(--walnut-raised)] flex items-center justify-center text-[var(--brass-bright)] shrink-0">
              <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span className="flex-1">{t('nav.theoryCheckpoint')}</span>
            <ChevronRight
              className="w-3.5 h-3.5 text-[var(--ivory-dim)] group-hover:text-[var(--brass-bright)] transition-colors shrink-0"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </div>
    </motion.section>
  );
}