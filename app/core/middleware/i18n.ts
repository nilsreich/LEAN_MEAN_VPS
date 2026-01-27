import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

export const i18nMiddleware = createMiddleware(async (c, next) => {
  // 1. Check Cookie
  let lang = getCookie(c, 'lang');

  // 2. Check Accept-Language Header if no cookie
  if (!lang) {
    const acceptLanguage = c.req.header('Accept-Language');
    if (acceptLanguage) {
      // Simple extraction: 'en-US,en;q=0.9' -> 'en'
      lang = acceptLanguage.split(',')[0].split('-')[0];
    }
  }

  // 3. Fallback and Validation
  if (!lang || (lang !== 'en' && lang !== 'de')) {
    lang = 'de';
  }

  // 4. Set Context
  c.set('lang', lang);

  await next();
});
