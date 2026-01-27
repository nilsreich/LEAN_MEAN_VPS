import type { Context } from 'hono';
import { de as coreDe } from './de';
import { en as coreEn } from './en';

type LangDict = Record<string, string>;
export type ModuleI18n = { de: LangDict; en: LangDict };

export const getScopedI18n = (c: Context, modules: ModuleI18n[] = []) => {
  const lang = (c.get('lang') as 'de' | 'en') || 'de';
  const core = lang === 'en' ? coreEn : coreDe;

  const merged = { ...core };

  modules.forEach((mod) => {
    const modDict = mod[lang];
    if (modDict) {
      Object.assign(merged, modDict);
    }
  });

  return merged;
};
