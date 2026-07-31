import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import type { TheoryChapter } from '../types';

interface NextChapterNavProps {
  nextChapter: TheoryChapter | undefined;
  /** 下一章所属 Level 是否已解锁（含调试解锁旁路，由父组件计算） */
  unlocked: boolean;
}

/**
 * 「下一章」导航（P1F-02）：getNextChapter 跨 Level 顺延时，若目标章节所属
 * Level 未解锁，点击会被章节页门禁 Navigate 静默弹回 /theory——因此渲染前
 * 校验解锁态，未解锁时降级为不可点击的提示文案而非按钮。
 */
export function NextChapterNav({ nextChapter, unlocked }: NextChapterNavProps) {
  const navigate = useNavigate();
  if (!nextChapter) return null;

  if (!unlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs text-[var(--ivory-muted)]">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        完成本级剩余章节后解锁：{nextChapter.title}
      </span>
    );
  }

  return (
    <button
      onClick={() => navigate(`/theory/chapter/${nextChapter.id}`)}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
    >
      下一章：{nextChapter.title}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
