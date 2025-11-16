# Organization Branding & Email Template System - Complete

## Overview
A comprehensive branding and email customization system that allows organizations to:
- Customize their brand identity (colors, logo, email signature)
- Manage email templates with full control over content and design
- Automatically initialize default templates for new organizations
- Preview emails before sending

## System Components

### 1. Organization Branding Settings

#### API Endpoint
**File**: `/app/api/organizations/[orgId]/settings/route.ts`

**Endpoints**:
- `GET /api/organizations/:orgId/settings` - Fetch organization settings
- `PATCH /api/organizations/:orgId/settings` - Update organization settings

**Settings Schema**:
```typescript
{
  logo: string (URL),
  primaryColor: string (hex),
  secondaryColor: string (hex),
  notificationEmail: string (email),
  timezone: string,
  dateFormat: string,
  emailSignature: string,
  emailFromName: string
}
```

**Security**: Owner-only access

#### UI Component
**File**: `/components/settings/BrandingSettings.tsx`

**Features**:
- Logo URL input with preview
- Color pickers for primary/secondary colors
- Email branding section (from name, signature)
- Regional settings (timezone, date format)
- Live preview of branding in action
- Form validation with Zod

**Preview**:
Shows a sample email card with:
- Organization logo
- Custom gradient background (using brand colors)
- Sample button with primary color
- Demonstrates how emails will appear

#### Settings Page
**File**: `/app/(dashboard)/[org]/settings/page.tsx`

**Features**:
- Tabbed interface (Branding, General, Subscription)
- Owner-only access check
- Suspense boundaries for loading states
- Integration with BrandingSettings component

### 2. Organization Model Updates

**File**: `/lib/db/models/Organization.ts`

**Added Fields**:
```typescript
settings: {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  notificationEmail: string;
  timezone: string;
  dateFormat: string;
  emailSignature?: string;      // NEW
  emailFromName?: string;        // NEW
}
```

**Defaults**:
- `primaryColor`: '#3b82f6' (Blue)
- `secondaryColor`: '#10b981' (Green)
- `timezone`: 'UTC'
- `dateFormat`: 'MM/DD/YYYY'

### 3. Email Service Integration

**File**: `/lib/services/email/email-service.tsx`

**Updated**: `getTemplateWithBranding()` function now:
1. Loads organization from database
2. Checks for custom email template
3. Falls back to organization branding settings
4. Uses system defaults if neither exists

**Priority Order**:
1. Custom template branding (if template exists)
2. Organization settings (logo, colors)
3. System defaults

**Example**:
```typescript
const branding = customTemplate?.branding || {
  primaryColor: organization?.settings?.primaryColor || '#667eea',
  secondaryColor: organization?.settings?.secondaryColor || '#764ba2',
  logoUrl: organization?.settings?.logo || undefined,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
};
```

### 4. Default Template Initialization

#### Utility Functions
**File**: `/lib/utils/email-template-utils.ts`

**Functions**:

1. **`initializeDefaultTemplates(organizationId, branding?)`**
   - Creates default templates for a new organization
   - Uses organization branding or defaults
   - Checks for existing templates (idempotent)
   - Returns array of created template IDs

2. **`getDefaultTemplateConfig(slug)`**
   - Returns configuration for a specific template
   - Used for reference and testing

3. **`getAllDefaultTemplateConfigs()`**
   - Returns all default template configurations
   - Useful for documentation

**Default Templates**:

1. **Invitation Template** (`slug: 'invitation'`)
   - Category: Transactional
   - Subject: "You're invited to join {{projectName}} at {{organizationName}}"
   - Variables: name, email, organizationName, projectName, inviteUrl
   - CTA: "Accept Invitation"

2. **Welcome Template** (`slug: 'welcome'`)
   - Category: Transactional
   - Subject: "Welcome to {{organizationName}}! 🚀"
   - Variables: name, email, organizationName, dashboardUrl
   - CTA: "Go to Dashboard"

3. **Reminder Template** (`slug: 'reminder'`)
   - Category: Notification
   - Subject: "Reminder: Pending posts at {{organizationName}}"
   - Variables: name, email, organizationName, dashboardUrl
   - CTA: "Submit Posts"

#### Seed Script
**File**: `/scripts/seed-email-templates.ts`

**Purpose**: Initialize templates for existing organizations

**Usage**:
```bash
bun run db:seed:templates
```

**Features**:
- Connects to database
- Finds all organizations
- Creates default templates for each
- Skips existing templates
- Logs progress and summary

**Output**:
```
✅ Email Templates Seeding Complete!
   Organizations: 5
   Templates Created: 15
   Templates Skipped: 0
```

#### Auth Hook Integration
**File**: `/lib/auth/betterauth.ts`

**Updated**: User creation and social sign-in hooks now:
1. Create organization for new user
2. **Automatically initialize default email templates**
3. Log success/failure

