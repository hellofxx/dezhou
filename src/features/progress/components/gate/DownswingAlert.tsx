import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingDown, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../../store';

/**
 * P2-5.5: 下风期检测提示卡片。
 *
 * 当 `progressStore.emotion.isDownswing === true`（最近 3 天正确率连续下降）时
 * 在 Dashboard 渲染此卡片，提供简短建议与跳转到 `local-mental-tilt-recognition`
 * 课程（P2-1 模块 6 情绪管理）的按钮。
 *
 * 当 isDownswing=false 时不渲染任何内容。
 */
export default function DownswingAlert() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDownswing = useProgressStore((s) => s.emotion.isDownswing);
  const accuracyHistory = useProgressStore((s) => s.emotion.accuracyHistory);

  if (!isDownswing) return null;

  // 取最近 3 天数据用于展示下降趋势
  const last3 = accuracyHistory.slice(-3);
  const formatPct = (acc: number) => `${Math.round(acc * 100)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-[var(--warning)]/40 bg-[var(--warning)]/10 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--warning)]/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-[var(--ivory)]">
                  {t('downswing.title', { defaultValue: '检测到下风期' })}
                </h3>
                <p className="text-sm text-[var(--ivory-muted)] mt-1">
                  {t('downswing.message', {
                    defaultValue: '最近 3 天正确率持续下降，这可能是疲劳或心态波动的信号。建议短暂休息或复习情绪管理课程。',
                  })}
                </p>
                {last3.length === 3 && (
                  <div className="flex items-center gap-2 mt-2 text-xs font-numeric text-[var(--ivory-dim)]">
                    <span>{formatPct(last3[0]!.accuracy)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{formatPct(last3[1]!.accuracy)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-[var(--warning)]">{formatPct(last3[2]!.accuracy)}</span>
                  </div>
                )}
              </div>
          </div>
          <div className="shrink-0">
            <Button
              onClick={() => navigate('/academy/lesson/local-mental-tilt-recognition')}
              className="bg-[var(--brass-bright)] text-[var(--felt-deep)] hover:opacity-90 gap-1.5"
              size="sm"
            >
              {t('downswing.viewLesson', { defaultValue: '查看应对指南' })}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
