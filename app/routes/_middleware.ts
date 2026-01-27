import { createRoute } from 'honox/factory';
import { i18nMiddleware } from '../core/middleware/i18n';

export default createRoute(i18nMiddleware);
