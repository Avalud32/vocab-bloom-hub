// The flag shown next to a translation (issue #520): the same choice as the
// README's language links — a country's flag where the language has an
// obvious one, the globe for Arabic, which is spoken under many. A picture
// of the site's own (public/flags, issue #538), not an emoji: Windows has no
// glyphs for the flags and wrote "US", "RU" in their place
const FLAGGED_LANGUAGES: readonly string[] = ['en', 'ru', 'es', 'fr', 'de', 'pt', 'zh'];

/** Whether a language has a flag of its own; the others are shown the globe */
export const hasFlag = (language: string): boolean => FLAGGED_LANGUAGES.includes(language);

/** The picture of a language code; the globe for one the dictionary may add later */
export const flagOf = (language: string): string =>
  hasFlag(language) ? `/flags/${language}.svg` : '/flags/globe.svg';
