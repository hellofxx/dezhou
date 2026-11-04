import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GitBranch, Table2 } from 'lucide-react';
import { GRID_RANKS } from '@/shared/constants/poker';
import { getHandFromGrid } from '@/shared/utils/rangeParser';
import { cn } from '@/shared/utils/cn';
import type {
  TheoryDecisionTreeBlockData,
  TheoryRangeAction,
  TheoryRangeMatrixBlockData,
  TheoryRichBlockData,
  TheoryTableBlockData,
} from '../types';

/**
 * 正文富文本块渲染（只读）：表格 / 范围矩阵 / 决策树。
 *
 * 契约：
 * - 数据层只存语言中立 token / 数字 / i18n key，本组件经 t() 逐项解析，同一份数据服务 zh / en
 * - 语义原生：表格与矩阵用 <table> + <caption>（表头 <th scope>），决策树用嵌套 <ul>/<li>
 * - 单元格读屏文本（手牌 · 权重 · 动作）以 sr-only 文本提供，不用 td 上的 aria-label
 *   （ARIA in HTML 不允许 td 承载可访问名）
 * - 只读：不接交互回调、不写 store；不渲染 h1（页面标题由布局持有）
 * - 宽度：表格容器 overflow-x-auto、矩阵 table-fixed + 极小字号，375px 下页面不产生横向溢出
 */

interface TheoryRichBlockProps {
  data: TheoryRichBlockData;
}

/** 数据层 token 判定：含点且无空白的字符串按 i18n key 解析，其余按字面量渲染 */
const KEY_LIKE = /^[A-Za-z][\w-]*(\.[\w-]+)+$/;

function resolveToken(t: TFunction, token: string): string {
  return KEY_LIKE.test(token) ? t(token, { defaultValue: token }) : token;
}

/** 缺失 key 时退回语言中立动作记号（bet / check / all-in 三个 key 尚待内容侧补齐） */
const ACTION_FALLBACK: Record<TheoryRangeAction, string> = {
  raise: 'RAISE',
  bet: 'BET',
  call: 'CALL',
  check: 'CHECK',
  fold: 'FOLD',
  'all-in': 'ALL-IN',
  mixed: 'MIXED',
};

/** 动作 → 档位色（语义 token，非霓虹） */
const ACTION_CLASS: Record<TheoryRangeAction, string> = {
  raise: 'bg-[var(--brass)]/25 text-[var(--brass-bright)]',
  bet: 'bg-[var(--poker-info)]/20 text-[var(--poker-info)]',
  call: 'bg-[var(--poker-success)]/20 text-[var(--poker-success)]',
  check: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)]',
  fold: 'bg-transparent text-[var(--ivory-dim)]/50',
  'all-in': 'bg-[var(--poker-terra)]/25 text-[var(--poker-terra-bright)]',
  mixed: 'bg-[var(--brass-deep)]/25 text-[var(--brass-text)]',
};

function actionLabel(t: TFunction, action: TheoryRangeAction): string {
  return t(`theory.block.action.${action}`, { defaultValue: ACTION_FALLBACK[action] });
}

/** 块标题栏：图标 + 名称（统一三个块的视觉骨架） */
function BlockHeading({ icon: Icon, label }: { icon: typeof Table2; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--brass-text)] font-semibold">
        {label}
      </span>
    </div>
  );
}

/** 按 kind 分派渲染富文本块 */
export function TheoryRichBlock({ data }: TheoryRichBlockProps) {
  switch (data.kind) {
    case 'table':
      return <TheoryTableBlock data={data} />;
    case 'range-matrix':
      return <TheoryRangeMatrixBlock data={data} />;
    case 'decision-tree':
      return <TheoryDecisionTreeBlock data={data} />;
    default:
      return null;
  }
}

