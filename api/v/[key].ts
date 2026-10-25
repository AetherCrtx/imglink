import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../_lib/s3.js';
import {
  applySecurityHeaders,
  checkRateLimit,
  getClientIp,
  isValidFileKey,
} from '../_lib/security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applySecurityHeaders(res);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // Rate Limiting Shield for image viewing
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp, 'general');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  try {
    let key = req.query.key;
    if (Array.isArray(key)) {
      key = key[0];
    }

    // Fallback: parse key from URL path if not populated in req.query
    if (!key && req.url) {
      const cleanPath = req.url.split('?')[0];
      const segments = cleanPath.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && last !== '[key]') {
        key = decodeURIComponent(last);
      }
    }

    if (!key || typeof key !== 'string' || !isValidFileKey(key)) {
      return res.status(400).json({ error: 'Invalid or unsafe image key format.' });
    }

    if (!BUCKET_NAME) {
      return res.status(500).json({
        error: 'Server storage configuration error: Storage bucket is not set.',
      });
    }

    const isSvg = key.toLowerCase().endsWith('.svg');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: isSvg
        ? 'attachment; filename="image.svg"'
        : 'inline',
    });

    // 1-hour presigned GET URL (3600 seconds)
    const presignedGetUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Edge/Browser caching header
    res.setHeader('Cache-Control', 'public, max-age=3000, s-maxage=3000');
    return res.redirect(307, presignedGetUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[view proxy GET error]:', err);
    return res.status(500).json({ error: 'Failed to generate view URL', details: message });
  }
}

