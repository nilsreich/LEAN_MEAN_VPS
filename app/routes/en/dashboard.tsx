import { createRoute } from 'honox/factory';
import { DashboardPage } from '../../components/pages/DashboardPage';
import { en } from '../../core/i18n/en';

export default createRoute(async (c) => {
  return c.render(
    <DashboardPage dict={en} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: en.meta.title.dashboard,
      lang: 'en',
      toastMessages: en.toast,
      clientMessages: en.client,
    },
  );
});
