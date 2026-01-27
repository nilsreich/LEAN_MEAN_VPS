import type { Dictionary } from '../../core/i18n/types';
import DashboardIsland from '../../islands/DashboardIsland';
import ChatIsland from '../../modules/chat/islands/ChatIsland';
import UploadIsland from '../../modules/storage/islands/UploadIsland';
import TodoIsland from '../../modules/tasks/islands/TodoIsland';

export const DashboardPage = ({ dict }: { dict: Dictionary }) => {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Upper Navigation / Status Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gradient uppercase tracking-tight">
            {dict['dashboard.header.title']}
          </h1>
          <p className="text-text-muted font-medium">{dict['dashboard.header.subtitle']}</p>
        </div>

        <div className="flex items-center">
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <DashboardIsland $client:load />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Module A: Task Management */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <h2 className="text-lg font-bold uppercase tracking-widest text-text-muted">
              {dict['dashboard.modules.tasks']}
            </h2>
          </div>
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <TodoIsland $client:load />
        </section>

        {/* Module B: Security Storage */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <h2 className="text-lg font-bold uppercase tracking-widest text-text-muted">
              {dict['dashboard.modules.storage']}
            </h2>
          </div>
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <UploadIsland $client:load />
        </section>

        {/* Module C: Realtime Chat */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <h2 className="text-lg font-bold uppercase tracking-widest text-text-muted">
              {dict['dashboard.modules.chat']}
            </h2>
          </div>
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <ChatIsland $client:load />
        </section>
      </div>
    </main>
  );
};
