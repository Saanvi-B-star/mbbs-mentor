import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { TextractClient } from '@aws-sdk/client-textract';
import { config } from './environment';
import { logger } from './logger';

/**
 * AWS S3 Client Configuration (Optional)
 * Used for file uploads and storage
 */
export const s3Client = config.aws.s3.enabled && config.aws.credentials.accessKeyId
  ? new S3Client({
      region: config.aws.s3.region,
      credentials: config.aws.credentials as any,
    })
  : null;

/**
 * AWS SES Client Configuration (Optional)
 * Used for sending emails
 */
export const sesClient = config.aws.ses.enabled && config.aws.credentials.accessKeyId
  ? new SESClient({
      region: config.aws.ses.region,
      credentials: config.aws.credentials as any,
    })
  : null;

/**
 * AWS Textract Client Configuration (Optional)
 * Used for OCR and text extraction from documents
 */
export const textractClient = config.aws.textract.enabled && config.aws.credentials.accessKeyId
  ? new TextractClient({
      region: config.aws.textract.region,
      credentials: config.aws.credentials as any,
    })
  : null;

/**
 * AWS Configuration Object
 */
export const awsConfig = {
  enabled: config.aws.enabled,
  s3: {
    enabled: config.aws.s3.enabled,
    client: s3Client,
    bucketName: config.aws.s3.bucketName,
    region: config.aws.s3.region,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  },
  ses: {
    enabled: config.aws.ses.enabled,
    client: sesClient,
    fromEmail: config.aws.ses.fromEmail,
    fromName: config.aws.ses.fromName,
  },
  textract: {
    enabled: config.aws.textract.enabled,
    client: textractClient,
  },
} as const;

// Log AWS service status
if (config.aws.enabled) {
  logger.info('AWS services initialized:');
  if (config.aws.s3.enabled) {
    if (s3Client) {
      logger.info(`  - S3 enabled (Bucket: ${config.aws.s3.bucketName}, Region: ${config.aws.s3.region})`);
    } else {
      logger.warn('  - S3 configuration present but client failed to initialize');
    }
  }
  if (config.aws.ses.enabled) logger.info('  - SES enabled');
  if (config.aws.textract.enabled) logger.info('  - Textract enabled');
} else {
  logger.warn('AWS services not configured - File uploads, email, and OCR will be falling back to local/disabled');
}
