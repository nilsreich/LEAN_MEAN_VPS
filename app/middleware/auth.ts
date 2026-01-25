import { jwt } from "hono/jwt";

export const SECRET = "dein-2026-geheimnis";

export const authMiddleware = jwt({
	secret: SECRET,
	alg: "HS256",
	cookie: "auth_token",
});
