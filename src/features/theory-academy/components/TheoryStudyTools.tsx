import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookMarked, Search, Tags } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { useTheoryContentBundle } from '../hooks/useTheoryContentBundle';
import { TheorySearch } from './TheorySearch';
import { TheoryGlossary } from './TheoryGlossary';
import { TheoryBibliography } from './TheoryBibliography';
import {
  getTheoryBibliographyEntries,
  getTheoryGlossaryTerms,
} from './theoryOptionalSources';

type ToolMode = 'search' | 'glossary' | 'bibliography';

/**
 * 首页学习工具入口（搜索 / 术语表 / 参考书目）。
 *
 * 三个入口共用同一个 Dialog 宿主：一次只开一个弹层，避免层叠与焦点竞争。
 * 数据来自只读源（目录摘要 + 术语/书目静态数据）；术语与书目文件尚未落地时，
 * 各自组件走空态文案，不会抛错。
 */
export function TheoryStudyTools() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ToolMode | null>(null);
  const contentReady = useTheoryContentBundle('glossary');
  const glossaryTerms = getTheoryGlossaryTerms();
  const bibliography = getTheoryBibliographyEntries();

  const tools: { mode: ToolMode; label: string; Icon: typeof Search }[] = [
    { mode: 'search', label: t('theory.search.title'), Icon: Search },
    { mode: 'glossary', label: t('theory.glossary.title'), Icon: Tags },
    { mode: 'bibliography', label: t('theory.bibliography.title'), Icon: BookMarked },
  ];

  const titleByMode: Record<ToolMode, string> = {
    search: t('theory.search.title'),
    glossary: t('theory.glossary.title'),
    bibliography: t('theory.bibliography.title'),
  };

  return (
    <>
      <div role="group" aria-label={t('theory.search.title')} className="flex flex-wrap gap-2">
        {tools.map(({ mode: toolMode, label, Icon }) => (
          <button
            key={toolMode}
            type="button"
            onClick={() => setMode(toolMode)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/50 px-3 text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
          >
            <Icon className="w-3.5 h-3.5 text-[var(--brass-bright)]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => setMode(open ? mode : null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-[var(--ivory)]">
              {mode ? titleByMode[mode] : ''}
            </DialogTitle>
          </DialogHeader>
          {mode !== null && !contentReady ? (
            <ComponentSkeleton />
          ) : (
            <>
              {mode === 'search' && <TheorySearch onNavigate={() => setMode(null)} />}
              {mode === 'glossary' && <TheoryGlossary terms={glossaryTerms} />}
              {mode === 'bibliography' && <TheoryBibliography entries={bibliography} />}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
