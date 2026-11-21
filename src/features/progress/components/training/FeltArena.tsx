import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import MottoEngraved from './MottoEngraved';
import { RankIcon } from '../stats/RankIcon';
import { CardBack } from '@/shared/components/poker/CardBack';
import { Chip } from '@/shared/components/poker/Chip';
import { getRankForScore } from '@/features/progress/utils/elo';
import { useProgressStore } from '../../store';
import { getTodayString } from '../../utils/streakCalc';
import { RANKS } from '@/shared/types/elo';

/**
 * FeltArena — 椭圆牌桌 Hero（对照已确认基准图 pc-home-r01）。
 *
 * 结构：左右象牙铭牌（ELO / 连续训练）→ 中央路径标语 + 铭文 + 牌堆筹码 → 底部状态注。
 * 统计条与今日目标卡不再进入 hero：总数/正确率在周条与进度中心，今日目标在计划面板。
 */
export default function FeltArena() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const streak = useProgressStore((s) => s.streak);
  const elo = useProgressStore((s) => s.eloByVariant[s.activeVariant]);
  const emotion = useProgressStore((s) => s.emotion);
  const currentRank = useMemo(() => getRankForScore(elo.overall), [elo.overall]);
  const rankName = t(`progress.rank.${currentRank.name}.name`);

  const nextRank = useMemo(
    () => RANKS.find((rank) => rank.minScore > elo.overall) ?? null,
    [elo.overall],
  );
  const isToday = emotion.dailyQuestionsDate === getTodayString();
  const answeredToday = isToday ? emotion.dailyTotal : 0;
  const currentStreak = streak.currentStreak;

  const statusNote =
    nextRank === null
      ? t('dashboard.feltArena.statusMax', { rank: rankName, answered: answeredToday })
      : t('dashboard.feltArena.statusNote', {
          rank: rankName,
          next: t(`progress.rank.${nextRank.name}.name`),
          n: nextRank.minScore - elo.overall,
          answered: answeredToday,
        });

  return (
    <div className="felt-arena-wrap">
      <button
        type="button"
        onClick={() => navigate('/progress')}
        className="arena-side-plaque left"
        aria-label={`${rankName} ${elo.overall} ELO`}
      >
        <span className="arena-plaque-num font-display font-numeric">{elo.overall}</span>
        <span className="arena-plaque-label">{t('dashboard.feltArena.eloLabel')}</span>
        <span className="arena-plaque-sub">
          <RankIcon name={currentRank.name} size={12} />
          {rankName}
        </span>
      </button>

      <div className="arena-side-plaque right">
        <span className="arena-plaque-num font-display font-numeric">{currentStreak}</span>
        <span className="arena-plaque-label">{t('dashboard.feltArena.streakLabel')}</span>
        <span className="arena-plaque-sub">{t('dashboard.feltArena.dayUnit')}</span>
      </div>

      <div className="felt-arena">
        <div className="felt-arena-core relative z-10 flex flex-col items-center justify-center text-center">
          <div className="arena-eyebrow">{t('dashboard.feltArena.eyebrow')}</div>
          <h2 className="arena-title font-display">{t('dashboard.feltArena.pathTitle')}</h2>
          <MottoEngraved text={t('dashboard.feltArena.motto')} />

          <div className="felt-arena-decor">
            <div className="relative" style={{ width: '88px', height: '40px' }}>
              <div style={{ position: 'absolute', transform: 'rotate(-7deg)', left: 0, top: '3px' }}>
                <CardBack size="sm" />
              </div>
              <div style={{ position: 'absolute', transform: 'rotate(5deg)', left: '20px', top: 0 }}>
                <CardBack size="sm" />
              </div>
            </div>
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <Chip amount={currentStreak} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
            </div>
          </div>

        </div>
        <p className="arena-note hidden sm:block">{statusNote}</p>
      </div>
    </div>
  );
}
