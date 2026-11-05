import type { TheorySection } from '../../../../../types';

// T2 单挑赔率策略：翻前开池尺度速查表 + 两条决策树（EV 三分支、OOP 风险分层）。
// 只追加到章节 content 尾部；块内 token 一律走 theory.block.<chapterId>.<段号> 的 i18n key，
// 数据层不存文案，同一份数据服务 zh / en。
export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't2hu-odds': [
    {
      type: 'text',
      content: '翻前 SB 开池尺度与 BB 跟注所需胜率速查：底池 = 开池总额 + BB 已投的 1BB，跟注额 = 开池总额 − 1BB。尺度越大，BB 的跟注线越高——这就是大尺度开池会收窄对手跟注范围的数学原因。',
      data: {
        kind: 'table',
        headers: ['open (BB)', 'call (BB)', 'equity'],
        rows: [
          ['2', '1', '25.0%'],
          ['2.5', '1.5', '30.0%'],
          ['3', '2', '33.3%'],
          ['4', '3', '37.5%'],
          ['5', '4', '40.0%'],
        ],
      },
    },
  ],
  't2hu-ev': [
    {
      type: 'text',
      content: 'EV 三分支的决策流程：把弃牌、跟注、加注各写成一个数字，比较大小而不是比较是否为正。弃牌的 EV 恒为 0，它是其余分支的对照基准。',
      data: {
        kind: 'decision-tree',
        rootId: 'start',
        nodes: [
          { id: 'start', labelKey: 'theory.block.t2hu-ev.9.node.start' },
          { id: 'fold', labelKey: 'theory.block.t2hu-ev.9.node.fold' },
          { id: 'call', labelKey: 'theory.block.t2hu-ev.9.node.call' },
          { id: 'raise', labelKey: 'theory.block.t2hu-ev.9.node.raise' },
          { id: 'pick', labelKey: 'theory.block.t2hu-ev.9.node.pick' },
        ],
        edges: [
          { from: 'start', to: 'fold', labelKey: 'theory.block.t2hu-ev.9.edge.fold' },
          { from: 'start', to: 'call', labelKey: 'theory.block.t2hu-ev.9.edge.call' },
          { from: 'start', to: 'raise', labelKey: 'theory.block.t2hu-ev.9.edge.raise' },
          { from: 'fold', to: 'pick', labelKey: 'theory.block.t2hu-ev.9.edge.done' },
          { from: 'call', to: 'pick', labelKey: 'theory.block.t2hu-ev.9.edge.done' },
          { from: 'raise', to: 'pick', labelKey: 'theory.block.t2hu-ev.9.edge.done' },
        ],
      },
    },
  ],
  't2hu-risk': [
    {
      type: 'text',
      content: '翻后无位置（BB）的风险分配决策树：按这手牌能承受多少筹码把范围分层，再决定过牌后加注、过牌后跟注还是过牌后放弃。位置劣势靠分层补偿，而不是靠每条街都加注。',
      data: {
        kind: 'decision-tree',
        rootId: 'start',
        nodes: [
          { id: 'start', labelKey: 'theory.block.t2hu-risk.8.node.start' },
          { id: 'strong', labelKey: 'theory.block.t2hu-risk.8.node.strong' },
          { id: 'medium', labelKey: 'theory.block.t2hu-risk.8.node.medium' },
          { id: 'air', labelKey: 'theory.block.t2hu-risk.8.node.air' },
          { id: 'xr', labelKey: 'theory.block.t2hu-risk.8.node.xr' },
          { id: 'cc', labelKey: 'theory.block.t2hu-risk.8.node.cc' },
          { id: 'fold', labelKey: 'theory.block.t2hu-risk.8.node.fold' },
        ],
        edges: [
          { from: 'start', to: 'strong', labelKey: 'theory.block.t2hu-risk.8.edge.strong' },
          { from: 'start', to: 'medium', labelKey: 'theory.block.t2hu-risk.8.edge.medium' },
          { from: 'start', to: 'air', labelKey: 'theory.block.t2hu-risk.8.edge.air' },
          { from: 'strong', to: 'xr', labelKey: 'theory.block.t2hu-risk.8.edge.xr' },
          { from: 'medium', to: 'cc', labelKey: 'theory.block.t2hu-risk.8.edge.cc' },
          { from: 'air', to: 'fold', labelKey: 'theory.block.t2hu-risk.8.edge.fold' },
        ],
      },
    },
  ],
};
