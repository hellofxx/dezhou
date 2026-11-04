/** 两院共用的学院类型契约（theory-academy / strategy-academy）。 */

/** 章末/课后小测题：两院结构一致，渲染层 key 覆盖与选项排序共用。 */
export interface AcademyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** 通用桥接卡条目：理论→实践 / 实践→理论共用。 */
export interface AcademyBridgeItem {
  id: string;
  label: string;
  route: string;
}

/** 通用桥接卡 CTA（可选）。 */
export interface AcademyBridgeCta {
  label: string;
  route: string;
}

/** 通用搜索条目：两院搜索壳共用。 */
export interface AcademySearchItem {
  id: string;
  title: string;
  subtitle?: string;
  route: string;
  /** 分区 token（由各院适配器提供，渲染层负责翻译）。 */
  group?: string;
}

/** 通用搜索分区。 */
export interface AcademySearchSection {
  id: string;
  title: string;
  items: AcademySearchItem[];
}

/** 掌握度状态：≥ mastered 已掌握 / ≥ passing 通过 / < passing 待复习 / 无分未测。 */
export type MasteryState = 'mastered' | 'passing' | 'needsReview' | 'untested';

/** 掌握度汇总（首次成绩口径由调用方解析后传入 scores）。 */
export interface MasterySummary {
  mastered: number;
  passing: number;
  needsReview: number;
  untested: number;
  total: number;
  /** 已测项中分数最低者；同分取传入顺序靠前者；无已测项时 undefined。 */
  weakestId: string | undefined;
}
