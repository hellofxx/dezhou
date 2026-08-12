import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { CORE_MODULES } from './moduleRegistry';

// ===== core 模块静态导入（启动 bundle，保证布局/导航/全局反馈首屏可用）=====
// 修改 CORE_MODULES 时此处须同步增删，类型 satisfies Record<CoreKey, unknown> 强制一致性。
import navZh from './locales/zh/nav.json';
import navEn from './locales/en/nav.json';
import commonZh from './locales/zh/common.json';
import commonEn from './locales/en/common.json';
import dashboardZh from './locales/zh/dashboard.json';
import dashboardEn from './locales/en/dashboard.json';
import academyZh from './locales/zh/academy.json';
import academyEn from './locales/en/academy.json';
import theoryZh from './locales/zh/theory.json';
import theoryEn from './locales/en/theory.json';
import variantZh from './locales/zh/variant.json';
import variantEn from './locales/en/variant.json';
import tiltZh from './locales/zh/tilt.json';
import tiltEn from './locales/en/tilt.json';
import streakZh from './locales/zh/streak.json';
import streakEn from './locales/en/streak.json';
import feedbackZh from './locales/zh/feedback.json';
import feedbackEn from './locales/en/feedback.json';

// 课程内容按 Level/变体拆分于 academy-course/ 子目录（对齐 data/lessons/variants 课程代码文件），
// 经 import.meta.glob 静态合并注入 academy 命名空间；t('academy.lessonContent.l1-basics.0') 路径不变。
// 拆分动机：单文件 academy.json 会随内容全量迁移膨胀至 1.5MB，子目录维护性与课程代码一一对应。
const academyCourseZh = import.meta.glob<Record<string, unknown>>('./locales/zh/academy-course/*.json', {
  import: 'default',
  eager: true,
});
const academyCourseEn = import.meta.glob<Record<string, unknown>>('./locales/en/academy-course/*.json', {
  import: 'default',
  eager: true,
});

/** 合并课程内容文件（同顶层 key 深合并；数组/叶子直接覆盖） */
function mergeCourseBundles(
  base: Record<string, unknown>,
  bundles: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const bundle of Object.values(bundles)) {
    for (const [key, value] of Object.entries(bundle)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof merged[key] === 'object' &&
        merged[key] !== null &&
        !Array.isArray(merged[key])
      ) {
        merged[key] = { ...(merged[key] as Record<string, unknown>), ...value };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}

type CoreKey = (typeof CORE_MODULES)[number];

// satisfies 校验：coreZh/coreEn 的 key 集合与 CORE_MODULES 完全一致（缺任一 key 即编译失败）
const coreZh = {
  nav: navZh,
  common: commonZh,
  dashboard: dashboardZh,
  academy: mergeCourseBundles(academyZh, academyCourseZh),
  theory: theoryZh,
  variant: variantZh,
  tilt: tiltZh,
  streak: streakZh,
  feedback: feedbackZh,
} satisfies Record<CoreKey, unknown>;

const coreEn = {
  nav: navEn,
  common: commonEn,
  dashboard: dashboardEn,
  academy: mergeCourseBundles(academyEn, academyCourseEn),
  theory: theoryEn,
  variant: variantEn,
  tilt: tiltEn,
  streak: streakEn,
  feedback: feedbackEn,
} satisfies Record<CoreKey, unknown>;

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: coreZh },
    en: { translation: coreEn },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
  react: {
    // 关键修复：语言切换时 preload.ts 异步补加载 feature 翻译模块，
    // addResourceBundle 注入完成后 store 会 emit 'added'；默认 bindI18nStore 为空不订阅，
    // 导致懒加载模块文案滞留 fallback 语言直到下一次任意渲染（"部分内容滞后更新"根因）。
    // 订阅 store 的 added/removed 事件，资源注入即触发所有 useTranslation 组件重渲染。
    bindI18nStore: 'added removed',
  },
});

export default i18n;
