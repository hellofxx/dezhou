import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DrillResultView } from './DrillResultView';

/**
 * DrillResultView 契约（strategy-academy drills 结果页 feature-local 模板）：
 * - 标题必须落在 h3（结果页嵌在课程 / 训练视图内，页面 h1 归整页视图），并渲染 Trophy
 * - 三张 `StatCard`（正确率 / 用时 / 正确题数）承载原统计卡，data-testid 供消费方测试定位
 * - `ctaLabelKey` + `onFinish` 同时提供才渲染主 CTA（PracticeDrill 结果页无主按钮），
 *   主 CTA 走金属族 `Button variant="default"`（V1 收口，平铺黄铜覆盖已删除）
 * - `note` / `extraStats` / `children` 三个插槽按序渲染（差异不做 mode 分支）
 * - `animated` 只包一层入场 motion，不吞内容
 */

const baseProps = {
  correct: 3,
  total: 4,
  timeText: '12.5s',
  titleKey: 'drills.common.complete',
  accuracyLabelKey: 'drills.common.accuracyLabel',
  timeLabelKey: 'drills.common.timeLabel',
  correctLabelKey: 'drills.common.correctLabel',
  ctaLabelKey: 'drills.common.finish',
} as const;

/** 统计卡数值节点（StatCard 用 font-numeric token 承载数值） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

afterEach(() => cleanup());

describe('DrillResultView：结果骨架', () => {
  it('标题为 h3（无 h1），三张统计卡取值正确，CTA 回调 onFinish', () => {
    const onFinish = vi.fn();
    const { container } = render(<DrillResultView {...baseProps} onFinish={onFinish} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.textContent).toBe('训练完成！');
    expect(container.querySelector('h1')).toBeNull();

    expect(statValue('drill-result-accuracy')).toBe('75%');
    expect(statValue('drill-result-time')).toBe('12.5s');
    expect(statValue('drill-result-correct')).toBe('3/4');
    // 标签文案不变（含 Clock / Target 图标的可读名）
    expect(screen.getByText('正确率')).toBeTruthy();
    expect(screen.getByText('用时')).toBeTruthy();
    expect(screen.getByText('正确题数')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '完成训练' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('主 CTA 走金属族 Button default（btn-brass），不再使用平铺黄铜覆盖', () => {
    render(<DrillResultView {...baseProps} onFinish={() => {}} />);
    const cta = screen.getByRole('button', { name: '完成训练' });
    expect(cta.className).toContain('btn-brass');
    expect(cta.className).not.toContain('bg-[var(--brass-fill)]');
  });

  it('total 为 0 时正确率归零，不产生 NaN', () => {
    render(<DrillResultView {...baseProps} total={0} correct={0} />);
    expect(statValue('drill-result-accuracy')).toBe('0%');
    expect(statValue('drill-result-correct')).toBe('0/0');
  });

  it('缺省 CTA props 时不渲染主按钮（PracticeDrill 结果页）', () => {
    render(
      <DrillResultView
        correct={2}
        total={2}
        timeText="3.0s"
        titleKey="academy.drill.completedTitle"
        accuracyLabelKey="academy.drill.accuracy"
        timeLabelKey="academy.drill.avgTime"
        correctLabelKey="academy.drill.correctCount"
      />,
    );
    expect(screen.getByText('实战练习完成！')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('DrillResultView：插槽', () => {
  it('note 渲染在标题下（对手画像计分口径），标题与说明间距为紧凑档', () => {
    render(
      <DrillResultView
        {...baseProps}
        note="两问全对才计为答对"
        onFinish={() => {}}
      />,
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.className).toContain('mb-2');
    expect(screen.getByText('两问全对才计为答对')).toBeTruthy();
  });

  it('extraStats / children 按「附加统计 → 其余区块」顺序渲染', () => {
    render(
      <DrillResultView
        {...baseProps}
        extraStats={<p>压力附加统计</p>}
        onFinish={() => {}}
      >
        <p>薄弱点区块</p>
      </DrillResultView>,
    );
    const extra = screen.getByText('压力附加统计');
    const child = screen.getByText('薄弱点区块');
    const statsRow = screen.getByTestId('drill-result-correct');

    // DOM 顺序：统计卡 → extraStats → children
    expect(statsRow.compareDocumentPosition(extra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(extra.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('animated 只改变外壳，内容与静态一致', () => {
    const { container } = render(<DrillResultView {...baseProps} onFinish={() => {}} animated />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-accuracy')).toBe('75%');
    // framer-motion 入场：初始 opacity 0 写在内联样式上（静态版无此样式）
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe('0');
  });

  it('titleFallback 在缺 key 时兜底标题文案', () => {
    render(
      <DrillResultView
        {...baseProps}
        titleKey="drills.common.__missing__"
        titleFallback="训练完成"
        onFinish={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成');
  });
});
