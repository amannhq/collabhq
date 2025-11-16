# Administrator Quick Start Guide

## Getting Started with Your Organization

Congratulations! Your organization has been created. This guide will help you set up your branding and email templates.

## Step 1: Customize Your Branding

1. **Navigate to Settings**
   - Click on your organization name in the sidebar
   - Select "Settings" from the menu

2. **Update Your Logo**
   - Go to the "Branding" tab
   - Enter your logo URL in the "Logo URL" field
   - Preview will update automatically
   - Recommended size: 200x60px

3. **Set Your Brand Colors**
   - Choose your primary brand color (used for buttons, links)
   - Choose your secondary color (used for accents)
   - See live preview of how emails will look

4. **Configure Email Settings**
   - Set "Email From Name" (e.g., "Acme Corp Team")
   - Add email signature (appears in all emails)
   - Set notification email address

5. **Save Your Changes**
   - Click "Save Changes"
   - Your branding is now applied to all emails!

## Step 2: Review Default Email Templates

Your organization comes with 3 pre-configured email templates:

### 1. Creator Invitation
**When it's used**: When you invite a creator to join a project

**What it includes**:
- Personalized greeting
- Project name and details
- "Accept Invitation" button
- Your branding (logo, colors)

### 2. Welcome Email
**When it's used**: When a creator accepts their invitation

**What it includes**:
- Welcome message
- Getting started information
- "Go to Dashboard" button
- Your branding

### 3. Post Reminder
**When it's used**: Remind creators about pending posts

**What it includes**:
- Friendly reminder
- Pending posts count
- "Submit Posts" button
- Your branding

## Step 3: Customize Email Templates (Optional)

Want to personalize your email templates? Here's how:

1. **Navigate to Email Templates**
   - Go to Settings → Email Templates
   - You'll see all available templates

2. **Preview a Template**
   - Click "Preview" on any template
   - Enter sample data
   - See exactly how the email will look

3. **Edit a Template**
   - Click "Edit" on the template you want to customize
   - Update content in three tabs:

   **Content Tab**:
   - Template name and slug
   - Email subject line
   - Heading and body text
   - Button text and URL
   - Footer text

   **Branding Tab**:
   - Override organization colors (optional)
   - Set custom logo for this template
   - Choose different fonts

   **Settings Tab**:
   - Set as default template
   - Activate/deactivate template
   - Choose category

4. **Use Variables**
   - Click variable buttons to insert dynamic content
   - Available variables:
     - `{{name}}` - Recipient's name
     - `{{email}}` - Recipient's email
     - `{{organizationName}}` - Your organization name
     - `{{projectName}}` - Project name
     - `{{inviteUrl}}` - Invitation link
     - `{{dashboardUrl}}` - Dashboard link

5. **Save and Test**
   - Click "Save Changes"
   - Preview with sample data
   - Send test email to yourself (coming soon)

## Step 4: Invite Your First Creator

1. **Create a Project**
   - Navigate to Projects → New Project
   - Fill in project details
   - Click "Create Project"

2. **Invite Creators**
   - Go to Creators → Invite Creator
   - Enter creator's email and name
   - Select the project
   - Click "Send Invitation"

3. **Email Sent!**
   - Creator receives beautifully branded invitation
   - Email uses your custom template (or default)
   - Includes your logo and brand colors

## Best Practices

### Branding
- ✅ Use high-quality logo images
- ✅ Choose accessible color combinations
- ✅ Keep email signature concise
- ✅ Test branding on multiple devices

### Email Templates
- ✅ Keep subject lines under 50 characters
- ✅ Use clear, action-oriented CTAs
- ✅ Test templates with sample data before going live
- ✅ Include your organization name in greetings
- ✅ Add helpful footer text (contact info, support)

### Variables
- ✅ Always use `{{name}}` for personalization
- ✅ Double-check variable spelling
- ✅ Test with different data types
- ✅ Provide fallback text when appropriate

## Common Tasks

### Change Primary Brand Color
1. Settings → Branding
2. Update "Primary Brand Color"
3. Save Changes
4. All emails now use new color

### Create a New Template
1. Settings → Email Templates
2. Click "Create New Template"
3. Choose template type
4. Customize content and branding
5. Set as default (optional)
6. Save

### Update Email Signature
1. Settings → Branding
2. Scroll to "Email Branding"
3. Update "Email Signature"
4. Save Changes

### Preview Before Sending
1. Settings → Email Templates
2. Click "Preview" on template
3. Enter sample data (your email)
4. Click "Generate Preview"
5. Review rendered email

## Frequently Asked Questions

### Q: Can I use different branding for different templates?
**A**: Yes! Each template has a "Branding" tab where you can override organization-level colors and logo.

### Q: What happens if I don't customize templates?
**A**: Your default templates will be used. They include your organization branding and work great out of the box!

### Q: Can I deactivate a template?
**A**: Yes, in template settings, toggle "Active" off. The system will fall back to the default template.

### Q: How do I test my templates?
**A**: Use the Preview feature with sample data. Send test email feature coming soon!

### Q: Can I have multiple templates for the same type?
**A**: Yes, create multiple templates. Only one can be set as "default" per type.

### Q: What if I want to revert to defaults?
**A**: Either deactivate your custom template, or delete it. The system will automatically use defaults.

## Advanced Tips

### Variable Insertion Shortcuts
- Click variable buttons in the editor to avoid typos
- Variables are case-sensitive
- Use `{{organizationName}}` consistently for branding

### Testing Templates
1. Create a template
2. Preview with realistic data
3. Check all variables are replaced
4. Verify colors and logo appear correctly
5. Test on mobile preview

### Template Versioning
- Keep template name descriptive
- Use slug to identify templates programmatically
- Document major changes in template content

### Performance
- Use optimized logo images (WebP, PNG)
- Keep email HTML simple
- Test email client compatibility

## Need Help?

### Resources
- **Email Template Variables**: `/docs/email-templates/TEMPLATE_VARIABLES.md`
- **Full Email System Docs**: `/docs/email-templates/EMAIL_TEMPLATE_SYSTEM.md`
- **Branding System Docs**: `/docs/branding/BRANDING_SYSTEM.md`

### Support
- Contact your system administrator
- Check application logs for errors
- Review documentation in `/docs` folder

## Next Steps

1. ✅ Customize your branding
2. ✅ Review default templates
3. ✅ Create your first project
4. ✅ Invite your first creator
5. ✅ Watch emails in action!

---

**Welcome to your Creator Tracker platform!** 🚀

Your organization is now ready to:
- Send beautifully branded emails
- Invite creators to projects
- Track performance and analytics
- Grow your creator network

If you have any questions, refer to the documentation or reach out to support.

Happy creating! ✨
