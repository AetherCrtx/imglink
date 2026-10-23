import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: varchar('role', { length: 50 }).default('user').notNull(), // 'user' | 'admin'
  tier: varchar('tier', { length: 50 }).default('free').notNull(), // 'free' | 'pro'
  proRequestStatus: varchar('pro_request_status', { length: 50 }).default('none').notNull(), // 'none' | 'pending' | 'approved' | 'rejected'
  proRequestedAt: timestamp('pro_requested_at', { mode: 'date' }),
  proRequestNote: varchar('pro_request_note', { length: 500 }),
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
