import { createRoute } from 'honox/factory';
import { DashboardPage } from '../components/pages/DashboardPage';
import { getScopedI18n } from '../core/i18n/loader';
import { chatDe } from '../modules/chat/i18n/de';
import { chatEn } from '../modules/chat/i18n/en';
import { storageDe } from '../modules/storage/i18n/de';
import { storageEn } from '../modules/storage/i18n/en';
import { tasksDe } from '../modules/tasks/i18n/de';
import { tasksEn } from '../modules/tasks/i18n/en';

export default createRoute(async (c) => {
  const dict = getScopedI18n(c, [
    { de: chatDe, en: chatEn },
    { de: tasksDe, en: tasksEn },
    { de: storageDe, en: storageEn },
  ]);

  return c.render(
    <DashboardPage dict={dict} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: dict['meta.title.dashboard'],
      lang: c.get('lang'),
      clientMessages: dict,
    },
  );
});
