import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { desc, eq, or } from 'drizzle-orm';
import { db } from './_lib/db';
import { images } from './_lib/schema';
import { s3Client, BUCKET_NAME } from './_lib/s3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch the 20 most recent images ordered by createdAt DESC
  if (req.method === 'GET') {
    try {
      const records = await db
        .select()
        .from(images)
        .orderBy(desc(images.createdAt))
        .limit(20);

      return res.status(200).json(records);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[images GET error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve images', details: message });
    }
  }

  // POST: Save uploaded image metadata to Neon DB and return the created record
  if (req.method === 'POST') {
    try {
      const { fileKey, originalName, mimeType, sizeBytes } = req.body || {};

      if (!fileKey || typeof fileKey !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "fileKey".' });
      }

      if (!originalName || typeof originalName !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "originalName".' });
      }

      if (!mimeType || typeof mimeType !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "mimeType".' });
      }

      const parsedSize = Number(sizeBytes);
      if (isNaN(parsedSize) || parsedSize <= 0) {
        return res.status(400).json({ error: 'Missing or invalid "sizeBytes".' });
      }

      const inserted = await db
        .insert(images)
        .values({
          fileKey: fileKey.trim(),
          originalName: originalName.trim(),
          mimeType: mimeType.trim(),
          sizeBytes: parsedSize,
        })
        .returning();

      return res.status(201).json(inserted[0]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[images POST error]:', err);
      return res.status(500).json({ error: 'Failed to save image metadata', details: message });
    }
  }

  // DELETE: Accept id or fileKey, delete from Backblaze B2 and Neon DB
  if (req.method === 'DELETE') {
    try {
      const id = (req.query.id as string) || (req.body?.id as string);
      const fileKey = (req.query.fileKey as string) || (req.body?.fileKey as string);

      if (!id && !fileKey) {
        return res.status(400).json({ error: 'Must provide either "id" or "fileKey" to delete.' });
      }

      // Find the record in database first
      const existing = await db
        .select()
        .from(images)
        .where(
          id && fileKey
            ? or(eq(images.id, id), eq(images.fileKey, fileKey))
            : id
            ? eq(images.id, id)
            : eq(images.fileKey, fileKey!)
        )
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Image record not found.' });
      }

      const target = existing[0];

      // 1. Delete object from Backblaze B2 storage
      if (BUCKET_NAME && target.fileKey) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: target.fileKey,
          });
          await s3Client.send(deleteCommand);
        } catch (s3Err) {
          console.warn('[images DELETE S3 warning]:', s3Err);
          // Continue deleting from DB even if S3 delete reported error
        }
      }

      // 2. Delete record from Neon DB
      await db.delete(images).where(eq(images.id, target.id));

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully from storage and database.',
        deletedId: target.id,
        deletedFileKey: target.fileKey,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[images DELETE error]:', err);
      return res.status(500).json({ error: 'Failed to delete image', details: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET, POST, or DELETE.' });
}
