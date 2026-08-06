import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { VARIANT_CONFIG } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';
import { cn } from '@/shared/utils/cn';

interface VariantRuleInfo {
  deckSize?: number;
  handRanking?: {
    flushBeatsStraight?: boolean;
    pairBeatsAnyAceKing?: boolean;
  };
  positionDynamics?: {
    sbAnte?: boolean;
    sbFirstActionPostflop?: boolean;
  };
  [key: string]: unknown;
}

interface VariantRuleBannerProps {
  variant: PokerVariant;
  rules?: VariantRuleInfo;
  compact?: boolean;
  className?: string;
}

/**
 * 变体规则差异提示组件
 * 
 * 用于在理论学院和策略学院的课程详情页顶部显示变体特有的规则差异。
 * 
 * @example
 * ```tsx
 * <VariantRuleBanner 
 *   variant="short-deck" 
 *   rules={{ 
 *     deckSize: 36,
 *     handRanking: { flushBeatsStraight: true } 
 *   }} 
 * />
 * ```
 */
export function VariantRuleBanner({ variant, rules, compact, className }: VariantRuleBannerProps) {
  // Standard 变体不显示规则差异提示
  if (variant === 'standard') return null;
  
  const config = VARIANT_CONFIG[variant];
  
  // 收集规则差异列表
  const rulesList: string[] = [];
  
  if (rules?.deckSize) {
    rulesList.push(`${rules.deckSize}张牌`);
  }
  if (rules?.handRanking?.flushBeatsStraight) {
    rulesList.push('同花 > 顺子');
  }
  if (rules?.handRanking?.pairBeatsAnyAceKing) {
    rulesList.push('口袋对 > AKo');
  }
  if (rules?.positionDynamics?.sbAnte) {
    rulesList.push('SB 强制 Ante');
  }
  if (rules?.positionDynamics?.sbFirstActionPostflop) {
    rulesList.push('翻后 SB 先行动');
  }
  
  // 如果没有规则差异信息，返回 null
  if (rulesList.length === 0) return null;
  
  // 紧凑模式
  if (compact) {
    return (
      <div className={cn('mb-4 rounded-lg border border-felt-700 bg-felt-900/20 p-4 dark:border-felt-800', className)}>
        <div className="flex items-center gap-2 font-medium mb-1">
          <span>{config.icon}</span>
          {config.name}专属规则
        </div>
        <p className="text-sm text-muted-foreground">
          规则差异：{rulesList.join(' · ')}
        </p>
      </div>
    );
  }
  
  // 完整模式
  return (
    <Card className={cn('mb-6 border-felt-700 bg-felt-900/10 dark:border-felt-800', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{config.icon}</span>
          {config.name}专属规则
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          {rulesList.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export type VariantRuleBannerComponent = typeof VariantRuleBanner;
