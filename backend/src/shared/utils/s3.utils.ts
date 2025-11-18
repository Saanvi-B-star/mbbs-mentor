import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, awsConfig } from '@/config';
import { generateRandomString } from './crypto.utils';
import { sanitizeFilename, getFileExtension } from './string.utils';

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  file: Buffer,
  filename: string,
  mimetype: string,
  folder: string = 'uploads'
): Promise<string> => {
  const sanitized = sanitizeFilename(filename);
  const randomPrefix = generateRandomString(16);
  const key = `${folder}/${randomPrefix}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: awsConfig.s3.bucketName,
    Key: key,
    Body: file,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  return `https://${awsConfig.s3.bucketName}.s3.${awsConfig.s3.region}.amazonaws.com/${key}`;
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleToS3 = async (
  files: Array<{ buffer: Buffer; filename: string; mimetype: string }>,
  folder: string = 'uploads'
): Promise<string[]> => {
  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, file.filename, file.mimetype, folder)
  );

  return Promise.all(uploadPromises);
};

/**
 * Generate presigned URL for uploading
 */
export const generateUploadUrl = async (
  filename: string,
  mimetype: string,
  folder: string = 'uploads',
  expiresIn: number = 3600
): Promise<{ url: string; key: string }> => {
  const sanitized = sanitizeFilename(filename);
  const randomPrefix = generateRandomString(16);
  const key = `${folder}/${randomPrefix}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: awsConfig.s3.bucketName,
    Key: key,
    ContentType: mimetype,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return { url, key };
};

/**
 * Generate presigned URL for downloading
 */
export const generateDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: awsConfig.s3.bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: awsConfig.s3.bucketName,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Extract S3 key from URL
 */
export const extractS3Key = (url: string): string => {
  const urlObj = new URL(url);
  return urlObj.pathname.substring(1); // Remove leading slash
};

/**
 * Get file info from URL
 */
export const getFileInfoFromUrl = (url: string): { key: string; filename: string; extension: string } => {
  const key = extractS3Key(url);
  const parts = key.split('/');
  const filename = parts[parts.length - 1] || '';
  const extension = getFileExtension(filename);

  return { key, filename, extension };
};
