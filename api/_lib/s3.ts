import { S3Client } from '@aws-sdk/client-s3';

const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
const region = process.env.B2_REGION || 'us-west-004';
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
