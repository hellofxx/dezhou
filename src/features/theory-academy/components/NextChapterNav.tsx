import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { TheoryChapterSummary } from '../types';
import { resolveChapterTitle } from '../utils/titleKeys';

interface NextChapterNavProps {
  nextChapter: TheoryChapterSummary | undefined;
  /** 下一章所属 Level 是否已解锁（含调试解锁旁路，由父组件计算） */
  unlocked: boolean;
}

/**
 * 「下一章」导航（P1F-02）：getNextChapter 跨 Level 顺延时，若目标章节所属
 * Level 未解锁，点击会被章节页门禁 Navigate 静默弹回 /theory——因此渲染前
 * 校验解锁态，未解锁时降级为不可点击的提示文案而非按钮。
 *
 * 主 CTA 走 `Button variant="default"`（金属件，交互状态与黄铜焦点环由 Button 接管）；
 * `whitespace-normal` 覆盖 Button 基类的 nowrap：标题含章节名，窄屏必须允许换行。
 */
export function NextChapterNav({ nextChapter, unlocked }: NextChapterNavProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  if (!nextChapter) return null;

  if (!unlocked) {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 px-4 py-2.5 text-xs text-[var(--ivory-muted)]">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        {t('theory.bridge.lockedHint', { title: resolveChapterTitle(t, nextChapter) })}
      </span>
    );
  }

  return (
    <Button
      variant="default"
      onClick={() => navigate(`/theory/chapter/${nextChapter.id}`)}
      className="min-h-11 whitespace-normal"
    >
      {t('theory.bridge.nextChapterLabel', { title: resolveChapterTitle(t, nextChapter) })}
      <ArrowRight className="w-4 h-4" />
    </Button>
  );
}
