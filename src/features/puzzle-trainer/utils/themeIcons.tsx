/**
 * 主题 → Lucide 图标映射。
 *
 * 取代原先挂在 `PuzzleThemeMeta.icon` 上的 emoji 字符：emoji 由各平台 emoji 字体渲染，
 * 与牌室化视觉语言不一致，且在不同系统上尺寸/基线漂移。
 *
 * 约定：
 *  - 图标纯装饰，渲染处一律 `aria-hidden`，主题名称始终由文本承载；
 *  - 图标语义按主题内容选择（见各行注释），不参与判分与排序；
 *  - `Record<PuzzleTheme, LucideIcon>` 全量覆盖：新增主题时 TS 会强制补齐图标。
 */
import {
  Crosshair,
  Drama,
  Droplets,
  Gem,
  Package,
  Shield,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { PuzzleTheme } from '../types';

const THEME_ICONS: Record<PuzzleTheme, LucideIcon> = {
  'preflop-rfi': Target, // 位置开牌范围（瞄准）
  'big-blind-defense': Shield, // 防守大盲
  'three-bet': Zap, // 反加压
  'c-bet': Crosshair, // 持续下注瞄准牌面
  'flush-draw': Droplets, // 同花听牌
  multiway: Users, // 多人底池
  'river-value': Gem, // 河牌价值
  bluff: Drama, // 诈唬（表演）
  'short-stack': Package, // 短筹码包
  icm: Trophy, // 锦标赛决赛桌
};

/** 取主题图标（装饰用，调用方负责 aria-hidden） */
export function getThemeIcon(theme: PuzzleTheme): LucideIcon {
  return THEME_ICONS[theme];
}
