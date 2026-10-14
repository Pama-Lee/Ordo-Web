// Copy for the engine page, one JSON file per language.
// zh-TW is converted from zh-CN (OpenCC s2twp) and then reviewed by hand.
import en from './engine/en.json';
import zhCN from './engine/zh-CN.json';
import zhTW from './engine/zh-TW.json';
import type { languages } from './utils';

export type EngineCopy = typeof zhCN;

const copies: Record<keyof typeof languages, EngineCopy> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function useEngine(lang: keyof typeof languages): EngineCopy {
  return copies[lang] ?? zhCN;
}