/** 表格块：原生 <table> + <caption>，窄屏容器内横向滚动（页面不溢出） */
function TheoryTableBlock({ data }: { data: TheoryTableBlockData }) {
  const { t } = useTranslation();
  const columnCount = Math.max(1, data.headers.length);

  return (
    <figure className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/60 p-3">
      <BlockHeading icon={Table2} label={t('theory.block.table')} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-left">
          {data.captionKey && (
            <caption className="caption-top text-left text-[11px] text-[var(--ivory-muted)] pb-1">
              {t(data.captionKey, { defaultValue: data.captionKey })}
            </caption>
          )}
          <thead>
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-2 py-1.5 text-[11px] font-semibold text-[var(--ivory)] border-b border-[var(--walnut-border)] whitespace-nowrap"
                >
                  {resolveToken(t, header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--walnut-border)]/40 last:border-b-0">
                {Array.from({ length: columnCount }, (_, colIndex) => (
                  <td key={colIndex} className="px-2 py-1.5 text-xs text-[var(--ivory-dim)] align-top">
                    {resolveToken(t, row[colIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** 范围矩阵：13×13 固定表格，单元格显示手牌记号，权重用不透明度表达 */
function TheoryRangeMatrixBlock({ data }: { data: TheoryRangeMatrixBlockData }) {
  const { t } = useTranslation();
  const cellsByHand = new Map(data.cells.map((cell) => [cell.hand, cell]));
  const usedActions = [...new Set(data.cells.filter((c) => c.weight > 0).map((c) => c.action))];

  return (
    <figure className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/60 p-3">
      <BlockHeading icon={Table2} label={t('theory.block.rangeMatrix')} />
      <table className="w-full table-fixed border-collapse" aria-label={t('theory.block.rangeMatrix')}>
        {data.captionKey && (
          <caption className="caption-top text-left text-[11px] text-[var(--ivory-muted)] pb-1">
            {t(data.captionKey, { defaultValue: data.captionKey })}
          </caption>
        )}
        <tbody>
          {GRID_RANKS.map((rowRank, row) => (
            <tr key={rowRank}>
              {GRID_RANKS.map((colRank, col) => {
                const hand = getHandFromGrid(row, col);
                const cell = cellsByHand.get(hand);
                const weight = cell?.weight ?? 0;
                const action = cell?.action ?? 'fold';
                return (
                  <td
                    key={colRank}
                    className={cn(
                      'text-center align-middle font-mono text-[8px] leading-none py-[3px]',
                      weight > 0 ? ACTION_CLASS[action] : 'text-[var(--ivory-dim)]/35',
                    )}
                    style={
                      weight > 0
                        ? { opacity: 0.45 + (Math.min(100, weight) / 100) * 0.55 }
                        : undefined
                    }
                  >
                    <span aria-hidden="true">{hand}</span>
                    <span className="sr-only">
                      {`${hand} · ${weight}% · ${actionLabel(t, action)}`}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {usedActions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ivory-muted)]">
            {t('theory.block.legend')}
          </span>
          {usedActions.map((action) => (
            <span
              key={action}
              className="inline-flex items-center gap-1.5 text-[10px] text-[var(--ivory-dim)]"
            >
              <span
                aria-hidden="true"
                className={cn('w-2.5 h-2.5 rounded-[2px]', ACTION_CLASS[action])}
              />
              {actionLabel(t, action)}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

/** 决策树：从 rootId 递归展开为嵌套列表，边上的 labelKey 作为分支条件前置 */
function TheoryDecisionTreeBlock({ data }: { data: TheoryDecisionTreeBlockData }) {
  const { t } = useTranslation();
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  const edgesByFrom = new Map<string, { to: string; labelKey: string }[]>();
  for (const edge of data.edges) {
    const list = edgesByFrom.get(edge.from) ?? [];
    list.push({ to: edge.to, labelKey: edge.labelKey });
    edgesByFrom.set(edge.from, list);
  }
  const root = nodeById.get(data.rootId);

  return (
    <figure className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/60 p-3">
      <BlockHeading icon={GitBranch} label={t('theory.block.decisionTree')} />
      {data.captionKey && (
        <p className="text-[11px] text-[var(--ivory-muted)] mb-1.5">
          {t(data.captionKey, { defaultValue: data.captionKey })}
        </p>
      )}
      {root ? (
        <ul className="space-y-1">
          <DecisionTreeNode
            nodeId={root.id}
            nodeById={nodeById}
            edgesByFrom={edgesByFrom}
            depth={0}
          />
        </ul>
      ) : null}
    </figure>
  );
}

/** 单个节点 + 其分支（深度上限 12，防御数据回环导致无限递归） */
function DecisionTreeNode({
  nodeId,
  conditionKey,
  nodeById,
  edgesByFrom,
  depth,
}: {
  nodeId: string;
  conditionKey?: string;
  nodeById: Map<string, { id: string; labelKey: string }>;
  edgesByFrom: Map<string, { to: string; labelKey: string }[]>;
  depth: number;
}) {
  const { t } = useTranslation();
  const node = nodeById.get(nodeId);
  if (!node) return null;
  const branches = depth >= 12 ? [] : edgesByFrom.get(nodeId) ?? [];

  return (
    <li className="text-sm text-[var(--ivory-dim)]">
      {conditionKey && (
        <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--brass-text)] mb-0.5">
          {resolveToken(t, conditionKey)}
        </span>
      )}
      <span className="inline-flex items-start gap-1.5">
        <span aria-hidden="true" className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[var(--brass)] shrink-0" />
        <span className="leading-relaxed">{resolveToken(t, node.labelKey)}</span>
      </span>
      {branches.length > 0 && (
        <ul className="ml-3 pl-2 border-l border-[var(--walnut-border)]/70 space-y-1 mt-1">
          {branches.map((branch, index) => (
            <DecisionTreeNode
              key={`${nodeId}-${branch.to}-${index}`}
              nodeId={branch.to}
              conditionKey={branch.labelKey}
              nodeById={nodeById}
              edgesByFrom={edgesByFrom}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
