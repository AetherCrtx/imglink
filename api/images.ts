import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { desc, eq, or } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { images } from './_lib/schema.js';
import { s3Client, BUCKET_NAME } from './_lib/s3.js';
import { getAuthUserAsync } from './_lib/auth.js';
import { getClientIp, checkRateLimit, applySecurityHeaders } from './_lib/security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Defensive Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting Shield
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp, 'general');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many requests. Defense shield active. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const currentUser = await getAuthUserAsync(req);

  // GET: Fetch images (strictly private: scoped only to authenticated owner, zero admin backdoors)
  if (req.method === 'GET') {
    try {
      if (!currentUser) {
        // Strict privacy: unauthenticated visitors cannot view or browse any user images
        return res.status(200).json([]);
      }

      // Every user (including admins) strictly sees ONLY their own uploaded files.
      // Admin accounts cannot browse or inspect other members' photos to uphold strict user privacy.
      const records = await db
        .select()
        .from(images)
        .where(eq(images.userId, currentUser.id))
        .orderBy(desc(images.createdAt))
        .limit(100);

      const enriched = records.map((rec) => ({
        ...rec,
        isOwner: true,
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
      if (!currentUser) {
        return res.status(401).json({
          error: 'Authentication required. Please sign in with Google to upload images.',
        });
      }

      // Enforce Free tier 3-image limit (Admin and Pro accounts have unlimited quota)
      const isProOrAdmin = currentUser.role === 'admin' || currentUser.tier === 'pro';
      if (!isProOrAdmin && (currentUser.imageCount ?? 0) >= 3) {
        return res.status(403).json({
          error: 'Free tier limit reached (maximum 3 images). Please upgrade to Pro for unlimited uploads.',
          limitReached: true,
          tier: 'free',
          count: currentUser.imageCount,
          max: 3,
        });
      }

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
          userId: currentUser.id,
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

  // DELETE: Delete from storage and database
  if (req.method === 'DELETE') {
    try {
      if (!currentUser) {
        return res.status(401).json({ error: 'Authentication required to delete images.' });
      }

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

      // Privacy & Ownership: Only the true owner of the asset can delete it
      const isOwner = target.userId === currentUser.id;

      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have permission to delete this image. Only the asset owner can delete it.' });
      }

      // 1. Delete from storage
      if (BUCKET_NAME && target.fileKey) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: target.fileKey,
          });
          await s3Client.send(deleteCommand);
        } catch (s3Err) {
          console.warn('[images DELETE storage warning]:', s3Err);
        }
      }

      // 2. Delete from database
      await db.delete(images).where(eq(images.id, target.id));

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully.',
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
