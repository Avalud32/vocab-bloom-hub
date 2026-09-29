import type { PublicWordV1T } from 'server/types';

import {
  entryDescription,
  foldedMeanings,
  leadDefinition,
  localeFirst,
  localeTranslations,
  meaningTitle,
  translationLanguages,
} from '../wordPage';

const entry = (overrides: Partial<PublicWordV1T>): PublicWordV1T =>
  ({ meanings: [], short_translations: [], description: null, ...overrides }) as PublicWordV1T;

const short = (language: string, description: string) =>
  ({ id: 1, language, description, variants_of_words: [] }) as PublicWordV1T['short_translations'][number];

describe('localeTranslations', () => {
  const entries = [
    entry({ short_translations: [short('es', 'flor'), short('ru', 'цветок'), short('ru', 'Цветок ')] }),
    entry({ short_translations: [short('ru', 'цветение'), short('ru', '')] }),
  ];

  it('collects the translations of the locale across the entries, in order, without repeats', () => {
    expect(localeTranslations(entries, 'ru')).toEqual(['цветок', 'цветение']);
    expect(localeTranslations(entries, 'es')).toEqual(['flor']);
  });

  it('answers nothing for English, the language of the headwords, and for a locale without translations', () => {
    expect(localeTranslations(entries, 'en')).toEqual([]);
    expect(localeTranslations(entries, 'de')).toEqual([]);
  });
});

describe('localeFirst', () => {
  it('moves the items of the locale to the front and keeps the order otherwise', () => {
    const items = [short('es', 'a'), short('ru', 'b'), short('fr', 'c'), short('ru', 'd')];
    expect(localeFirst(items, 'ru').map((item) => item.description)).toEqual(['b', 'd', 'a', 'c']);
    expect(localeFirst(items, 'en').map((item) => item.description)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('leadDefinition', () => {
  it('takes the first non-empty definition, falling back to an entry description', () => {
    const meaning = (definition: string) => ({ definition }) as PublicWordV1T['meanings'][number];
    expect(
      leadDefinition([entry({ meanings: [meaning(' ')] }), entry({ meanings: [meaning('to move fast')] })]),
    ).toBe('to move fast');
    expect(leadDefinition([entry({ description: 'a plant' })])).toBe('a plant');
    expect(leadDefinition([entry({})])).toBeUndefined();
  });
});

describe('translationLanguages (issue #520)', () => {
  const entry = (short: string[], meanings: string[][]) =>
    ({
      short_translations: short.map((language, id) => ({ id, language, description: language })),
      meanings: meanings.map((languages, id) => ({
        id,
        translations: languages.map((language, n) => ({ id: n, language, title: language })),
      })),
    }) as unknown as import('server/types').PublicWordV1T;
  const entries = [entry(['ru', 'es'], [['fr', 'ru']]), entry(['de'], [['es', 'zh']])];

  it("lists every language once, the locale's first, the rest as they appear", () => {
    expect(translationLanguages(entries, 'es')).toEqual(['es', 'ru', 'fr', 'de', 'zh']);
    expect(translationLanguages(entries, 'en')).toEqual(['ru', 'es', 'fr', 'de', 'zh']);
  });

  it('is empty for a headword without translations', () => {
    expect(translationLanguages([entry([], [[]])], 'ru')).toEqual([]);
  });
});

// issue #538: what a page says twice is said once
describe('meaningTitle', () => {
  it('keeps a title that names the meaning in words of its own', () => {
    expect(meaningTitle({ title: 'move quickly', definition: 'to go faster than a walk' })).toBe(
      'move quickly',
    );
  });

  it('drops a title that is the start of the definition, cut off or not', () => {
    expect(meaningTitle({ title: 'a race run on foot', definition: 'a race run on foot' })).toBeNull();
    expect(
      meaningTitle({
        title: 'a play in which a player attempts to carry the ball through...',
        definition: '(American football) a play in which a player attempts to carry the ball through the line',
      }),
    ).toBeNull();
    expect(meaningTitle({ title: 'Exhausted…', definition: 'exhausted; depleted' })).toBeNull();
  });

  it('answers nothing for a meaning without a title', () => {
    expect(meaningTitle({ title: '  ', definition: 'a race' })).toBeNull();
    expect(meaningTitle({ title: null, definition: 'a race' })).toBeNull();
  });
});

describe('entryDescription', () => {
  it('keeps a description of its own and drops the one a meaning repeats', () => {
    const meanings = [{ definition: 'In a liquid state; melted or molten.' }];

    expect(entryDescription({ description: 'Melted.', meanings })).toBe('Melted.');
    expect(entryDescription({ description: 'in a liquid state; melted or molten. ', meanings })).toBeNull();
    expect(entryDescription({ description: null, meanings })).toBeNull();
  });
});

describe('foldedMeanings', () => {
  const meanings = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

  it('shows every meaning of an entry that has a few', () => {
    expect(foldedMeanings(meanings(8))).toEqual({ shown: meanings(8), folded: [] });
  });

  it('shows the first ones of a long entry and folds the rest', () => {
    const { shown, folded } = foldedMeanings(meanings(36));

    expect(shown).toEqual(meanings(6));
    expect(folded).toHaveLength(30);
    expect(folded[0]).toBe(6);
  });
});
