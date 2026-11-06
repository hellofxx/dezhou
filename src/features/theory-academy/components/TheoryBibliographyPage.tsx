import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '@/shared/components/layout/BackLink';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { useTheoryContentBundle } from '../hooks/useTheoryContentBundle';
import { TheoryBibliography } from './TheoryBibliography';
import { getTheoryBibliographyEntries } from './theoryOptionalSources';

export default function TheoryBibliographyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const contentReady = useTheoryContentBundle('glossary');
  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <BackLink onClick={() => navigate('/theory')} label={t('theory.title')} variant="pill" />
        {contentReady ? (
          <TheoryBibliography entries={getTheoryBibliographyEntries()} />
        ) : (
          <ComponentSkeleton />
        )}
      </div>
    </div>
  );
}
