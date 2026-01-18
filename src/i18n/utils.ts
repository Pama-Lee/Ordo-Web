import en from './en.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';

export const languages = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

export const defaultLang = 'zh-CN';

export const translations = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: string) {
    const keys = key.split('.');
    let current = translations[lang] as any;
    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to default lang if key missing
        let fallback = translations[defaultLang] as any;
        for (const fk of keys) {
          fallback = fallback[fk];
        }
        return fallback || key;
      }
      current = current[k];
    }
    return current;
  };
}
