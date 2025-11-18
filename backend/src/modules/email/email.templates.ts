import {
  EmailContent,
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
 * Email Templates
 * All email templates with HTML and text versions
 */

/**
 * Welcome Email Template
 */
export function welcomeEmail(data: WelcomeEmailData): EmailContent {
  const subject = 'Welcome to MBBS Mentor!';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to MBBS Mentor</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MBBS Mentor!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <p>Welcome to MBBS Mentor - Your AI-powered companion for MBBS exam preparation!</p>
            <p>We're excited to have you on board. Here's what you can do with your account:</p>
            <ul>
              <li>Take unlimited practice tests</li>
              <li>Get AI-powered explanations for difficult concepts</li>
              <li>Upload and process your study notes</li>
              <li>Track your progress with detailed analytics</li>
              <li>Access subject-wise and topic-wise questions</li>
            </ul>
            <p>To get started, please verify your email address:</p>
            <div style="text-align: center;">
              <a href="${data.verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>You've received 100 free tokens to try out our AI features!</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy studying!</p>
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>This email was sent to you because you registered on MBBS Mentor.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to MBBS Mentor!

    Hi ${data.userName},

    Welcome to MBBS Mentor - Your AI-powered companion for MBBS exam preparation!

    We're excited to have you on board. Here's what you can do with your account:
    - Take unlimited practice tests
    - Get AI-powered explanations for difficult concepts
    - Upload and process your study notes
    - Track your progress with detailed analytics
    - Access subject-wise and topic-wise questions

    To get started, please verify your email address by clicking the link below:
    ${data.verificationLink}

    You've received 100 free tokens to try out our AI features!

    If you have any questions, feel free to reach out to our support team.

    Happy studying!
    The MBBS Mentor Team
  `;

  return { subject, html, text };
}

/**
 * Email Verification Template
 */
export function emailVerification(data: VerificationEmailData): EmailContent {
  const subject = 'Verify Your Email - MBBS Mentor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <p>Thanks for signing up with MBBS Mentor!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${data.verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${data.verificationLink}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with MBBS Mentor, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Verify Your Email - MBBS Mentor

    Hi ${data.userName},

    Thanks for signing up with MBBS Mentor!

    Please verify your email address by clicking the link below:
    ${data.verificationLink}

    This link will expire in 24 hours for security reasons.

    If you didn't create an account with MBBS Mentor, you can safely ignore this email.

    MBBS Mentor - Your AI-powered MBBS exam preparation platform
  `;

  return { subject, html, text };
}

/**
 * Password Reset Email Template
 */
export function passwordReset(data: PasswordResetEmailData): EmailContent {
  const subject = 'Reset Your Password - MBBS Mentor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <p>We received a request to reset your password for your MBBS Mentor account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #DC2626;">${data.resetLink}</p>
            <div class="warning">
              <p><strong>Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request a password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Reset Your Password - MBBS Mentor

    Hi ${data.userName},

    We received a request to reset your password for your MBBS Mentor account.

    Click the link below to reset your password:
    ${data.resetLink}

    Security Notice:
    - This link will expire in 1 hour for security reasons
    - If you didn't request a password reset, please ignore this email
    - Your password will remain unchanged until you create a new one

    MBBS Mentor - Your AI-powered MBBS exam preparation platform
  `;

  return { subject, html, text };
}

/**
 * Subscription Activated Email Template
 */
export function subscriptionActivated(data: SubscriptionActivatedEmailData): EmailContent {
  const subject = 'Subscription Activated - MBBS Mentor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Subscription Activated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Activated!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <p>Great news! Your subscription has been successfully activated.</p>
            <div class="info-box">
              <h3>Subscription Details:</h3>
              <ul>
                <li><strong>Plan:</strong> ${data.planName}</li>
                <li><strong>Tokens Received:</strong> ${data.tokens}</li>
                <li><strong>Valid Until:</strong> ${data.expiryDate}</li>
              </ul>
            </div>
            <p>You now have full access to all premium features:</p>
            <ul>
              <li>Unlimited practice tests</li>
              <li>AI-powered doubt clearing</li>
              <li>Advanced analytics and insights</li>
              <li>Priority support</li>
              <li>Offline access to study materials</li>
            </ul>
            <p>Start using your tokens and make the most of your subscription!</p>
            <p>Happy studying!</p>
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Subscription Activated - MBBS Mentor

    Hi ${data.userName},

    Great news! Your subscription has been successfully activated.

    Subscription Details:
    - Plan: ${data.planName}
    - Tokens Received: ${data.tokens}
    - Valid Until: ${data.expiryDate}

    You now have full access to all premium features:
    - Unlimited practice tests
    - AI-powered doubt clearing
    - Advanced analytics and insights
    - Priority support
    - Offline access to study materials

    Start using your tokens and make the most of your subscription!

    Happy studying!
    The MBBS Mentor Team
  `;

  return { subject, html, text };
}

/**
 * Subscription Expiring Email Template
 */
export function subscriptionExpiring(data: SubscriptionExpiringEmailData): EmailContent {
  const subject = 'Your Subscription is Expiring Soon - MBBS Mentor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Subscription Expiring Soon</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning-box { background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expiring Soon</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <div class="warning-box">
              <p><strong>Your subscription will expire in ${data.daysRemaining} days!</strong></p>
              <p>Expiry Date: ${data.expiryDate}</p>
            </div>
            <p>To continue enjoying premium features, renew your subscription today:</p>
            <ul>
              <li>Unlimited practice tests</li>
              <li>AI-powered explanations</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
            <p>Don't lose access to your progress and study materials!</p>
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Subscription Expiring Soon - MBBS Mentor

    Hi ${data.userName},

    Your subscription will expire in ${data.daysRemaining} days!
    Expiry Date: ${data.expiryDate}

    To continue enjoying premium features, renew your subscription today:
    - Unlimited practice tests
    - AI-powered explanations
    - Advanced analytics
    - Priority support

    Don't lose access to your progress and study materials!

    The MBBS Mentor Team
  `;

  return { subject, html, text };
}

/**
 * Test Completed Email Template
 */
export function testCompleted(data: TestCompletedEmailData): EmailContent {
  const subject = `Test Completed: ${data.testName} - MBBS Mentor`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .score-box { background-color: white; border: 2px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 6px; text-align: center; }
          .score { font-size: 48px; font-weight: bold; color: #4F46E5; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Test Completed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <p>Congratulations on completing your test: <strong>${data.testName}</strong></p>
            <div class="score-box">
              <div class="score">${data.percentage}%</div>
              <p>Your Score: ${data.score}</p>
            </div>
            <p>Great job! View your detailed analytics to see where you excelled and where you can improve.</p>
            <div style="text-align: center;">
              <a href="${data.detailsLink}" class="button">View Detailed Results</a>
            </div>
            <p>Keep up the good work and continue practicing!</p>
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Test Completed - MBBS Mentor

    Hi ${data.userName},

    Congratulations on completing your test: ${data.testName}

    Your Score: ${data.score}
    Percentage: ${data.percentage}%

    Great job! View your detailed analytics to see where you excelled and where you can improve.

    View detailed results: ${data.detailsLink}

    Keep up the good work and continue practicing!

    The MBBS Mentor Team
  `;

  return { subject, html, text };
}

/**
 * Note Processed Email Template
 */
export function noteProcessed(data: NoteProcessedEmailData): EmailContent {
  const subject =
    data.status === 'success'
      ? `Note Processed: ${data.noteTitle} - MBBS Mentor`
      : `Note Processing Failed: ${data.noteTitle} - MBBS Mentor`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Note Processed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${
            data.status === 'success' ? '#10B981' : '#DC2626'
          }; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .error-box { background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.status === 'success' ? 'Note Processed!' : 'Note Processing Failed'}</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            ${
              data.status === 'success'
                ? `
              <p>Your note <strong>${data.noteTitle}</strong> has been successfully processed!</p>
              <p>The text has been extracted and is now available for AI-powered analysis and Q&A.</p>
              <div style="text-align: center;">
                <a href="${data.noteLink}" class="button">View Note</a>
              </div>
              <p>You can now use this note for:</p>
              <ul>
                <li>AI-powered Q&A</li>
                <li>Concept explanations</li>
                <li>Summary generation</li>
                <li>Practice question creation</li>
              </ul>
            `
                : `
              <div class="error-box">
                <p><strong>Failed to process note: ${data.noteTitle}</strong></p>
                <p>${data.errorMessage || 'An error occurred during processing'}</p>
              </div>
              <p>Please try uploading the note again or contact support if the issue persists.</p>
            `
            }
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${data.status === 'success' ? 'Note Processed' : 'Note Processing Failed'} - MBBS Mentor

    Hi ${data.userName},

    ${
      data.status === 'success'
        ? `Your note "${data.noteTitle}" has been successfully processed!

    The text has been extracted and is now available for AI-powered analysis and Q&A.

    View note: ${data.noteLink}

    You can now use this note for:
    - AI-powered Q&A
    - Concept explanations
    - Summary generation
    - Practice question creation`
        : `Failed to process note: ${data.noteTitle}

    ${data.errorMessage || 'An error occurred during processing'}

    Please try uploading the note again or contact support if the issue persists.`
    }

    The MBBS Mentor Team
  `;

  return { subject, html, text };
}

/**
 * Low Token Balance Email Template
 */
export function lowTokenBalance(data: LowTokenBalanceEmailData): EmailContent {
  const subject = 'Low Token Balance - MBBS Mentor';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Low Token Balance</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning-box { background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Low Token Balance</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName},</h2>
            <div class="warning-box">
              <p><strong>Your token balance is running low!</strong></p>
              <p>Current Balance: ${data.currentBalance} tokens</p>
            </div>
            <p>You're running low on tokens. To continue using AI-powered features like:</p>
            <ul>
              <li>AI doubt clearing</li>
              <li>Concept explanations</li>
              <li>Note analysis</li>
              <li>Practice question generation</li>
            </ul>
            <p>Consider upgrading your plan or purchasing more tokens.</p>
            <div style="text-align: center;">
              <a href="${data.upgradeLink}" class="button">Upgrade Plan</a>
            </div>
            <p><strong>The MBBS Mentor Team</strong></p>
          </div>
          <div class="footer">
            <p>MBBS Mentor - Your AI-powered MBBS exam preparation platform</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Low Token Balance - MBBS Mentor

    Hi ${data.userName},

    Your token balance is running low!
    Current Balance: ${data.currentBalance} tokens

    You're running low on tokens. To continue using AI-powered features like:
    - AI doubt clearing
    - Concept explanations
    - Note analysis
    - Practice question generation

    Consider upgrading your plan or purchasing more tokens.

    Upgrade plan: ${data.upgradeLink}

    The MBBS Mentor Team
  `;

  return { subject, html, text };
}
