import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatPercentage } from '@/shared/utils/formatters';

interface OddsDisplayProps {
  potOdds: number;
  requiredEquity: number;
  estimatedEquity: number;
  isProfitable: boolean;
  ev: number;
}

function AnimatedNumber({ value, suffix = '%' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value.toFixed(1)}
      initial={{ opacity: 0.5, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="font-mono"
    >
      {value.toFixed(1)}{suffix}
    </motion.span>
  );
}

export function OddsDisplay({ potOdds, requiredEquity, estimatedEquity, isProfitable, ev }: OddsDisplayProps) {
  const marginOfSafety = estimatedEquity - requiredEquity;

  return (
    <div className="space-y-4">
      {/* Main odds display */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[var(--ivory-muted)] font-normal">底池赔率</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-5xl font-bold ${isProfitable ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            <AnimatedNumber value={potOdds} />
          </div>
          <p className="mt-2 text-xs text-[var(--ivory-dim)]">
            你需要至少 {formatPercentage(requiredEquity)} 的胜率来盈利
          </p>
        </CardContent>
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">需要胜率</p>
            <p className="text-xl font-bold text-[var(--warning)] font-mono">
              <AnimatedNumber value={requiredEquity} />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">估算胜率</p>
            <p className="text-xl font-bold text-[var(--info)] font-mono">
              <AnimatedNumber value={estimatedEquity} />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">期望值 (EV)</p>
            <p className={`text-xl font-bold font-mono ${ev >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {ev >= 0 ? '+' : ''}{ev.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">安全边际</p>
            <p className={`text-xl font-bold font-mono ${marginOfSafety >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {marginOfSafety >= 0 ? '+' : ''}{marginOfSafety.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call recommendation */}
      <Card className={`${isProfitable ? 'border-[var(--success)]/30 bg-[var(--success)]/5' : 'border-[var(--danger)]/30 bg-[var(--danger)]/5'}`}>
        <CardContent className="p-4 flex items-center gap-3">
          {isProfitable ? (
            <>
              <CheckCircle className="w-8 h-8 text-[var(--success)] shrink-0" />
              <div>
                <p className="font-semibold text-[var(--success)]">建议跟注</p>
                <p className="text-sm text-[var(--ivory-muted)]">
                  你的估算胜率 ({formatPercentage(estimatedEquity)}) 高于底池赔率 ({formatPercentage(requiredEquity)})，长期有利可图
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-[var(--danger)] shrink-0" />
              <div>
                <p className="font-semibold text-[var(--danger)]">建议弃牌</p>
                <p className="text-sm text-[var(--ivory-muted)]">
                  你的估算胜率 ({formatPercentage(estimatedEquity)}) 低于底池赔率 ({formatPercentage(requiredEquity)})，跟注会亏损
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
