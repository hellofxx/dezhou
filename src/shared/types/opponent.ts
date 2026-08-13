/** 对手统计数据（HUD 常用指标） */
export interface OpponentStats {
  vpip: number;           // 自愿入池率（%）
  pfr: number;            // 翻前加注率（%）
  af: number;             // 激进度因子
  threeBetPercent: number; // 3-Bet频率（%）
  foldToCBet: number;     // 面对C-Bet弃牌率（%）
  cbetFrequency: number;  // C-Bet频率（%）
}

// 对手形象
export interface OpponentProfile {
  id: string;             // 'tag' | 'lag' | 'nit' | 'maniac' | 'calling_station' | 'unknown'
  name: string;           // 完整名称如 "TAG (紧凶)"
  shortName: string;      // 短标签如 "TAG"
  description: string;    // 一句话描述
  color: string;          // 主题色（hex）
  icon: string;           // emoji 图标
  stats: OpponentStats;
  tendencies: string[];   // 行为特征列表
  exploitableBy: string[]; // 可利用方式列表
}
