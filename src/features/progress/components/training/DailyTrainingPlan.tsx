import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ArrowRight, X, ClipboardList, PartyPopper } from 'lucide-react';
import { transitionFast } from '@/shared/utils/motion';
import type { DailyRecommendation } from '../../utils/dailyTrainingPlan';
import { getReasonColor, getTypeIcon, getPriorityColor } from '../../utils/dailyTrainingPlan';

interface DailyTrainingPlanProps {
  recommendations: DailyRecommendation[];
  onDismiss: (id: string) => void;
}

export default function DailyTrainingPlan({ recommendations, onDismiss }: DailyTrainingPlanProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-[var(--brass-bright)]" />
          <h2 className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
            {t('dashboard.dataPlan.title')}
          </h2>
          <span className="ml-auto text-xs text-[var(--ivory-muted)]">
            {t('dashboard.dataPlan.count', { count: recommendations.length })}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-8 text-center">
            <PartyPopper className="w-10 h-10 text-[var(--brass-bright)] mx-auto mb-3" />
            <p className="text-[var(--ivory)] text-sm mb-2">{t('dashboard.dataPlan.allDone')}</p>
            <button
              onClick={() => navigate('/range-trainer')}
              className="text-xs text-[var(--brass-bright)] hover:underline"
            >
              {t('dashboard.dataPlan.freeTrain')} →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {recommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={transitionFast}
                  className={`relative rounded-lg border border-[var(--walnut-border)]/60 border-l-[3px] ${getPriorityColor(rec.priority)} bg-[var(--walnut-raised)]/30 p-3`}
                >
                  <div className="flex items-start gap-3">
                    {/* 类型图标 */}
                    <span className="text-xl shrink-0 mt-0.5">{getTypeIcon(rec.type)}</span>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--ivory)] truncate">
                          {(() => {
                            const resolved = t(rec.title, rec.titleParams);
                            // i18n key 缺失回退：若 i18next 返回原 key 字符串，使用 titleParams.title（数据层硬编码兜底）
                            return resolved === rec.title ? (rec.titleParams?.title ?? resolved) : resolved;
                          })()}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getReasonColor(rec.reason)}`}>
                          {t(`dashboard.dataPlan.reason.${rec.reason}`)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ivory-muted)] mt-0.5 line-clamp-1">
                        {t(rec.description, rec.descParams)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-[var(--ivory-dim)]">
                          ⏱ {rec.estimatedTime}
                        </span>
                        <button
                          onClick={() => navigate(rec.route)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brass-bright)] hover:text-[var(--brass)] transition-colors"
                        >
                          {t('dashboard.dataPlan.start')}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDismiss(rec.id)}
                          className="text-[10px] text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)] transition-colors"
                        >
                          {t('dashboard.dataPlan.skip')}
                        </button>
                      </div>
                    </div>

                    {/* 关闭按钮 */}
                    <button
                      onClick={() => onDismiss(rec.id)}
                      className="shrink-0 p-1 text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
