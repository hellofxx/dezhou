/** 帮助中心模块类型定义 */

/** 模块卡片强调色 */
export type HelpAccent = 'brass' | 'info' | 'success' | 'frost' | 'leather';

/** 文章段落类型 */
export type HelpSectionType = 'paragraph' | 'steps' | 'tip' | 'link';

/** 文章段落 */
export interface HelpSection {
  type: HelpSectionType;
  /** i18n key，不含 help. 前缀 */
  key: string;
  /** steps 类型：子步骤 i18n key 数组 */
  stepKeys?: string[];
  /** link 类型：跳转路由 */
  to?: string;
}

/** 教程文章 */
export interface HelpArticle {
  id: string;
  /** 模块入口路由，用于"去使用"按钮 */
  modulePath: string;
  titleKey: string;
  introKey: string;
  icon: 'target' | 'calculator' | 'gamepad2' | 'graduation-cap' | 'library' | 'puzzle' | 'clipboard-list' | 'bar-chart3' | 'book-open';
  accent: HelpAccent;
  sections: HelpSection[];
}

/** FAQ 条目 */
export interface FaqItem {
  questionKey: string;
  answerKey: string;
}

/** 系统概念卡片图标 key（HELP-04：字面量联合，编译期校验） */
export type ConceptIconKey = 'gauge' | 'flame' | 'repeat' | 'award' | 'clock' | 'database';

/** 系统概念卡片 */
export interface ConceptCard {
  key: string;
  iconKey: ConceptIconKey;
}
