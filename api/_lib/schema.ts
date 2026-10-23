import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  provider: varchar('provider', { length: 50 }).default('email'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileKey: varchar('file_key', { length: 255 }).notNull().unique(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  userId: varchar('user_id', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type ImageRecord = typeof images.$inferSelect;
export type NewImageRecord = typeof images.$inferInsert;
