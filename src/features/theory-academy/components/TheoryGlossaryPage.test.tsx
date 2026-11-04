import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import TheoryGlossaryPage from './TheoryGlossaryPage';

describe('TheoryGlossaryPage', () => {
  it('loads the glossary bundle and renders a translated term', async () => {
    await i18n.changeLanguage('zh');
    render(
      <MemoryRouter>
        <TheoryGlossaryPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('底池赔率')).toBeTruthy();
    });
  });
});
