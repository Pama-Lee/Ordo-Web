// Copy for the landing page, one JSON file per language.
// zh-TW is converted from zh-CN (OpenCC s2twp) and then reviewed by hand.
import en from './home/en.json';
import zhCN from './home/zh-CN.json';
import zhTW from './home/zh-TW.json';
import type { languages } from './utils';

export type HomeCopy = typeof zhCN;

const copies: Record<keyof typeof languages, HomeCopy> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function useHome(lang: keyof typeof languages): HomeCopy {
  return copies[lang] ?? zhCN;
}

/** Base path for in-site links (zh-CN has no prefix). */
export function sitePrefix(lang: keyof typeof languages): string {
  return lang === 'zh-CN' ? '' : `/${lang}`;
}

/** Docs live at docs.ordoengine.com under /zh or /en. */
export function docsUrl(lang: keyof typeof languages, path = ''): string {
  const docsLang = lang === 'en' ? 'en' : 'zh';
  return `https://docs.ordoengine.com/${docsLang}${path}`;
}

export const REPO_URL = 'https://github.com/Ordo-Engine/Ordo';
export const PACKS_URL = `${REPO_URL}/tree/main/examples/rule-packs`;
