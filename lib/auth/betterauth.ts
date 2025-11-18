// lib/auth/betterauth.ts
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { createLogger } from "@/lib/utils/logger";
import { sendEmail } from "@/lib/services/email/email-service";
import { OTPEmail } from "@/lib/services/email/templates/OTPEmail";
import connectDB from "@/lib/db/mongodb";
import type { IUser } from "@/lib/db/models/User";
import {
  createOrganizationForUser,
  userHasOrganization,
  getCompanyName,
} from "./organization-helpers";

const logger = createLogger('better-auth');

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set');
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is not set');
}

/**
 * Constants for Better Auth configuration
 */
const AUTH_CONSTANTS = {
  SESSION_EXPIRES_IN: 60 * 60 * 24 * 7, // 7 days
  SESSION_UPDATE_AGE: 60 * 60 * 24, // 1 day
  COOKIE_CACHE_MAX_AGE: 5 * 60, // 5 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  OTP_LENGTH: 6,
  OTP_EXPIRES_IN: 300, // 5 minutes
} as const;

/**
 * Email subjects for OTP emails
 */
const OTP_EMAIL_SUBJECTS = {
  'email-verification': 'Verify Your Email - Collab',
  'sign-in': 'Sign In Code - Collab',
  'forget-password': 'Reset Your Password - Collab',
} as const;

// Create MongoDB client for Better Auth
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
    // Use plural collection names to match Mongoose models
    usePlural: true,
  }),
  
  emailAndPassword: {
    enabled: true,
    minPasswordLength: AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
    maxPasswordLength: AUTH_CONSTANTS.PASSWORD_MAX_LENGTH,
    autoSignIn: true,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: 'offline',
      prompt: 'select_account consent',
    },
  },
  
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  
  session: {
    expiresIn: AUTH_CONSTANTS.SESSION_EXPIRES_IN,
    updateAge: AUTH_CONSTANTS.SESSION_UPDATE_AGE,
    cookieCache: {
      enabled: true,
      maxAge: AUTH_CONSTANTS.COOKIE_CACHE_MAX_AGE,
    },
  },

  // Rate limiting recommended by Better Auth performance guide
  rateLimit: {
    window: 60, // 60-second window
    max: 100, // 100 requests per window per identifier
  },
  
  // CRITICAL: Cookie settings for production
  trustedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.BETTER_AUTH_URL as string, process.env.NEXT_PUBLIC_APP_URL as string].filter(Boolean)
    : undefined,
  
  basePath: '/api/auth',
  baseURL: process.env.BETTER_AUTH_URL,
  
  advanced: {
    cookiePrefix: 'better-auth',
    crossSubDomainCookies: {
      enabled: false, // Set to true if using subdomains
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    database: {
      generateId: () => {
        // Use MongoDB ObjectId format
        return new Date().getTime().toString(36) + Math.random().toString(36).substring(2);
      },
    },
  },
  
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'creator',
        input: false, // Don't allow users to set this directly
      },
      organizationId: {
        type: 'string',
        required: false,
        input: false,
      },
      avatar: {
        type: 'string',
        required: false,
      },
      loginCount: {
        type: 'number',
        required: false,
        defaultValue: 0,
        input: false,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
  },
  
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    disabled: false,
  },
  
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const subject =
            OTP_EMAIL_SUBJECTS[type as keyof typeof OTP_EMAIL_SUBJECTS] ||
            'Verification Code - Collab';

          await sendEmail({
            to: email,
            subject,
            react: OTPEmail({
              otp,
              type: type as 'email-verification' | 'sign-in' | 'forget-password',
            }),
          });

          logger.info({ email, type }, 'OTP sent successfully');
        } catch (error) {
          logger.error({ error, email, type }, 'Failed to send OTP email');
          throw error;
        }
      },
      otpLength: AUTH_CONSTANTS.OTP_LENGTH,
      expiresIn: AUTH_CONSTANTS.OTP_EXPIRES_IN,
      sendVerificationOnSignUp: false, // We'll trigger manually
    }),
  ],
  
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Always set role to 'admin' for signups (organizations)
          return {
            data: {
              ...user,
              role: 'admin',
            },
          };
        },
      after: async (user) => {
        // IMPORTANT: Only create organization if email is verified
        // Email verification will be handled separately via OTP
        // Organization creation happens after email verification

        // Check if this is a social login (Google) - they have emailVerified by default
        const isSocialLogin = user.emailVerified === true;

        if (!isSocialLogin) {
          logger.info(
            { userId: user.id, email: user.email },
            'User created, waiting for email verification before creating organization'
          );
          return;
        }

        // Check if user already has an organization (prevent duplicates)
        const hasOrg = await userHasOrganization(user.id);
        if (hasOrg) {
          logger.info(
            { userId: user.id },
            'User already has organization, skipping creation'
          );
          return;
        }

        // For social logins, create organization immediately
        const companyName = getCompanyName(
          user as { companyName?: string },
          user.email
        );

        if (!companyName) {
          logger.warn(
            { userId: user.id, email: user.email },
            'Could not extract company name from email'
          );
          return;
        }

        await createOrganizationForUser(user.id, user.email, companyName);
      },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // When a social account is linked/created, ensure user has organization
          try {
            await connectDB();
            const User = (await import('@/lib/db/models/User')).default;
            
            const user = await User.findById(account.userId)
              .select('email organizationId')
              .lean<IUser>();
            
            if (!user) {
              logger.warn({ accountId: account.id }, 'User not found for account');
              return;
            }

            // If user already has organization, skip
            if (user.organizationId) {
              logger.info(
                { userId: user._id.toString() },
                'User already has organization, skipping creation'
              );
              return;
            }

            // Create organization for social sign-in users
            const companyName = getCompanyName(null, user.email);
            if (!companyName) {
              logger.warn(
                { userId: user._id.toString(), email: user.email },
                'Could not extract company name from email'
              );
              return;
            }

            await createOrganizationForUser(
              user._id.toString(),
              user.email,
              companyName
            );
          } catch (error) {
            logger.error(
              { error, accountId: account.id },
              'Failed to create organization for social account'
            );
          }
        },
      },
    },
  },
});

logger.info({ baseURL: process.env.BETTER_AUTH_URL }, 'Better Auth initialized');