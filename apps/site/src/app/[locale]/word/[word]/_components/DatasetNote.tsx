import React from 'react';

import { licenseLabel, OWN_DATASET_SOURCE } from '@/core/datasetTerms';
import type { WordPanelT } from '@/core/wordPanel';
import { Link } from '@/i18n/navigation';

import styles from '../../word.module.scss';
import type { TranslateT } from './translate';

type DatasetNoteP = {
  panel: WordPanelT;
  /** The messages of the word page, and the ones of the page of the terms: the names of the rows are its */
  t: TranslateT;
  terms: TranslateT;
};

// the letter "i" in a circle: the block is about the data, not a part of it
const InfoIcon = () => (
  <svg
    className={styles.noteIcon}
    viewBox="0 0 16 16"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="4.8" r="1" fill="currentColor" />
    <path d="M8 7.4v4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/**
 * Where the entries of a panel come from and under which terms (issues
 * #527, #538): the first thing under the tabs, a block of its own with a
 * name for every fact — a reader who picks a dataset is told what it is
 * before its entries, and the attribution a license asks for is not a line
 * of small print at the end of the page.
 */
export const DatasetNote = ({ panel, t, terms: names }: DatasetNoteP) => {
  const { terms } = panel;
  const isOwnData = terms.source === OWN_DATASET_SOURCE;
  const license = licenseLabel(terms.license);
  const word = encodeURIComponent(panel.word);

  return (
    <aside className={styles.note} aria-label={names('title')} data-testid="dataset-terms">
      <InfoIcon />
      <div className={styles.noteBody}>
        <dl className={styles.noteList}>
          <div>
            <dt>{names('source')}</dt>
            <dd className={styles.noteSource}>{panel.title || terms.source}</dd>
          </div>
          <div>
            <dt>{names('license')}</dt>
            <dd>
              {isOwnData ? (
                <Link href="/docs/data-license">{license}</Link>
              ) : panel.active ? (
                // the terms of the source, with its notice in full where it asks for one (issue #531)
                <Link href="/dataset-terms">{license}</Link>
              ) : (
                // the page of the terms is about the served dataset: another one is sent to its license
                <a href={terms.license_url} rel="license noreferrer" target="_blank">
                  {license}
                </a>
              )}
            </dd>
          </div>
          {/* the attribution the source asks for (issue #527), and its notice when it has one */}
          {!isOwnData && terms.attribution && (
            <div>
              <dt>{names('attribution')}</dt>
              <dd>
                {terms.attribution_url ? (
                  <a href={terms.attribution_url} rel="noreferrer" target="_blank">
                    {terms.attribution}
                  </a>
                ) : (
                  terms.attribution
                )}
              </dd>
            </div>
          )}
          {isOwnData ? (
            <div>
              <dt>{names('notice')}</dt>
              <dd>
                <Link href="/docs/data">{t('ai_note')}</Link>
              </dd>
            </div>
          ) : (
            terms.notice && (
              <div>
                <dt>{names('notice')}</dt>
                <dd>{terms.notice}</dd>
              </div>
            )
          )}
          <div>
            <dt>API</dt>
            <dd>
              <code dir="ltr">
                GET /api/v1/words/{word}
                {panel.active ? '' : '/datasets'}
              </code>{' '}
              <Link
                href={`/playground?endpoint=${panel.active ? 'get-words-word' : 'get-words-word-datasets'}`}
              >
                {t('try_in_playground')}
              </Link>
            </dd>
          </div>
        </dl>
        {/* a license that wants its text on every copy (issue #531): the page of the terms prints the served one's */}
        {!panel.active && terms.license_text && (
          <details className={styles.licenseText}>
            <summary>{names('full_text')}</summary>
            <pre lang="en" dir="ltr">
              {terms.license_text}
            </pre>
          </details>
        )}
      </div>
    </aside>
  );
};
