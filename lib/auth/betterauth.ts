// lib/auth/betterauth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { createLogger } from "@/lib/utils/logger";
import connectDB from "@/lib/db/mongodb";
import Organization from "@/lib/db/models/Organization";
import User from "@/lib/db/models/User";
import { extractCompanyFromEmail } from "@/lib/utils/email-validation";
import { initializeDefaultTemplates } from "@/lib/utils/email-template-utils";

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
    minPasswordLength: 8,
    maxPasswordLength: 128,
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (update session every day)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
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
  
  advanced: {
    database: {
      generateId: () => {
        // Use MongoDB ObjectId format
        return new Date().getTime().toString(36) + Math.random().toString(36).substring(2);
      },
    },
  },
  
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    disabled: false,
  },
  
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
          try {
            // Connect to MongoDB
            await connectDB();
            
            // Get company name from user metadata or extract from email
            const companyName = (user as { companyName?: string }).companyName || 
              extractCompanyFromEmail(user.email);
            
            if (!companyName) {
              logger.warn({ userId: user.id, email: user.email }, 'Could not extract company name from email');
              return;
            }
            
            // Generate unique slug
            const baseSlug = companyName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            
            let slug = baseSlug;
            let counter = 1;
            
            // Ensure slug is unique
            while (await Organization.findOne({ slug })) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }
            
            // Create organization
            const organization = await Organization.create({
              name: companyName,
              slug,
              ownerId: user.id,
              settings: {
                notificationEmail: user.email,
              },
              subscription: {
                plan: 'free',
                status: 'trial',
                startDate: new Date(),
                // 14-day trial
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              },
            });
            
            // Update user with organizationId
            await User.findByIdAndUpdate(user.id, {
              organizationId: organization._id,
            });
            
            logger.info(
              { 
                userId: user.id, 
                organizationId: organization._id.toString(),
                slug,
              }, 
              'Organization created for new user'
            );

            // Initialize default email templates for the organization
            try {
              await initializeDefaultTemplates(
                organization._id.toString(),
                {
                  primaryColor: organization.settings?.primaryColor,
                  secondaryColor: organization.settings?.secondaryColor,
                  logoUrl: organization.settings?.logo,
                }
              );
              logger.info(
                { organizationId: organization._id.toString() },
                'Default email templates initialized'
              );
            } catch (templateError) {
              logger.error(
                { error: templateError, organizationId: organization._id.toString() },
                'Failed to initialize default email templates'
              );
              // Don't throw - organization is created, templates can be created later
            }
          } catch (error) {
            logger.error(
              { error, userId: user.id }, 
              'Failed to create organization for user'
            );
            // Don't throw - user is already created, we can handle org creation separately
          }
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // When a social account is linked/created, ensure user has organization
          try {
            await connectDB();
            
            const user = await User.findById(account.userId);
            if (!user) return;
            
            // If user already has organization, skip
            if (user.organizationId) return;
            
            // Create organization for social sign-in users
            const companyName = extractCompanyFromEmail(user.email);
            if (!companyName) return;
            
            const baseSlug = companyName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            
            let slug = baseSlug;
            let counter = 1;
            
            while (await Organization.findOne({ slug })) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }
            
            const organization = await Organization.create({
              name: companyName,
              slug,
              ownerId: user._id,
              settings: {
                notificationEmail: user.email,
              },
              subscription: {
                plan: 'free',
                status: 'trial',
                startDate: new Date(),
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              },
            });
            
            await User.findByIdAndUpdate(user._id, {
              organizationId: organization._id,
            });
            
            logger.info(
              { userId: user._id.toString(), organizationId: organization._id.toString() },
              'Organization created for social sign-in user'
            );

            // Initialize default email templates
            try {
              await initializeDefaultTemplates(
                organization._id.toString(),
                {
                  primaryColor: organization.settings?.primaryColor,
                  secondaryColor: organization.settings?.secondaryColor,
                  logoUrl: organization.settings?.logo,
                }
              );
              logger.info(
                { organizationId: organization._id.toString() },
                'Default email templates initialized for social sign-in user'
              );
            } catch (templateError) {
              logger.error(
                { error: templateError, organizationId: organization._id.toString() },
                'Failed to initialize default email templates'
              );
            }
          } catch (error) {
            logger.error({ error, accountId: account.id }, 'Failed to create organization for social account');
          }
        },
      },
    },
  },
});

logger.info({ baseURL: process.env.BETTER_AUTH_URL }, 'Better Auth initialized');