/**
 * help-center 模块公共导出
 *
 * 静态教程页，豁免 trainingEvents emit（参照 hand-history「非交互式训练」口径：
 * 本模块不提供交互式训练功能，仅为使用教程与帮助信息，无需向 progress store 报告训练事件）。
 */
export { default as HelpHome } from './components/HelpHome';
export { default as HelpArticle } from './components/HelpArticle';
export type { HelpArticle as HelpArticleType, HelpSection, FaqItem, HelpAccent, HelpSectionType } from './types';
