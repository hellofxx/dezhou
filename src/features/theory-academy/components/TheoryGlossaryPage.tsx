import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '@/shared/components/layout/BackLink';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { useTheoryContentBundle } from '../hooks/useTheoryContentBundle';
import { TheoryGlossary } from './TheoryGlossary';
import { getTheoryGlossaryTerms } from './theoryOptionalSources';

export default function TheoryGlossaryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const contentReady = useTheoryContentBundle('glossary');
  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <BackLink onClick={() => navigate('/theory')} label={t('theory.title')} variant="pill" />
        {contentReady ? <TheoryGlossary terms={getTheoryGlossaryTerms()} /> : <ComponentSkeleton />}
      </div>
    </div>
  );
}
