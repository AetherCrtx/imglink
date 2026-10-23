import { S3Client } from '@aws-sdk/client-s3';

// Auto-load .env if not loaded (for local Node / dev environments)
if (!process.env.B2_KEY_ID && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if file not found
  }
}

const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const region = process.env.B2_REGION || 'us-east-005';
const accessKeyId = process.env.B2_KEY_ID || '';
const secretAccessKey = process.env.B2_APPLICATION_KEY || '';

export const BUCKET_NAME = process.env.B2_BUCKET_NAME || '';

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});
