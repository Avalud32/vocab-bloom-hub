import type { PublicWordV1T } from 'server/types';

// A word page in a locale the dictionary translates into (issue #480): the
// locale's own translations are what the page can rank for ("bloom перевод"),
// so they lead the title, the description and the first screen

/** The interface locale's translation language; null for English, the language of the headwords */
export const translationLanguageOf = (locale: string): string | null => (locale === 'en' ? null : locale);

/** The short translations of every entry into the locale's language, in order, without repeats */
export const localeTranslations = (entries: readonly PublicWordV1T[], locale: string): string[] => {
  const language = translationLanguageOf(locale);
  if (!language) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of entries) {
    for (const item of entry.short_translations) {
      const text = item.description.trim();
      if (item.language !== language || !text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      result.push(text);
    }
  }
  return result;
};

/** The same list with the items of the locale's language first; the order within a language is kept */
export const localeFirst = <T extends { language: string }>(items: readonly T[], locale: string): T[] => {
  const language = translationLanguageOf(locale);
  if (!language) return [...items];
  return [
    ...items.filter((item) => item.language === language),
    ...items.filter((item) => item.language !== language),
  ];
};

/** The first definition of a headword: the first meaning of the first entry that has one, else its description */
export const leadDefinition = (entries: readonly PublicWordV1T[]): string | undefined => {
  for (const entry of entries) {
    const definition = entry.meanings.find((meaning) => meaning.definition.trim())?.definition;
    if (definition) return definition.trim();
  }
  return entries.find((entry) => entry.description?.trim())?.description?.trim();
};

/**
 * The languages a headword has translations in — short translations and the
 * meanings' — once each, the locale's own language first, the rest in the
 * order they appear. The page shows one language at a time and offers these
 * to pick from (issue #520)
 */
export const translationLanguages = (entries: readonly PublicWordV1T[], locale: string): string[] => {
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const item of entry.short_translations) seen.add(item.language);
    for (const meaning of entry.meanings) for (const item of meaning.translations) seen.add(item.language);
  }
  return localeFirst(
    [...seen].map((language) => ({ language })),
    locale,
  ).map((item) => item.language);
};

// the text of a title or a definition as it is compared: the case and the cut-off mark of a title set aside
const comparable = (text: string): string =>
  text
    .trim()
    .replace(/(\.{3}|…)$/, '')
    .trim()
    .toLowerCase();

/**
 * The title of a meaning, when it says what the definition does not (issue
 * #538). A dataset of a public source has no titles of its own: its
 * converter titles a meaning with the start of its definition, and the page
 * said everything twice
 */
export const meaningTitle = (meaning: { title?: string | null; definition: string }): string | null => {
  const title = meaning.title?.trim();
  if (!title) return null;
  return comparable(meaning.definition).includes(comparable(title)) ? null : title;
};

/** The description of an entry, unless it is the definition of one of its meanings word for word */
export const entryDescription = (
  entry: Pick<PublicWordV1T, 'description'> & { meanings: ReadonlyArray<{ definition: string }> },
): string | null => {
  const description = entry.description?.trim();
  if (!description) return null;
  return entry.meanings.some((meaning) => comparable(meaning.definition) === comparable(description))
    ? null
    : description;
};

/** How many meanings an entry shows before the rest is folded, and from how many on it folds any */
export const MEANINGS_SHOWN = 6;
export const MEANINGS_FOLDED_FROM = 9;

/** The meanings of an entry in the open and the folded ones: "get" is forty meanings, a reader came for the first */
export const foldedMeanings = <T>(meanings: readonly T[]): { shown: T[]; folded: T[] } =>
  meanings.length < MEANINGS_FOLDED_FROM
    ? { shown: [...meanings], folded: [] }
    : { shown: meanings.slice(0, MEANINGS_SHOWN), folded: meanings.slice(MEANINGS_SHOWN) };
