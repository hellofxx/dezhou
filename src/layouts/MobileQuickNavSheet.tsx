/**
 * 移动端训练快捷 Sheet（底部导航「训练」按钮的弹出面板）
 *
 * @module layouts/MobileQuickNavSheet
 * @description 底栏改为「首页 / 训练 / 学院 / 理论 / 题库 / 进度」六项后，四个训练入口
 * （手牌范围训练 / 赔率计算器 / GTO 模拟器 / 牌局复盘）收敛到本 Sheet。
 * 形态复用 MobileFeedbackSheet（`.dealer-slip dealer-slip--sheet` 纸张材质 +
 * Radix Dialog 提供的 Escape 关闭 / 焦点陷阱 / 焦点归还 / 关闭按钮），
 * 本组件只负责入口列表与点击后的导航 + 关闭。
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bot, Calculator, ChevronRight, ClipboardList, Target } from 'lucide-react';
import { MobileFeedbackSheet } from '@/shared/components/feedback/MobileFeedbackSheet';

const ENTRIES = [
  { labelKey: 'nav.rangeTrainer', path: '/range-trainer', icon: Target },
  { labelKey: 'nav.potOdds', path: '/pot-odds', icon: Calculator },
  { labelKey: 'nav.gtoSimulator', path: '/gto-simulator', icon: Bot },
  { labelKey: 'nav.handHistory', path: '/hand-history', icon: ClipboardList },
] as const;

interface MobileQuickNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileQuickNavSheet({ open, onOpenChange }: MobileQuickNavSheetProps) {
  const { t } = useTranslation();

  return (
    <MobileFeedbackSheet
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={t('nav.quickNavTitle')}
    >
      <ul className="space-y-1">
        {ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <li key={entry.path}>
              <Link
                to={entry.path}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--ivory)] transition-colors hover:bg-[var(--surface-raised)]"
              >
                <Icon size={18} className="shrink-0 text-[var(--brass)]" aria-hidden="true" />
                <span className="flex-1 truncate">{t(entry.labelKey)}</span>
                <ChevronRight size={16} className="shrink-0 text-[var(--ivory-muted)]" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </MobileFeedbackSheet>
  );
}
