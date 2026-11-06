import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { BookMarked, ExternalLink } from 'lucide-react';
import { getLevelSummaries } from '../utils/academyMeta';
import { resolveLevelTitle } from '../utils/titleKeys';
import {
  STRATEGY_BIBLIOGRAPHY,
  groupStrategyBibliographyByLevel,
  type StrategyBibliographyEntry,
} from '../data/bibliography';

/** 书目注释按 key 解析；文案未就绪时不渲染空段落（不冒整串 key） */
function BibliographyNote({ entry }: { entry: StrategyBibliographyEntry }) {
  const { t } = useTranslation();
  const note = t(entry.noteKey, { defaultValue: '' });
  if (!note) return null;
  return <p className="mt-1 text-xs leading-relaxed text-[var(--ivory-dim)]">{note}</p>;
}

/**
 * 策略学院参考书目（只读）。
 *
 * 数据来自 `data/bibliography.ts`（内容侧维护），按 Level 聚合展示；页面不抓取、不检索、
 * 不写入任何状态，站内也不复制原文。理论学院书目在 `/theory/bibliography` 单列，互不复制。
 */
export default function StrategyBibliographyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = groupStrategyBibliographyByLevel();
  const levelSummaries = getLevelSummaries();

  const levelHeading = (level: number): string =>
    levelSummaries
      .filter((summary) => summary.level === level)
      .map((summary) => resolveLevelTitle(t, summary))
      .join(' · ');

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto w-full max-w-3xl py-6 space-y-5">
        <BackLink
          onClick={() => navigate('/academy')}
          label={t('academy.bibliography.backToAcademy')}
          variant="pill"
        />

        <section className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden">
          <div className="p-5 md:p-6 space-y-2">
            <h2 className="font-display text-2xl text-[var(--ivory)]">
              {t('academy.bibliography.title')}
            </h2>
            <p className="text-sm text-[var(--ivory-dim)]">
              {t('academy.bibliography.subtitle')}
            </p>
            <p className="font-numeric text-[11px] text-[var(--ivory-muted)]">
              {t('academy.bibliography.count', { count: STRATEGY_BIBLIOGRAPHY.length })}
            </p>
            <Link
              to="/theory/bibliography"
              className={`inline-flex min-h-11 items-center gap-1.5 rounded text-xs text-[var(--brass-text)] hover:text-[var(--brass-bright)] transition-colors ${FOCUS_RING}`}
            >
              {t('academy.bibliography.theoryLink')}
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {groups.length === 0 ? (
          <p className="text-xs text-[var(--ivory-dim)]">{t('academy.bibliography.empty')}</p>
        ) : (
          groups.map((group) => (
            <section
              key={group.level}
              aria-labelledby={`bibliography-level-${group.level}`}
              className="space-y-2"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-numeric text-[11px] text-[var(--brass-text)]">
                  L{group.level}
                </span>
                <SectionLabel as="h3" id={`bibliography-level-${group.level}`}>
                  {levelHeading(group.level)}
                </SectionLabel>
                <span className="font-numeric text-[11px] text-[var(--ivory-muted)]">
                  {group.entries.length}
                </span>
              </div>
              <ul className="space-y-2">
                {group.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/50 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <BookMarked
                        className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--ivory)] leading-snug">{entry.title}</p>
                        <p className="text-[11px] text-[var(--ivory-muted)]">{entry.author}</p>
                        <BibliographyNote entry={entry} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
