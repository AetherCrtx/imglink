import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileKey: varchar('file_key', { length: 255 }).notNull().unique(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export type ImageRecord = typeof images.$inferSelect;
export type NewImageRecord = typeof images.$inferInsert;
