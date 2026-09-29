import React from 'react';

import { flagOf, hasFlag } from '@/core/languageFlags';

import styles from './styles.module.scss';

type FlagP = {
  language: string;
  /** Next to the name of the language the flag says nothing new: hidden from a screen reader */
  decorative?: boolean;
  className?: string;
};

/** The flag of a language (issue #538); the code of the language for a screen reader */
export const Flag = ({ language, decorative = false, className }: FlagP) => (
  // eslint-disable-next-line @next/next/no-img-element -- a 20px SVG of the site's own: nothing to optimize
  <img
    className={[hasFlag(language) ? styles.flag : styles.globe, className].filter(Boolean).join(' ')}
    src={flagOf(language)}
    alt={decorative ? '' : language}
    title={decorative ? undefined : language}
    width={21}
    height={14}
    decoding="async"
  />
);
