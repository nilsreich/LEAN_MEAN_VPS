import { createRoute } from 'honox/factory';
import { LandingPage } from '../components/pages/LandingPage';
import { getScopedI18n } from '../core/i18n/loader';

export default createRoute((c) => {
  const dict = getScopedI18n(c);
  return c.render(
    <LandingPage dict={dict} />,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: dict['meta.title.landing'],
      lang: c.get('lang'),
      clientMessages: dict,
    },
  );
});
