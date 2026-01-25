import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
	const body = await c.req.parseBody();
	const file = body.file as File;

	if (file) {
		const path = `./storage/${Date.now()}-${file.name}`;
		await Bun.write(path, await file.arrayBuffer());
		return c.json({ message: "Gespeichert", path });
	}
	return c.json({ error: "Keine Datei" }, 400);
});
