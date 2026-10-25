import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { s3Client, BUCKET_NAME } from './_lib/s3.js';
import { getAuthUserAsync } from './_lib/auth.js';
import {
  getClientIp,
  checkRateLimit,
  applySecurityHeaders,
  applyCorsHeaders,
  sanitizeFileName,
} from './_lib/security.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/jfif',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/tiff',
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/jfif': 'jfif',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/tiff': 'tiff',
};

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'jfif',
  'png',
  'webp',
  'gif',
  'svg',
  'avif',
  'bmp',
  'ico',
  'tiff',
  'tif',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCorsHeaders(req, res);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting Shield for Upload URL generation
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp, 'upload');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Upload rate limit reached. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Authenticate user via Google OAuth session or JWT
    const user = await getAuthUserAsync(req);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in with Google to upload images.',
      });
    }

    // Check Free Member 3-image limit (Admin and Pro accounts have unlimited quota)
    const isProOrAdmin = user.role === 'admin' || user.tier === 'pro';
    if (!isProOrAdmin && (user.imageCount ?? 0) >= 3) {
      return res.status(403).json({
        error: 'Free member limit reached (maximum 3 images). Upgrade to Pro for unlimited uploads!',
        limitReached: true,
        tier: 'free',
        count: user.imageCount,
        max: 3,
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
        error: 'Invalid file size. Maximum allowed size is 10MB.',
      });
    }

    if (!BUCKET_NAME) {
      return res.status(500).json({
        error: 'Storage error: Bucket name is not configured.',
      });
    }

    const originalExt = fileName.split('.').pop()?.toLowerCase() || '';
    const safeExt =
      originalExt && ALLOWED_EXTENSIONS.has(originalExt)
        ? originalExt
        : MIME_EXTENSION_MAP[mimeType] || 'bin';

    const uniqueId = crypto.randomUUID();
    const fileKey = `${uniqueId}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
      ContentDisposition: safeExt === 'svg' ? `attachment; filename="${sanitizeFileName(fileName)}"` : 'inline',
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
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[upload-url error]:', err);
    return res.status(500).json({ error: 'Failed to generate upload URL', details: message });
  }
}
