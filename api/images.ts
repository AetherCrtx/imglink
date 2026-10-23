import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { desc, eq, or } from 'drizzle-orm';
import { db } from './_lib/db';
import { images } from './_lib/schema';
import { s3Client, BUCKET_NAME } from './_lib/s3';
import { getAuthUser } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const currentUser = getAuthUser(req);

  // GET: Fetch images (optionally filtered by current user)
  if (req.method === 'GET') {
    try {
      const filter = req.query.filter as string;
      const query = db.select().from(images);

      let records;
      if (filter === 'mine' && currentUser) {
        records = await query
          .where(eq(images.userId, currentUser.id))
          .orderBy(desc(images.createdAt))
          .limit(30);
      } else {
        records = await query
          .orderBy(desc(images.createdAt))
          .limit(24);
      }

      // Attach ownership indicator
      const enriched = records.map((rec) => ({
        ...rec,
        isOwner: currentUser ? rec.userId === currentUser.id : false,
      }));

      return res.status(200).json(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[images GET error]:', err);
      return res.status(500).json({ error: 'Failed to retrieve images', details: message });
    }
  }

  // POST: Save uploaded image metadata
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Malformed JSON body.' });
        }
      }

      const { fileKey, originalName, mimeType, sizeBytes } = body || {};

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
          userId: currentUser ? currentUser.id : null,
        })
        .returning();

      return res.status(201).json({
        ...inserted[0],
        isOwner: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[images POST error]:', err);
      return res.status(500).json({ error: 'Failed to save image metadata', details: message });
    }
  }

  // DELETE: Delete from S3 and Neon DB
  if (req.method === 'DELETE') {
    try {
      const id = (req.query.id as string) || (req.body?.id as string);
      const fileKey = (req.query.fileKey as string) || (req.body?.fileKey as string);

      if (!id && !fileKey) {
        return res.status(400).json({ error: 'Must provide either "id" or "fileKey" to delete.' });
      }

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

      // Ownership authorization: if image has an owner, only the owner can delete
      if (target.userId && currentUser && target.userId !== currentUser.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this image.' });
      }

      // 1. Delete from Backblaze B2 storage
      if (BUCKET_NAME && target.fileKey) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: target.fileKey,
          });
          await s3Client.send(deleteCommand);
        } catch (s3Err) {
          console.warn('[images DELETE S3 warning]:', s3Err);
        }
      }

      // 2. Delete from Neon DB
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

  return res.status(405).json({ error: 'Method not allowed.' });
}
