import { sesService } from './ses.client';
import * as templates from './email.templates';
import { logger } from '@/config';
import {
  EmailTemplate,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  SubscriptionActivatedEmailData,
  SubscriptionExpiringEmailData,
  TestCompletedEmailData,
  NoteProcessedEmailData,
  LowTokenBalanceEmailData,
} from './email.types';

/**
 * Email Service
 * High-level email sending service with template support
 */
export class EmailService {
  /**
   * Send a raw email
   */
  async sendEmail(to: string | string[], subject: string, html: string, text?: string): Promise<void> {
    try {
      await sesService.sendEmail({ to, subject, html, text });
      logger.info('Email sent', { to, subject });
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        to,
        subject,
      });
      throw error;
    }
  }

  /**
   * Send templated email
   */
  async sendTemplateEmail(
    template: EmailTemplate,
    to: string | string[],
    data: any
  ): Promise<void> {
    try {
      let emailContent;

      switch (template) {
        case EmailTemplate.WELCOME:
          emailContent = templates.welcomeEmail(data as WelcomeEmailData);
          break;
        case EmailTemplate.EMAIL_VERIFICATION:
          emailContent = templates.emailVerification(data as VerificationEmailData);
          break;
        case EmailTemplate.PASSWORD_RESET:
          emailContent = templates.passwordReset(data as PasswordResetEmailData);
          break;
        case EmailTemplate.SUBSCRIPTION_ACTIVATED:
          emailContent = templates.subscriptionActivated(data as SubscriptionActivatedEmailData);
          break;
        case EmailTemplate.SUBSCRIPTION_EXPIRING:
          emailContent = templates.subscriptionExpiring(data as SubscriptionExpiringEmailData);
          break;
        case EmailTemplate.TEST_COMPLETED:
          emailContent = templates.testCompleted(data as TestCompletedEmailData);
          break;
        case EmailTemplate.NOTE_PROCESSED:
          emailContent = templates.noteProcessed(data as NoteProcessedEmailData);
          break;
        case EmailTemplate.LOW_TOKEN_BALANCE:
          emailContent = templates.lowTokenBalance(data as LowTokenBalanceEmailData);
          break;
        default:
          throw new Error(`Unknown email template: ${template}`);
      }

      await this.sendEmail(to, emailContent.subject, emailContent.html, emailContent.text);
      logger.info('Template email sent', { template, to });
    } catch (error: any) {
      logger.error('Failed to send template email', {
        error: error.message,
        template,
        to,
      });
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: { email: string; name: string }, verificationToken: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.sendTemplateEmail(EmailTemplate.WELCOME, user.email, {
      userName: user.name,
      verificationLink,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(user: { email: string; name: string }, verificationToken: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.sendTemplateEmail(EmailTemplate.EMAIL_VERIFICATION, user.email, {
      userName: user.name,
      verificationLink,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: { email: string; name: string }, resetToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendTemplateEmail(EmailTemplate.PASSWORD_RESET, user.email, {
      userName: user.name,
      resetLink,
    });
  }

  /**
   * Send subscription activated email
   */
  async sendSubscriptionEmail(
    user: { email: string; name: string },
    subscription: {
      planName: string;
      expiryDate: Date;
      tokens: number;
    }
  ): Promise<void> {
    const expiryDate = subscription.expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await this.sendTemplateEmail(EmailTemplate.SUBSCRIPTION_ACTIVATED, user.email, {
      userName: user.name,
      planName: subscription.planName,
      expiryDate,
      tokens: subscription.tokens,
    });
  }

  /**
   * Send subscription expiring email
   */
  async sendSubscriptionExpiringEmail(
    user: { email: string; name: string },
    subscription: {
      expiryDate: Date;
    }
  ): Promise<void> {
    const expiryDate = subscription.expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const now = new Date();
    const daysRemaining = Math.ceil(
      (subscription.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await this.sendTemplateEmail(EmailTemplate.SUBSCRIPTION_EXPIRING, user.email, {
      userName: user.name,
      expiryDate,
      daysRemaining,
    });
  }

  /**
   * Send test completed email
   */
  async sendTestCompletedEmail(
    user: { email: string; name: string },
    test: {
      name: string;
      attemptId: string;
    },
    results: {
      score: number;
      percentage: number;
    }
  ): Promise<void> {
    const detailsLink = `${process.env.FRONTEND_URL}/test/results/${test.attemptId}`;

    await this.sendTemplateEmail(EmailTemplate.TEST_COMPLETED, user.email, {
      userName: user.name,
      testName: test.name,
      score: results.score,
      percentage: results.percentage,
      detailsLink,
    });
  }

  /**
   * Send note processed email
   */
  async sendNoteProcessedEmail(
    user: { email: string; name: string },
    note: {
      id: string;
      title: string;
      status: 'success' | 'failed';
      errorMessage?: string;
    }
  ): Promise<void> {
    const noteLink = `${process.env.FRONTEND_URL}/notes/${note.id}`;

    await this.sendTemplateEmail(EmailTemplate.NOTE_PROCESSED, user.email, {
      userName: user.name,
      noteTitle: note.title,
      noteLink,
      status: note.status,
      errorMessage: note.errorMessage,
    });
  }

  /**
   * Send low token balance email
   */
  async sendLowTokenBalanceEmail(
    user: { email: string; name: string; currentTokenBalance: number }
  ): Promise<void> {
    const upgradeLink = `${process.env.FRONTEND_URL}/subscription/plans`;

    await this.sendTemplateEmail(EmailTemplate.LOW_TOKEN_BALANCE, user.email, {
      userName: user.name,
      currentBalance: user.currentTokenBalance,
      upgradeLink,
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(recipients: string[], subject: string, html: string, text?: string): Promise<void> {
    try {
      await sesService.sendBulkEmail(recipients, subject, html, text);
      logger.info('Bulk email sent', { recipients: recipients.length, subject });
    } catch (error: any) {
      logger.error('Failed to send bulk email', {
        error: error.message,
        recipients: recipients.length,
        subject,
      });
      throw error;
    }
  }

  /**
   * Send notification email (generic)
   */
  async sendNotificationEmail(
    to: string | string[],
    subject: string,
    message: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MBBS Mentor</h1>
            </div>
            <div class="content">
              ${message}
            </div>
            <div class="footer">
              <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = message.replace(/<[^>]+>/g, '').trim();

    await this.sendEmail(to, subject, html, text);
  }

  /**
   * Check if we should send low token balance email
   * (to avoid spamming users)
   */
  shouldSendLowTokenEmail(currentBalance: number, threshold: number = 50): boolean {
    // Send email when balance drops below threshold
    // Can add additional logic like checking when last email was sent
    return currentBalance < threshold && currentBalance > 0;
  }

  /**
   * Check if we should send subscription expiring email
   */
  shouldSendExpiringEmail(expiryDate: Date, daysBeforeExpiry: number = 7): boolean {
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send email when subscription is about to expire
    return daysRemaining > 0 && daysRemaining <= daysBeforeExpiry;
  }
}

export const emailService = new EmailService();
