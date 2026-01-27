import { useEffect, useState } from 'hono/jsx';

interface Stats {
  referrers: { name: string; value: number }[];
  devices: { name: string; value: number }[];
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard-stats')
      .then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-400 animate-pulse">Lade Statistik...</div>;
  }

  if (!stats) {
    return <div className="p-4 text-center text-red-400">Fehler beim Laden der Daten.</div>;
  }

  // Max value for Referrer bars normalization
  const maxReferrer = Math.max(...stats.referrers.map((r) => r.value), 1);
  // Total for Device percentages
  const totalDevices = stats.devices.reduce((sum, d) => sum + d.value, 0);

  const getDeviceColor = (d: string) => {
    if (d === 'B') return 'bg-yellow-500'; // Warning/Bot
    if (d === 'M') return 'bg-purple-500'; // Mobile
    return 'bg-blue-500'; // Desktop
  };

  const getDeviceLabel = (d: string) => {
    if (d === 'B') return 'Bots';
    if (d === 'M') return 'Mobile';
    return 'Desktop';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Referrer List */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <h3 className="text-lg font-bold mb-4 text-white">Top Referrer (24h)</h3>
        <div className="space-y-3">
          {stats.referrers.length === 0 && (
            <p className="text-gray-500 text-sm italic">Keine Daten verfügbar</p>
          )}
          {stats.referrers.map((r) => (
            <div key={r.name} className="flex flex-col group">
              <div className="flex justify-between text-xs mb-1 text-gray-300">
                <span className="truncate max-w-[200px]">{r.name}</span>
                <span className="font-mono">{r.value}</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${(r.value / maxReferrer) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Distribution */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col">
        <h3 className="text-lg font-bold mb-4 text-white">Geräte-Verteilung</h3>
        <div className="flex-1 flex items-end justify-around pb-2 min-h-[150px]">
          {stats.devices.length === 0 && (
            <p className="text-gray-500 text-sm italic w-full text-center self-center">
              Keine Daten
            </p>
          )}
          {stats.devices.map((d) => {
            // Ensure at least a tiny sliver is visible if value > 0
            const percentage = totalDevices > 0 ? (d.value / totalDevices) * 100 : 0;
            const height = Math.max(percentage, d.value > 0 ? 1 : 0);

            return (
              <div key={d.name} className="flex flex-col items-center w-1/4 group">
                <div className="text-xs mb-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.value} ({Math.round(percentage)}%)
                </div>
                <div
                  className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${getDeviceColor(
                    d.name
                  )}`}
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs mt-2 text-gray-400 font-medium">
                  {getDeviceLabel(d.name)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
