import { createRoute } from 'honox/factory';
import { getScopedI18n } from '../../core/i18n/loader';
import { tasksDe } from '../../modules/tasks/i18n/de';
import { tasksEn } from '../../modules/tasks/i18n/en';
import TodoIsland from '../../modules/tasks/islands/TodoIsland';

export default createRoute(async (c) => {
  const dict = getScopedI18n(c, [{ de: tasksDe, en: tasksEn }]);

  return c.render(
    <main className="min-h-screen p-4 flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/dashboard" className="text-primary hover:underline">
          ← Dashboard
        </a>
        <h1 className="text-2xl font-bold">{dict['dashboard.modules.tasks']}</h1>
      </div>
      {/* @ts-expect-error - HonoX Client-Side Directive */}
      <TodoIsland $client:load />
    </main>,
    // @ts-expect-error - HonoX Renderer Props
    {
      title: dict['dashboard.modules.tasks'],
      lang: c.get('lang'),
      clientMessages: dict,
    },
  );
});
