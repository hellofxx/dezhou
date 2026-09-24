// P0-3: Drill 统一接口契约
// 所有 Drill 组件均通过此接口与父级（CourseView）通信

export interface DrillResult {
  correct: number;
  total: number;
  timeTaken: number; // 毫秒
}

export interface DrillProps {
  onComplete: (result: DrillResult) => void;
  onExit: () => void;
}

// 通用选择题（HandRanking / Outs / PotOdds 复用）
// promptKey / optionsKeys / explanationKey 均为 i18n key，
// 由各 Drill 组件通过 useTranslation 解析。
export interface ChoiceDrillQuestion {
  id: string;
  promptKey: string;          // 题干 i18n key
  optionsKeys: string[];      // 选项 i18n key 列表
  correctIndex: number;       // 正确选项索引
  explanationKey: string;     // 解析 i18n key
}
