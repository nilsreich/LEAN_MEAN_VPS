import { createRoute } from 'honox/factory';
import { DashboardPage } from '../components/pages/DashboardPage';
import { de } from '../core/i18n/de';

export default createRoute(async (c) => {
  return c.render(
    <DashboardPage dict={de} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: de.meta.title.dashboard,
      lang: 'de',
      toastMessages: de.toast,
      clientMessages: de.client,
    },
  );
});
