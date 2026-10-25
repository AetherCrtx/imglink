import { S3Client } from '@aws-sdk/client-s3';
import { ensureEnvLoaded } from './env.js';

export function getS3Client(): S3Client {
  ensureEnvLoaded();

  const isB2 = process.env.STORAGE_PROVIDER === 'b2';

  const endpoint = isB2
    ? process.env.B2_ENDPOINT
    : process.env.AWS_ENDPOINT_URL_S3;

  const region = isB2
    ? process.env.B2_REGION || 'us-east-005'
    : process.env.AWS_REGION || 'ap-southeast-1';

  const accessKeyId = isB2
    ? process.env.B2_KEY_ID
    : process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey = isB2
    ? process.env.B2_APPLICATION_KEY
    : process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Server storage configuration error: Storage credentials (endpoint, accessKeyId, or secretAccessKey) are missing in environment variables.'
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export function getBucketName(): string {
  ensureEnvLoaded();
  const isB2 = process.env.STORAGE_PROVIDER === 'b2';
  return (
    (isB2 ? process.env.B2_BUCKET_NAME : process.env.AWS_BUCKET_NAME) ||
    process.env.BUCKET_NAME ||
    'images'
  );
}

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const instance = getS3Client() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const BUCKET_NAME =
  process.env.B2_BUCKET_NAME ||
  process.env.AWS_BUCKET_NAME ||
  process.env.BUCKET_NAME ||
  'images';
export const STORAGE_PROVIDER_NAME = 'Secure Cloud Storage';
