'use client';

import React, { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  PublicChangeV1T,
  PublicHeadwordHistoryV1ResT,
  PublicWordDatasetV1T,
  PublicWordDatasetsV1ResT,
} from 'server/types';

import { Pronounce } from '@/components/Pronounce';
import { browserApiBase } from '@/core/apiBase';
import { panelOfGroup, WordPanelT } from '@/core/wordPanel';

import styles from '../../word.module.scss';
import { ipa } from './Entry';
import { Panel } from './Panel';

// The datasets of a word page as tabs (issue #538). The page that is sent
// holds one dataset, the one of the first tab: that is what the server
// renders, a cache keeps and a search engine reads. The dataset of another
// tab is read by the browser from the public API when the tab is pressed,
// and the choice lives as long as the page does — it is no part of the URL

type TabT = { dataset: string; title: string };

type HeadlineT = { word: string; transcription: string | null };

type DatasetPanelsP = {
  /** The headword as the URL spells it: what the other datasets are asked for */
  word: string;
  /** The datasets that hold the headword, the one of the page first */
  tabs: TabT[];
  /** The headword and the pronunciation of the dataset the server rendered */
  headline: HeadlineT;
  /** The panel the server rendered */
  children: React.ReactNode;
};

type LoadedT = { panel: WordPanelT; history: PublicChangeV1T[] };

type OthersT =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; panels: Map<string, LoadedT> };

const tabId = (dataset: string): string => `dataset-tab-${dataset}`;
const panelId = (dataset: string): string => `dataset-panel-${dataset}`;

const getJson = async <T,>(url: string): Promise<T | null> => {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  return res.ok ? ((await res.json()) as T) : null;
};

// what was changed on the instance (issue #531): asked for only where an entry says it was
const historyOf = async (word: string, group: PublicWordDatasetV1T): Promise<PublicChangeV1T[]> => {
  if (!group.entries.some((entry) => entry.modified)) return [];
  try {
    const path = `/v1/words/${encodeURIComponent(word)}/datasets/${encodeURIComponent(group.dataset)}/history`;
    return (await getJson<PublicHeadwordHistoryV1ResT>(`${browserApiBase()}${path}`))?.data ?? [];
  } catch {
    // the panel stands without it: the entries still say that they were changed
    return [];
  }
};

export const DatasetPanels = ({ word, tabs, headline, children }: DatasetPanelsP) => {
  const t = useTranslations('word');
  const termsNames = useTranslations('terms');
  const nav = useTranslations('nav');
  const locale = useLocale();
  const [rendered] = tabs;
  const [selected, setSelected] = useState(rendered?.dataset ?? '');
  const [others, setOthers] = useState<OthersT>({ kind: 'idle' });
  // one read answers for every tab: it is asked once, by the first tab that is pressed
  const asked = useRef(false);

  const load = async () => {
    setOthers({ kind: 'loading' });
    try {
      const answer = await getJson<PublicWordDatasetsV1ResT>(
        `${browserApiBase()}/v1/words/${encodeURIComponent(word)}/datasets`,
      );
      if (!answer) throw new Error('no answer');
      const panels = new Map<string, LoadedT>();
      await Promise.all(
        tabs.map(async ({ dataset, title }) => {
          const group = answer.data.find((candidate) => candidate.dataset === dataset);
          if (!group || group.entries.length === 0) return;
          panels.set(dataset, {
            panel: panelOfGroup(group, title),
            history: await historyOf(group.word, group),
          });
        }),
      );
      setOthers({ kind: 'loaded', panels });
    } catch {
      // the next press of a tab asks again
      asked.current = false;
      setOthers({ kind: 'failed' });
    }
  };

  const select = (dataset: string) => {
    setSelected(dataset);
    if (dataset === rendered?.dataset || asked.current) return;
    asked.current = true;
    void load();
  };

  // the keys of a tab list: the arrows follow the direction of the writing
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const forward = getComputedStyle(event.currentTarget).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const index = tabs.findIndex((tab) => tab.dataset === selected);
    const next = {
      [forward]: (index + 1) % tabs.length,
      [back]: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next].dataset);
    document.getElementById(tabId(tabs[next].dataset))?.focus();
  };

  const tabbed = tabs.length > 1;
  const isRendered = selected === rendered?.dataset;
  const loaded = others.kind === 'loaded' ? others.panels.get(selected) : undefined;
  // the headword and the pronunciation are a dataset's: the ones of the open tab
  const shown: HeadlineT = loaded
    ? {
        word: loaded.panel.word,
        transcription: loaded.panel.entries.find((entry) => entry.transcription)?.transcription ?? null,
      }
    : headline;

  return (
    <>
      <div className={styles.headword}>
        <h1>{shown.word}</h1>
        <Pronounce word={shown.word} />
        {shown.transcription && <span className={styles.transcription}>{ipa(shown.transcription)}</span>}
      </div>
      {tabbed && (
        <div
          className={styles.tabs}
          role="tablist"
          aria-label={t('datasets_label')}
          onKeyDown={onKeyDown}
          data-testid="dataset-tabs"
        >
          {tabs.map(({ dataset, title }) => (
            <button
              key={dataset}
              type="button"
              role="tab"
              id={tabId(dataset)}
              className={dataset === selected ? styles.tabActive : styles.tab}
              aria-selected={dataset === selected}
              aria-controls={panelId(dataset)}
              tabIndex={dataset === selected ? 0 : -1}
              onClick={() => select(dataset)}
            >
              {title}
            </button>
          ))}
        </div>
      )}
      {/* what the server rendered stays in the page: it is hidden, not thrown away */}
      <div
        hidden={!isRendered}
        role={tabbed ? 'tabpanel' : undefined}
        id={tabbed && rendered ? panelId(rendered.dataset) : undefined}
        aria-labelledby={tabbed && rendered ? tabId(rendered.dataset) : undefined}
      >
        {children}
      </div>
      {!isRendered && (
        <div
          role="tabpanel"
          id={panelId(selected)}
          aria-labelledby={tabId(selected)}
          aria-busy={others.kind === 'loading'}
          data-testid="dataset-panel"
        >
          {loaded && (
            <Panel
              panel={loaded.panel}
              history={loaded.history}
              locale={locale}
              t={t}
              termsNames={termsNames}
              languageLabel={nav('language')}
            />
          )}
          {others.kind === 'loading' && <div className={styles.loading} aria-hidden="true" />}
          {(others.kind === 'failed' || (others.kind === 'loaded' && !loaded)) && (
            <p className={styles.failed} role="alert">
              {t('search_error')}
            </p>
          )}
        </div>
      )}
    </>
  );
};
