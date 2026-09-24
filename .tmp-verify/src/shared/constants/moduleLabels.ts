/**
 * 模块标识到 i18n key 的映射。
 *
 * 统一消费方：Dashboard / StatsOverview / ProgressPage / ModuleStatsPage 等
 * 任何需要在 UI 展示「模块名」的地方。返回的是 i18n key，调用方用 t() 解析，
 * 保证中英切换时一处事实源自动跟随。
 */
export const MODULE_LABEL_KEYS: Record<string, string> = {
  'range-trainer': 'nav.rangeTrainer',
  'pot-odds': 'nav.potOdds',
  'gto-simulator': 'nav.gtoSimulator',
  'hand-history': 'nav.handHistory',
  'strategy-academy': 'nav.academy',
  'theory-academy': 'nav.theory',
  'puzzle-trainer': 'nav.puzzle',
};

/** 兜底显示用的模块名（无 i18n 上下文时也可读） */
export const MODULE_LABELS_FALLBACK: Record<string, string> = {
  'range-trainer': '手牌范围训练',
  'pot-odds': '赔率计算器',
  'gto-simulator': 'GTO 模拟器',
  'hand-history': '牌局复盘',
  'strategy-academy': '策略学院',
  'theory-academy': '理论学院',
  'puzzle-trainer': '扑克谜题',
};