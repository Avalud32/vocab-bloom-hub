import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { routing } from '@/i18n/routing';

import { flagOf, hasFlag } from '../languageFlags';

const SITE_ROOT = path.join(__dirname, '../../..');

const sourceFiles = (folder: string): string[] =>
  readdirSync(folder).flatMap((name) => {
    const file = path.join(folder, name);
    if (statSync(file).isDirectory()) return name === '__tests__' ? [] : sourceFiles(file);
    return /\.(ts|tsx|scss)$/.test(name) ? [file] : [];
  });

describe('flagOf', () => {
  it('answers a picture the site serves for every interface language', () => {
    for (const language of routing.locales) {
      expect(existsSync(path.join(SITE_ROOT, 'public', flagOf(language)))).toBe(true);
    }
  });

  it('shows the globe for Arabic and for a language it does not know', () => {
    expect(hasFlag('ru')).toBe(true);
    expect(flagOf('ru')).toBe('/flags/ru.svg');
    expect(hasFlag('ar')).toBe(false);
    expect(flagOf('ar')).toBe('/flags/globe.svg');
    expect(flagOf('tlh')).toBe('/flags/globe.svg');
  });

  // issue #538: Windows has no glyphs for the flags of the emoji set
  it('leaves no flag emoji in the sources of the site', () => {
    const flagEmoji = /[\u{1F1E6}-\u{1F1FF}]/u;
    const found = sourceFiles(path.join(SITE_ROOT, 'src')).filter((file) =>
      flagEmoji.test(readFileSync(file, 'utf8')),
    );
    expect(found).toEqual([]);
  });
});
