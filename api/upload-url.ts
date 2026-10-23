import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { s3Client, BUCKET_NAME, STORAGE_PROVIDER_NAME } from './_lib/s3';
import { getAuthUserAsync } from './_lib/auth';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Authenticate user via Neon Auth or JWT
    const user = await getAuthUserAsync(req);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in to upload images.',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }

    const { fileName, mimeType, sizeBytes } = body || {};

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "fileName".' });
    }

    if (!mimeType || typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({
        error: `Invalid "mimeType". Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
      });
    }

    const parsedSize = Number(sizeBytes);
    if (isNaN(parsedSize) || parsedSize <= 0 || parsedSize > MAX_SIZE_BYTES) {
      return res.status(400).json({
        error: `Invalid file size. Maximum allowed size is 10MB (10485760 bytes).`,
      });
    }

    if (!BUCKET_NAME) {
      return res.status(500).json({
        error: 'Storage error: Bucket name is not configured.',
      });
    }

    const originalExt = fileName.split('.').pop()?.toLowerCase() || '';
    const safeExt =
      originalExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(originalExt)
        ? originalExt
        : MIME_EXTENSION_MAP[mimeType] || 'bin';

    const uniqueId = crypto.randomUUID();
    const fileKey = `${uniqueId}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
      signableHeaders: new Set(['host', 'content-type']),
    });

    return res.status(200).json({
      uploadUrl,
      fileKey,
      expiresIn: 300,
      userId: user.id,
      storageProvider: STORAGE_PROVIDER_NAME,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[upload-url error]:', err);
    return res.status(500).json({ error: 'Failed to generate upload URL', details: message });
  }
}
