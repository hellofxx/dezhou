import type { Transition, Variants } from 'framer-motion';

/**
 * 动效规范单一事实源 — DESIGN_LANGUAGE §8 动效。
 *
 * 所有 framer-motion 动效参数（时长/缓动/预置 variants）必须以本文件为准，
 * 禁止在组件内内联 duration/ease 字面量（v1.5.0 起）。
 * 对应 CSS token 见 globals.css `--poker-ease-*` / `--poker-duration-*`。
 *
 * 用法：
 * - 预置 variants：`variants={SLIDE_UP} initial="hidden" animate="visible" exit="exit"`
 * - 列表 stagger：容器 `variants={staggerContainer(0.06)}`，子项 `variants={staggerItem}`
 * - 路由过渡：`PAGE_TRANSITION`（AppLayout）
 * - 单次触发（shake/pop）：用 `animate` keyframes 数组或切换 target
 */

export const MOTION_DURATION = {
  /** 150–200ms：hover / press / 选中态 / tab 滑动 */
  fast: 0.2,
  /** 250–350ms：面板展开 / 路由切换 / 反馈浮层 */
  standard: 0.3,
  /** 400–600ms：大场景（牌桌入场 / 发牌 / 结果页数字） */
  slow: 0.5,
  /** 1.5–3s：循环呼吸 / 等待 */
  loop: 1.8,
} as const;

type Bezier = [number, number, number, number];

export const MOTION_EASE = {
  /** 默认入场/状态过渡 */
  standard: [0.4, 0, 0.2, 1] as Bezier,
  /** 元素出现（快起慢停） */
  out: [0, 0, 0.2, 1] as Bezier,
  /** 元素退场（慢入快出） */
  in: [0.4, 0, 1, 1] as Bezier,
  /** 弹性回弹 */
  spring: [0.34, 1.56, 0.64, 1] as Bezier,
};

/** 常用过渡对象（组件内 `transition={transitionStandard}`） */
export const transitionFast: Transition = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE.standard,
};
export const transitionStandard: Transition = {
  duration: MOTION_DURATION.standard,
  ease: MOTION_EASE.standard,
};
export const transitionSlow: Transition = {
  duration: MOTION_DURATION.slow,
  ease: MOTION_EASE.out,
};
export const transitionSpring: Transition = {
  duration: MOTION_DURATION.standard,
  ease: MOTION_EASE.spring,
};

/** 淡入淡出（§8.2 fade） */
export const FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionStandard },
  exit: { opacity: 0, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 上滑入场（§8.2 slide-up）— 面板/卡片入场最常见 */
export const SLIDE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitionStandard },
  exit: { opacity: 0, y: -8, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 下滑入场（§8.2 slide-down）— 顶部提示/下拉内容 */
export const SLIDE_DOWN: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: transitionStandard },
  exit: { opacity: 0, y: -8, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 左滑入场（§8.2 slide-left）— 题目切换/列表推进 */
export const SLIDE_LEFT: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitionStandard },
  exit: { opacity: 0, x: -24, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 右滑入场（§8.2 slide-right）— 返回上一步/列表回退 */
export const SLIDE_RIGHT: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitionStandard },
  exit: { opacity: 0, x: 24, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 缩放入场（§8.2 scale-in）— 徽章/弹窗/庄码/反馈卡 */
export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: transitionSpring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/** 旋转（§8.2 rotate）— 箭头/chevron 展开；target `open`/`closed` */
export const ROTATE_180: Variants = {
  closed: { rotate: 0, transition: transitionFast },
  open: { rotate: 180, transition: transitionFast },
};

/** 回弹 pop（§8.2 pop）— 正确答案/成就解锁/连击 */
export const POP: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: [0.8, 1.15, 1],
    transition: { duration: 0.45, ease: MOTION_EASE.spring },
  },
};

/** 摇晃 shake（§8.2 shake）— 错误答案/危险操作；用 `animate="shake"` 触发 */
export const SHAKE: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -4, 4, -3, 3, -1, 1, 0],
    transition: { duration: 0.25, ease: MOTION_EASE.standard },
  },
};

/** 路由过渡（§8.3 路由过渡）：slide-left 入 / slide-right 出 */
export const PAGE_TRANSITION: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitionStandard },
  exit: { opacity: 0, x: -24, transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.in } },
};

/**
 * 列表 stagger 容器（§8.3 列表）。子项统一用 `staggerItem`。
 * @param stagger 步进间隔（秒），默认 0.06，整页最大延迟 ≤600ms 勿超。
 */
export const staggerContainer = (stagger = 0.06): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger },
  },
});

/** 列表项：淡入 + 上滑（配合 staggerContainer） */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitionFast },
};

/** 结果页大数字：fade + slide-up（slow，可配 delay） */
export const RESULT_NUMBER: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitionSlow },
};
