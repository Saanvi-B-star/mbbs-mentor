import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } from '@aws-sdk/client-ses';
import { sesClient, awsConfig } from '@/config';
import { logger } from '@/config';
import { SendEmailDto } from './email.types';

/**
 * SES Client Service
 * Wrapper around AWS SES SDK with utility methods
 */
export class SESService {
  private client: SESClient;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.client = sesClient;
    this.fromEmail = awsConfig.ses.fromEmail;
    this.fromName = awsConfig.ses.fromName;
  }

  /**
   * Send a single email
   */
  async sendEmail(params: SendEmailDto): Promise<void> {
    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to];

      const command = new SendEmailCommand({
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: params.html,
              Charset: 'UTF-8',
            },
            Text: params.text
              ? {
                  Data: params.text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      });

      const response = await this.client.send(command);

      logger.info('Email sent successfully', {
        messageId: response.MessageId,
        recipients: recipients.length,
      });
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        recipients: params.to,
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails (multiple recipients)
   */
  async sendBulkEmail(recipients: string[], subject: string, html: string, text?: string): Promise<void> {
    try {
      // Split recipients into batches of 50 (SES limit)
      const batchSize = 50;
      const batches: string[][] = [];

      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      // Send emails in batches
      const sendPromises = batches.map((batch) =>
        this.sendEmail({
          to: batch,
          subject,
          html,
          text,
        })
      );

      await Promise.all(sendPromises);

      logger.info('Bulk emails sent successfully', {
        totalRecipients: recipients.length,
        batches: batches.length,
      });
    } catch (error: any) {
      logger.error('Failed to send bulk emails', {
        error: error.message,
        totalRecipients: recipients.length,
      });
      throw new Error(`Failed to send bulk emails: ${error.message}`);
    }
  }

  /**
   * Verify an email address in SES
   * Required before sending emails from that address
   */
  async verifyEmail(email: string): Promise<void> {
    try {
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: email,
      });

      await this.client.send(command);

      logger.info('Email verification initiated', { email });
    } catch (error: any) {
      logger.error('Failed to verify email', {
        error: error.message,
        email,
      });
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmailWithRetry(
    params: SendEmailDto,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendEmail(params);
        return; // Success, exit function
      } catch (error: any) {
        lastError = error;
        logger.warn(`Email send attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries,
        });

        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to send email after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Send templated email with automatic text generation from HTML
   */
  async sendTemplatedEmail(
    to: string | string[],
    subject: string,
    html: string
  ): Promise<void> {
    // Generate plain text version from HTML (basic implementation)
    const text = this.htmlToText(html);

    await this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Batch send emails with individual customization
   */
  async sendBatchCustomized(
    emails: Array<{ to: string; subject: string; html: string; text?: string }>
  ): Promise<void> {
    const sendPromises = emails.map((email) =>
      this.sendEmailWithRetry({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
    );

    try {
      await Promise.allSettled(sendPromises);
      logger.info('Batch customized emails sent', {
        total: emails.length,
      });
    } catch (error: any) {
      logger.error('Failed to send batch customized emails', {
        error: error.message,
      });
      throw error;
    }
  }
}

export const sesService = new SESService();
