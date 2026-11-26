import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface HelpSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function HelpSearch({ query, onQueryChange }: HelpSearchProps) {
  const { t } = useTranslation();
  const inputId = 'help-search';
  const hintId = 'help-search-hint';

  return (
    <div className="panel help-search" role="search" aria-labelledby={`${inputId}-label`}>
      <div className="help-search-main">
        <label id={`${inputId}-label`} htmlFor={inputId} className="help-search-label">
          {t('help.search.label')}
        </label>
        <p id={hintId} className="help-search-hint">
          {t('help.search.hint')}
        </p>
      </div>
      <div className="help-search-control">
        <Search className="help-search-icon" size={16} aria-hidden="true" />
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Escape' || !query) return;
            event.preventDefault();
            onQueryChange('');
          }}
          placeholder={t('help.search.placeholder')}
          aria-describedby={hintId}
          aria-controls="help-results"
          autoComplete="off"
          className="help-search-input"
        />
        {query ? (
          <Button
            type="button"
            variant="quiet"
            size="icon"
            onClick={() => onQueryChange('')}
            aria-label={t('help.search.clear')}
            className="help-search-clear"
          >
            <X size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
