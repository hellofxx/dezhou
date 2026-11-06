/**
 * 返回入口（共享）。
 *
 * 统一页面/卡片顶部的返回导航，替代各模块自行拼 `ArrowLeft` + 链接/按钮：
 * - `text`：文本链接（12–14px 无底色），页头 / 卡片内的轻量返回
 * - `pill`：胶囊命中区（`px-2` + 圆角），学院与理论工具页的顶部返回
 * - `button`：shadcn `Button`（ghost / `size="sm"`），训练页顶栏的退出 / 返回
 *
 * 三种目标：`to` → react-router `Link`；`onClick` → `<button>`；`historyBack` → `navigate(-1)`。
 * `onClick` 路径完全不触碰 Router 上下文（训练子视图常在无 Router 的测试/嵌入场景渲染）；
 * 仅 `to` 与 `historyBack` 分支依赖 Router，分别落在 `Link` 与 `HistoryBackControl` 内。
 *
 * 无障碍：icon-only 必填 `aria-label`（可见文案同时作为可访问名称）；
 * `min-h-11`（44px）保证触摸目标（DESIGN.md §13.7.4）；
 * focus-visible 用黄铜 60% 交互环；图标 `aria-hidden`，不进入可访问名称。
 */
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { FOCUS_RING_VISIBLE } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

export interface BackLinkProps {
  /** 目标路由：渲染 react-router `Link` */
  to?: string;
  /** 点击回调：渲染 `<button type="button">` */
  onClick?: () => void;
  /** 浏览器返回：点击调用 `navigate(-1)`（渲染 `<button>`） */
  historyBack?: boolean;
  /** 可见文案；icon-only 时同时作为 `aria-label` */
  label: string;
  /** 默认 text */
  variant?: 'text' | 'pill' | 'button';
  /** 默认 sm（text-xs / 图标 14px）；md → text-sm / 图标 16px */
  size?: 'sm' | 'md';
  /** 仅图标（方形 44px 命中区），可访问名称取 `label` */
  iconOnly?: boolean;
  className?: string;
}

const VARIANT_CLASSES = {
  text: 'inline-flex min-h-11 items-center gap-1.5 text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors',
  pill: 'inline-flex min-h-11 items-center gap-1.5 px-2 rounded text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors',
} as const;

const SIZE_CLASSES = {
  text: { sm: 'text-xs', md: 'text-sm' },
  pill: { sm: 'text-xs', md: 'px-3 text-sm' },
} as const;

/** shadcn Button 承载的返回：金属族 ghost + 训练页既有字色 */
const BUTTON_CLASSES = 'min-h-11 text-[var(--ivory-dim)] hover:text-[var(--ivory)]';

/** 独立形态：方形 44px 命中区 + 悬停表面色（与文本/胶囊变体的行内样式不同） */
const ICON_ONLY_CLASSES =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--ivory-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ivory)] transition-colors';

type BackControlProps = Omit<BackLinkProps, 'historyBack'>;

/** 具体形态渲染（不依赖 Router：Link 与 Button/button 二选一） */
function BackControl({
  to,
  onClick,
  label,
  variant = 'text',
  size = 'sm',
  iconOnly = false,
  className,
}: BackControlProps) {
  // 无目标时不渲染空壳控件（避免读屏器出现无动作按钮）
  if (!to && !onClick) return null;

  const iconSize = iconOnly ? 20 : variant === 'button' || size === 'md' ? 16 : 14;
  const content = (
    <>
      <ArrowLeft size={iconSize} aria-hidden="true" className="shrink-0" />
      {iconOnly ? null : label}
    </>
  );
  const ariaProps = iconOnly ? { 'aria-label': label } : {};
  const classes = cn(
    variant === 'button'
      ? BUTTON_CLASSES
      : iconOnly
        ? ICON_ONLY_CLASSES
        : cn(VARIANT_CLASSES[variant], SIZE_CLASSES[variant][size]),
    FOCUS_RING_VISIBLE,
    className,
  );

  if (to) {
    return variant === 'button' ? (
      <Button asChild variant="ghost" size="sm" className={classes}>
        <Link to={to} {...ariaProps}>
          {content}
        </Link>
      </Button>
    ) : (
      <Link to={to} className={classes} {...ariaProps}>
        {content}
      </Link>
    );
  }

  return variant === 'button' ? (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className={classes} {...ariaProps}>
      {content}
    </Button>
  ) : (
    <button type="button" onClick={onClick} className={classes} {...ariaProps}>
      {content}
    </button>
  );
}

/** `historyBack` 分支：useNavigate 只在此子组件调用，保持 Button/button 路径无 Router 依赖 */
function HistoryBackControl(props: Omit<BackControlProps, 'to' | 'onClick'>) {
  const navigate = useNavigate();
  return <BackControl {...props} onClick={() => navigate(-1)} />;
}

export function BackLink({ historyBack = false, ...rest }: BackLinkProps) {
  return historyBack ? <HistoryBackControl {...rest} /> : <BackControl {...rest} />;
}
