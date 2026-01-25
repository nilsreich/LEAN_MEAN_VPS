import { streamSSE } from "hono/streaming";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
	return streamSSE(c, async (stream) => {
		while (true) {
			const stats = { cpu: Math.random(), ram: "420MB" };
			await stream.writeSSE({
				data: JSON.stringify(stats),
				event: "server-stats",
			});
			await stream.sleep(2000);
		}
	});
});
