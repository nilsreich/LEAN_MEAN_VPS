import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	username: text("username").notNull().unique(),
	password: text("password").notNull(),
});

export const uploads = sqliteTable("uploads", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	filename: text("filename").notNull(),
	userId: integer("user_id").references(() => users.id),
});
