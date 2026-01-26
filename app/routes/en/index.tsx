import { createRoute } from 'honox/factory';
import { LandingPage } from '../../components/pages/LandingPage';
import { en } from '../../core/i18n/en';

export default createRoute((c) => {
  return c.render(
    <LandingPage dict={en} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: en.meta.title.landing,
      lang: 'en',
      toastMessages: en.toast,
      clientMessages: en.client,
    },
  );
});
