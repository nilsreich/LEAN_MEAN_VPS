import { createRoute } from 'honox/factory';
import { LandingPage } from '../components/pages/LandingPage';
import { de } from '../core/i18n/de';

export default createRoute((c) => {
  return c.render(
    <LandingPage dict={de} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: de.meta.title.landing,
      lang: 'de',
      toastMessages: de.toast,
      clientMessages: de.client,
    },
  );
});
