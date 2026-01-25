import { createRoute } from "honox/factory";
import RealtimeBox from "../islands/RealtimeBox";
import { authMiddleware } from "../middleware/auth";

export default createRoute(authMiddleware, (c) => {
	const payload = c.get("jwtPayload");
	return c.render(
		<div class="space-y-6">
			<h1 class="text-2xl font-bold">Hallo, {payload.username}!</h1>
			<p>Willkommen in deinem geschützten Bereich.</p>
			<RealtimeBox />
		</div>,
	);
});
