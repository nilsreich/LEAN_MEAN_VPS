import { createRoute } from 'honox/factory';
import ChatIsland from '../../modules/chat/islands/ChatIsland';
import { getScopedI18n } from '../../core/i18n/loader';
import { chatDe } from '../../modules/chat/i18n/de';
import { chatEn } from '../../modules/chat/i18n/en';

export default createRoute(async (c) => {
  const dict = getScopedI18n(c, [{ de: chatDe, en: chatEn }]);

  return c.render(
    <main className="min-h-screen p-4 flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/dashboard" className="text-primary hover:underline">← Dashboard</a>
        <h1 className="text-2xl font-bold">{dict['dashboard.modules.chat']}</h1>
      </div>
      {/* @ts-expect-error - HonoX Client-Side Directive */}
      <ChatIsland $client:load />
    </main>,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: dict['dashboard.modules.chat'],
      lang: c.get('lang'),
      clientMessages: dict,
    }
  );
});
