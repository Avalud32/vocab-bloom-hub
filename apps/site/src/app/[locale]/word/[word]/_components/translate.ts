/**
 * The messages of a namespace as the parts of a word page take them (issue
 * #538): the same parts are rendered by the server for the tab a page opens
 * and by the browser for the others, and each has a translator of its own —
 * `getTranslations` there, `useTranslations` here
 */
export type TranslateT = (key: string, values?: Record<string, string | number>) => string;
