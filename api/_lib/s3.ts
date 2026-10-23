import { S3Client } from '@aws-sdk/client-s3';
import { ensureEnvLoaded } from './env.js';

export function getS3Client(): S3Client {
  ensureEnvLoaded();

  const isB2 = process.env.STORAGE_PROVIDER === 'b2';

  const endpoint = isB2
    ? process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com'
    : process.env.AWS_ENDPOINT_URL_S3 ||
      'https://br-broad-haze-azjye671.storage.c-3.ap-southeast-1.aws.neon.tech';

  const region = isB2
    ? process.env.B2_REGION || 'us-east-005'
    : process.env.AWS_REGION || 'ap-southeast-1';

  const accessKeyId = isB2
    ? process.env.B2_KEY_ID || '0058edff86170e60000000002'
    : process.env.AWS_ACCESS_KEY_ID || 'nak_live_a0406dc108dd4bf9bfea9393ec2ec6e9';

  const secretAccessKey = isB2
    ? process.env.B2_APPLICATION_KEY || 'K00599VfJDm8AFc94upS8rAjP5CbgTg'
    : process.env.AWS_SECRET_ACCESS_KEY ||
      'nsk_live_b12d9327bf5442f3211474abde750eec08c38d6f9914303f9818b513f859c9ec';

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
  const isB2 = process.env.STORAGE_PROVIDER === 'b2';
  return isB2 ? process.env.B2_BUCKET_NAME || 'PicUrl-RASSHQA' : 'images';
}

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const instance = getS3Client() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const BUCKET_NAME = 'images';
export const STORAGE_PROVIDER_NAME = 'Secure Cloud Storage';
