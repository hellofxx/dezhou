import { describe, expect, it } from 'vitest';
import i18n from './config';
import {
  isTheoryContentBundleLoaded,
  loadTheoryContentBundle,
} from './theoryContent';

describe('theory content bundle loader', () => {
  it('loads the glossary bundle into theory.glossary.* for zh', async () => {
    await i18n.changeLanguage('zh');
    await loadTheoryContentBundle('glossary', 'zh');

    expect(isTheoryContentBundleLoaded('glossary', 'zh')).toBe(true);
    const term = i18n.t('theory.glossary.pot-odds.term');
    expect(term).not.toBe('theory.glossary.pot-odds.term');
    expect(term).toContain('底池赔率');
  });

  it('loads the glossary bundle into theory.glossary.* for en', async () => {
    await loadTheoryContentBundle('glossary', 'en');
    await i18n.changeLanguage('en');

    expect(isTheoryContentBundleLoaded('glossary', 'en')).toBe(true);
    const term = i18n.t('theory.glossary.pot-odds.term');
    expect(term).not.toBe('theory.glossary.pot-odds.term');
    expect(term).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
