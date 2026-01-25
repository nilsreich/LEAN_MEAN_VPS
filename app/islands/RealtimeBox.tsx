import { useEffect, useState } from "hono/jsx";

export default function RealtimeBox() {
	const [stats, setStats] = useState({ ram: "..." });

	useEffect(() => {
		const sse = new EventSource("/api/events");
		sse.addEventListener("server-stats", (e) => {
			setStats(JSON.parse(e.data));
		});
		return () => sse.close();
	}, []);

	return (
		<div class="p-4 border rounded border-green-500">
			<p>Server RAM: {stats.ram}</p>
		</div>
	);
}
