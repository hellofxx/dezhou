import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
// P1-2.6: 改为从 progress store 读取 ELO 五维分数（0-3000 量纲）
import { useProgressStore } from '../store';
import { getRankForScore } from '@/shared/utils/elo';
import type { EloDimension } from '@/shared/types/elo';

interface DimensionScore {
  dimension: string;
  score: number;
  fullMark: number;
}

/** ELO 维度 → 显示标签映射 */
const ELO_DIMENSION_LABELS: Record<EloDimension, string> = {
  preflop: '翻前',
  postflop: '翻后',
  math: '赔率数学',
  handReading: '牌局阅读',
  mental: '心态一致性',
};

/** 从 ELO 状态构建雷达图数据（0-3000 量纲） */
function buildEloRadarData(elo: {
  preflop: number;
  postflop: number;
  math: number;
  handReading: number;
  mental: number;
}): DimensionScore[] {
  return [
    { dimension: ELO_DIMENSION_LABELS.preflop, score: elo.preflop, fullMark: 3000 },
    { dimension: ELO_DIMENSION_LABELS.postflop, score: elo.postflop, fullMark: 3000 },
    { dimension: ELO_DIMENSION_LABELS.math, score: elo.math, fullMark: 3000 },
    { dimension: ELO_DIMENSION_LABELS.handReading, score: elo.handReading, fullMark: 3000 },
    { dimension: ELO_DIMENSION_LABELS.mental, score: elo.mental, fullMark: 3000 },
  ];
}

export default function WeaknessAnalysis() {
  const { t } = useTranslation();
  const elo = useProgressStore((s) => s.elo);
  const gamesPlayed = elo.gamesPlayed;
  const hasData = gamesPlayed > 0;

  const data = useMemo(() => buildEloRadarData(elo), [elo]);
  const currentRank = useMemo(() => getRankForScore(elo.overall), [elo.overall]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[var(--ivory)]">
              {t('elo.radar.title')}
            </CardTitle>
            {hasData && (
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-display"
                style={{
                  borderColor: `${currentRank.color}55`,
                  color: currentRank.color,
                }}
                title={currentRank.description}
              >
                <span className="text-sm leading-none">{currentRank.icon}</span>
                <span className="font-bold">{currentRank.name}</span>
                <span className="font-numeric text-[var(--ivory)] tabular-nums">
                  {elo.overall}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-[var(--ivory-dim)] mt-0.5">
            {t('elo.radar.subtitle', { games: gamesPlayed })}
          </p>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[280px] flex items-center justify-center text-[var(--ivory-dim)] text-sm">
              {t('elo.radar.empty')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="var(--walnut-border)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: 'var(--ivory-muted)', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 3000]}
                  tick={{ fill: 'var(--ivory-dim)', fontSize: 10 }}
                  axisLine={false}
                  tickCount={4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--walnut-border)',
                    borderRadius: '8px',
                    color: 'var(--ivory)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [
                    `${value ?? 0} ${t('elo.unit')}`,
                    t('elo.radar.scoreLabel'),
                  ]}
                />
                <Radar
                  name={t('elo.radar.scoreLabel')}
                  dataKey="score"
                  stroke={currentRank.color}
                  fill={currentRank.color}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
