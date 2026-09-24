import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Calculator,
  Gamepad2,
  GraduationCap,
  Puzzle,
  ClipboardList,
  ArrowRight,
  Pin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProgressStore } from '../../store';
import type { DailyRecommendation } from '../../utils/dailyTrainingPlan';
import { resolveRecommendationText } from '../../utils/recommendationText';

/** 模块入口配置（§5.18 + §13.5.1 纹理变体） */
interface ModuleEntry {
  id: string;
  route: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  /** §13.5.1 图标方块微纹理变体类 */
  textureClass: string;
  iconColor: string;
}

const MODULES: ModuleEntry[] = [
  {
    id: 'range-trainer',
    route: '/range-trainer',
    icon: Target,
    labelKey: 'nav.rangeTrainer',
    descKey: 'dashboard.trainingGrounds.rangeDesc',
    textureClass: 'module-texture-range',
    iconColor: 'var(--brass-bright)',
  },
  {
    id: 'pot-odds',
    route: '/pot-odds',
    icon: Calculator,
    labelKey: 'nav.potOdds',
    descKey: 'dashboard.trainingGrounds.oddsDesc',
    textureClass: 'module-texture-pot-odds',
    iconColor: 'var(--poker-info)',
  },
  {
    id: 'gto-simulator',
    route: '/gto-simulator',
    icon: Gamepad2,
    labelKey: 'nav.gtoSimulator',
    descKey: 'dashboard.trainingGrounds.gtoDesc',
    textureClass: 'module-texture-gto',
    iconColor: 'var(--poker-frost)',
  },
  {
    id: 'strategy-academy',
    route: '/academy',
    icon: GraduationCap,
    labelKey: 'nav.academy',
    descKey: 'dashboard.trainingGrounds.academyDesc',
    textureClass: 'module-texture-strategy',
    iconColor: 'var(--poker-success)',
  },
  {
    id: 'puzzle-trainer',
    route: '/puzzle',
    icon: Puzzle,
    labelKey: 'nav.puzzle',
    descKey: 'dashboard.trainingGrounds.puzzleDesc',
    textureClass: 'module-texture-puzzle',
    iconColor: 'var(--brass-bright)',
  },
  {
    id: 'hand-history',
    route: '/hand-history',
    icon: ClipboardList,
    labelKey: 'nav.handHistory',
    descKey: 'dashboard.trainingGrounds.reviewDesc',
    textureClass: 'module-texture-hand-history',
    iconColor: 'var(--poker-leather)',
  },
];

/** 各模块最近一次训练时间戳（无记录则不出现） */
function buildLastTrainingMap(records: { module: string; createdAt: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    const prev = map.get(r.module);
    if (prev === undefined || r.createdAt > prev) {
      map.set(r.module, r.createdAt);
    }
  }
  return map;
}

/** §13.5.2 最近训练标记文案：今日已练 / {n}天前 */
function formatLastTraining(ts: number, t: (key: string, opts?: Record<string, number>) => string): string {
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return t('dashboard.lastTraining.today');
  return t('dashboard.lastTraining.daysAgo', { n: Math.max(1, Math.floor(diff / day)) });
}

/**
 * TrainingGrounds — 训练场模块网格（6 大模块入口）。
 * 含 §13.5.1 图标方块微纹理、§13.5.2 最近训练标记、§13.6.2 学习焦点模式。
 */
export default function ModuleGrid() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const records = useProgressStore((s) => s.records);
  const focusModule = useProgressStore((s) => s.focusModule);
  const setFocusModule = useProgressStore((s) => s.setFocusModule);

  const lastTrainingByModule = useMemo(() => buildLastTrainingMap(records), [records]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {MODULES.map((m) => {
        const Icon = m.icon;
        const isFocused = focusModule === m.id;
        const dimmed = focusModule !== null && !isFocused;
        const lastTs = lastTrainingByModule.get(m.id);
        const lastLabel = lastTs !== undefined ? formatLastTraining(lastTs, t) : null;
        const trainedToday = lastTs !== undefined && Date.now() - lastTs < 24 * 60 * 60 * 1000;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => navigate(m.route)}
            className="module-card relative"
            style={
              isFocused
                ? { borderColor: 'var(--brass)', borderWidth: '1.5px' }
                : dimmed
                  ? { opacity: 0.4 }
                  : undefined
            }
          >
            {/* §13.5.1 微纹理图标方块 */}
            <div className={`module-icon ${m.textureClass}`}>
              <Icon className="w-5 h-5" style={{ color: m.iconColor }} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-semibold text-[var(--ivory)]">{t(m.labelKey)}</div>
              <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                {t(m.descKey)}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />

            {/* §13.5.2 最近训练标记（右下角；从未训练不显示） */}
            {lastLabel !== null && (
              <span className={`last-training-badge ${trainedToday ? 'today' : ''}`}>
                {lastLabel}
              </span>
            )}

            {/* §13.6.2 聚焦按钮（右上角；span role=button 避免 button 嵌套） */}
            <span
              role="button"
              tabIndex={0}
              aria-label={t('dashboard.focusMode.pin')}
              aria-pressed={isFocused}
              onClick={(e) => {
                e.stopPropagation();
                setFocusModule(isFocused ? null : m.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setFocusModule(isFocused ? null : m.id);
                }
              }}
              className={`absolute top-2 right-2 z-10 cursor-pointer rounded p-1 transition-colors ${
                isFocused ? 'text-[var(--brass)]' : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * NewbiePathCard — §13.6.1 新手学习路径卡。
 * walnut-raised 底 + 1px walnut-border + 顶边黄铜发线 + 黄铜渐变"开始学习"按钮。
 *
 * 本卡接收**推荐对象**并自行经共享解析器出文案，而非接收调用方算好的字符串：
 * title/description 与复习项 label 都是 i18n key，解析口径必须与计划卡共用一份
 * （见 utils/recommendationText）。旧写法由调用方各自 t()，学习路径卡那份漏了
 * 复习 label 的逐条 t()，于是裸键直接显示给用户。
 */
export function NewbiePathCard({
  recommendation,
}: {
  recommendation: DailyRecommendation | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const text = recommendation ? resolveRecommendationText(recommendation, t) : null;
  const title = text?.title ?? t('dashboard.progressive.newbieTitle');
  const description = text?.description ?? '';
  const route = recommendation?.route ?? '/academy';

  return (
    <div className="relative overflow-hidden rounded-[var(--poker-radius-md)] border border-[var(--poker-walnut-border)] bg-[var(--poker-walnut-raised)] px-5 py-6">
      {/* 顶边黄铜发线 */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--poker-brass),transparent)]"
      />
      <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--poker-ivory-muted)]">
        {t('dashboard.progressive.newbieTitle')}
      </div>
      <h3 className="mt-2 font-display text-lg text-[var(--poker-ivory)]">{title}</h3>
      {description !== '' && (
        <p className="mt-1 text-xs text-[var(--poker-ivory-dim)]">{description}</p>
      )}
      <button
        type="button"
        onClick={() => navigate(route)}
        className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold text-[var(--stable-ink)] transition-all hover:brightness-110"
        style={{
          background: 'linear-gradient(180deg, var(--brass-bright), var(--brass))',
          border: '1px solid var(--brass-dark)',
        }}
      >
        {t('dashboard.progressive.newbieCta')}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
