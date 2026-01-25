import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { createRoute } from "honox/factory";
import { db } from "../../db";
import { users } from "../../db/schema";
import { SECRET } from "../../middleware/auth";

// Beispiel: Registrierung (hier wird Argon2id zum Hashen genutzt)
export const postRegister = createRoute(async (c) => {
	const { username, password } = await c.req.json();

	// Bun.password nutzt standardmäßig Argon2id
	const hashedPassword = await Bun.password.hash(password);

	await db.insert(users).values({
		username,
		password: hashedPassword,
	});

	return c.json({ success: true }, 201);
});

export const postLogin = createRoute(async (c) => {
	const { username, password } = await c.req.json();
	const user = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.get();

	// Sichere Verifizierung mit Argon2id via Bun native API
	if (user && (await Bun.password.verify(password, user.password))) {
		const token = await sign(
			{
				id: user.id,
				username: user.username,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
			},
			SECRET,
			"HS256",
		);
		return c.json({ token });
	}
	return c.json({ error: "Ungültig" }, 401);
});