**Code**:
```typescript
// After organization creation
await initializeDefaultTemplates(
  organization._id.toString(),
  {
    primaryColor: organization.settings?.primaryColor,
    secondaryColor: organization.settings?.secondaryColor,
    logoUrl: organization.settings?.logo,
  }
);
```

**Error Handling**: Non-blocking - if template creation fails, user and org are still created

## User Flows

### New Organization Signup
1. User signs up (email or social)
2. Organization is created automatically
3. Default email templates are initialized
4. User can immediately customize templates or use defaults

### Customizing Branding
1. Admin navigates to Settings → Branding
2. Uploads logo, sets brand colors
3. Configures email from name and signature
4. Saves changes
5. All email templates automatically use new branding

### Creating Custom Template
1. Admin navigates to Settings → Email Templates
2. Clicks "Create New Template"
3. Chooses template type (invitation, welcome, reminder)
4. Customizes content, branding, settings
5. Previews template with sample data
6. Saves template
7. Template is used for all future emails of that type

### Email Sending Process
1. System needs to send email (e.g., invitation)
2. Calls `sendInvitationEmail()` with organizationId
3. Email service loads template:
   - Checks for custom template
   - Falls back to organization branding
   - Uses system defaults if needed
4. Variables are replaced with actual data
5. Email is rendered using React Email
6. Sent via Resend API

## Configuration

### Environment Variables
```bash
# Organization Settings (optional, uses defaults)
# All organization settings are stored in database

# Email Templates
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Collections
- `organizations` - Organization data and settings
- `emailtemplates` - Custom email templates
- `users` - User data (linked to organization)

## File Structure

```
/app
  /api
    /organizations/[orgId]
      /settings
        route.ts              # Branding settings API
  /(dashboard)/[org]
    /settings
      page.tsx                # Settings page with tabs

/components
  /settings
    BrandingSettings.tsx      # Branding form component

/lib
  /db/models
    Organization.ts           # Updated with email fields
  /services/email
    email-service.tsx         # Updated to use org branding
  /utils
    email-template-utils.ts   # Template initialization utilities
  /auth
    betterauth.ts             # Updated with auto-init

/scripts
  seed-email-templates.ts     # Seed script for existing orgs
```

## Testing Checklist

### Branding Settings
- [ ] Navigate to organization settings
- [ ] Update logo URL and verify preview
- [ ] Change primary/secondary colors
- [ ] See preview update with new colors
- [ ] Update email from name and signature
- [ ] Save changes and verify success
- [ ] Reload page and confirm settings persist

### Template Initialization
- [ ] Sign up new user
- [ ] Verify organization is created
- [ ] Check that 3 default templates exist
- [ ] Verify templates use organization colors
- [ ] Run seed script on existing org
- [ ] Confirm templates are created

### Email Integration
- [ ] Send invitation email
- [ ] Verify custom template is used (if exists)
- [ ] Verify organization branding is applied
- [ ] Check logo appears in email
- [ ] Verify brand colors are used
- [ ] Test variable replacement

### Permissions
- [ ] Verify only owners can access settings
- [ ] Test non-owner redirect
- [ ] Verify settings API requires authentication

## Future Enhancements

1. **Logo Upload**:
   - File upload to cloud storage (S3, Cloudinary)
   - Image cropping and resizing
   - Logo management UI

2. **Advanced Email Settings**:
   - Custom from email domain
   - SMTP configuration
   - Reply-to addresses
   - Email footer with unsubscribe

3. **Template Marketplace**:
   - Pre-built template gallery
   - One-click template import
   - Template versioning

4. **A/B Testing**:
   - Multiple template variants
   - Performance tracking
   - Automatic winner selection

5. **Multi-Language Support**:
   - Localized templates
   - Language detection
   - Translation management

## Troubleshooting

### Templates Not Created on Signup
- Check database connection
- Verify logger output for errors
- Run seed script manually: `bun run db:seed:templates`
- Check organization has valid settings

### Branding Not Applied to Emails
- Verify organization settings are saved
- Check email service logs
- Ensure template loads organization data
- Verify branding fallback chain

### Settings Page Not Loading
- Check user is organization owner
- Verify API endpoint returns data
- Check browser console for errors
- Confirm organization ID is valid

## Summary

This system provides:
✅ Complete organization branding control
✅ Automatic template initialization for new organizations
✅ Seamless integration with email service
✅ Flexible customization with sensible defaults
✅ Owner-only security
✅ Comprehensive error handling
✅ Easy migration for existing organizations

**Total Files Created**: 5
**API Endpoints Added**: 2
**Components Created**: 1
**Utilities Added**: 1
**Scripts Created**: 1
**Database Updates**: 1 model extended

---

**Status**: ✅ All Tasks Complete
**Phase**: Organization Branding & Template Initialization
**Ready for**: Production deployment
