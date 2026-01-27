import { createRoute } from 'honox/factory';
import { getScopedI18n } from '../../core/i18n/loader';
import { storageDe } from '../../modules/storage/i18n/de';
import { storageEn } from '../../modules/storage/i18n/en';
import UploadIsland from '../../modules/storage/islands/UploadIsland';

export default createRoute(async (c) => {
  const dict = getScopedI18n(c, [{ de: storageDe, en: storageEn }]);

  return c.render(
    <main className="min-h-screen p-4 flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/dashboard" className="text-primary hover:underline">
          ← Dashboard
        </a>
        <h1 className="text-2xl font-bold">{dict['dashboard.modules.storage']}</h1>
      </div>
      {/* @ts-expect-error - HonoX Client-Side Directive */}
      <UploadIsland $client:load />
    </main>,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: dict['dashboard.modules.storage'],
      lang: c.get('lang'),
      clientMessages: dict,
    },
  );
});
