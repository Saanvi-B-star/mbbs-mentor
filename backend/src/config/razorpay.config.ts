import Razorpay from 'razorpay';
import { config } from './environment';
import { logger } from './logger';

/**
 * Razorpay Client Instance (Optional)
 * https://razorpay.com/docs/api/
 */
export const razorpayClient = config.razorpay.enabled && config.razorpay.keyId && config.razorpay.keySecret
  ? new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    })
  : null;

/**
 * Razorpay Configuration
 */
export const razorpayConfig = {
  enabled: config.razorpay.enabled,
  keyId: config.razorpay.keyId,
  keySecret: config.razorpay.keySecret,
  webhookSecret: config.razorpay.webhookSecret,

  // Currency
  currency: 'INR',

  // Payment capture mode
  captureMode: 'automatic' as const,

  // Payment methods enabled
  paymentMethods: {
    card: true,
    netbanking: true,
    wallet: true,
    upi: true,
    emi: false,
    paylater: false,
    cardless_emi: false,
  },

  // Subscription plans (to be created in Razorpay dashboard)
  plans: {
    free: {
      id: 'plan_free',
      name: 'Free',
      amount: 0,
      tokenAllocation: 100,
      billingCycle: 'monthly',
    },
    premium_monthly: {
      id: 'plan_premium_monthly',
      name: 'Premium Monthly',
      amount: 999, // in INR
      tokenAllocation: 1000,
      billingCycle: 'monthly',
    },
    premium_quarterly: {
      id: 'plan_premium_quarterly',
      name: 'Premium Quarterly',
      amount: 2499, // in INR
      tokenAllocation: 3500,
      billingCycle: 'quarterly',
    },
    premium_yearly: {
      id: 'plan_premium_yearly',
      name: 'Premium Yearly',
      amount: 7999, // in INR
      tokenAllocation: 15000,
      billingCycle: 'yearly',
    },
    pro_monthly: {
      id: 'plan_pro_monthly',
      name: 'Pro Monthly',
      amount: 1999, // in INR
      tokenAllocation: 2500,
      billingCycle: 'monthly',
    },
    pro_quarterly: {
      id: 'plan_pro_quarterly',
      name: 'Pro Quarterly',
      amount: 4999, // in INR
      tokenAllocation: 8000,
      billingCycle: 'quarterly',
    },
    pro_yearly: {
      id: 'plan_pro_yearly',
      name: 'Pro Yearly',
      amount: 15999, // in INR
      tokenAllocation: 35000,
      billingCycle: 'yearly',
    },
  },

  // Webhook events to handle
  webhookEvents: [
    'payment.captured',
    'payment.failed',
    'payment.authorized',
    'subscription.activated',
    'subscription.charged',
    'subscription.completed',
    'subscription.cancelled',
    'subscription.paused',
    'subscription.resumed',
    'subscription.pending',
    'subscription.halted',
  ],

  // Checkout options
  checkout: {
    theme: {
      color: '#3B82F6', // Tailwind blue-500
    },
    image: '/logo.png', // Your logo URL
    prefill: {
      method: 'card' as const,
    },
    notes: {
      platform: 'MBBS Mentor',
    },
  },

  // Retry configuration for failed payments
  retry: {
    maxAttempts: 3,
    backoff: [2000, 4000, 8000], // milliseconds
  },
} as const;

export type RazorpayConfig = typeof razorpayConfig;

// Log Razorpay service status
if (config.razorpay.enabled) {
  logger.info('Razorpay payment gateway initialized');
} else {
  logger.warn('Razorpay not configured - Payment functionality will be disabled');
}
