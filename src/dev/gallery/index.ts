import { entries as create } from './create';
import { entries as home } from './home';
import { entries as manage } from './manage';
import { entries as onboarding } from './onboarding';
import { entries as outcome } from './outcome';
import type { GalleryEntry } from './types';
import { entries as verify } from './verify';

export const galleryEntries: GalleryEntry[] = [...onboarding, ...create, ...home, ...verify, ...outcome, ...manage].sort(
  (a, b) => a.n - b.n || (a.variant ?? '').localeCompare(b.variant ?? ''),
);

export const entryKey = (e: GalleryEntry) => (e.variant ? `${e.n}-${e.variant}` : String(e.n));
