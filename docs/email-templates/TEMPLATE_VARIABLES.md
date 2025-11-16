# Email Template Variables Reference

## Variable Syntax

All template variables use double curly braces: `{{variableName}}`

Example:
```html
<p>Hi {{name}},</p>
<p>Welcome to {{organizationName}}!</p>
```

## Available Variables

### User Information
| Variable | Description | Example Value | Required In |
|----------|-------------|---------------|-------------|
| `{{name}}` | Recipient's full name | "John Doe" | All templates |
| `{{email}}` | Recipient's email address | "john@example.com" | All templates |

### Organization Information
| Variable | Description | Example Value | Required In |
|----------|-------------|---------------|-------------|
| `{{organizationName}}` | Organization display name | "Acme Corp" | All templates |

### Project Information
| Variable | Description | Example Value | Required In |
|----------|-------------|---------------|-------------|
| `{{projectName}}` | Project name | "Summer Campaign 2024" | Invitation |

### URLs and Links
| Variable | Description | Example Value | Required In |
|----------|-------------|---------------|-------------|
| `{{inviteUrl}}` | Invitation acceptance link | "https://app.com/invite/abc123" | Invitation |
| `{{dashboardUrl}}` | Creator dashboard link | "https://app.com/creator/dashboard" | Welcome, Reminder |

## Template-Specific Variables

### Invitation Email (`slug: 'invitation'`)
```typescript
{
  name: string,              // ✅ Required
  email: string,             // ✅ Required  
  organizationName: string,  // ✅ Required
  projectName: string,       // ✅ Required
  inviteUrl: string,         // ✅ Required
}
```

**Example Subject:**
```
You're invited to join {{projectName}} at {{organizationName}}
```

**Example Body:**
```html
<p>Hi {{name}},</p>
<p>You've been invited to contribute to <strong>{{projectName}}</strong> at {{organizationName}}.</p>
<p>Click the button below to accept your invitation:</p>
<!-- CTA Button with {{inviteUrl}} -->
<p>If you didn't expect this email, you can safely ignore it.</p>
```

### Welcome Email (`slug: 'welcome'`)
```typescript
{
  name: string,              // ✅ Required
  email: string,             // ✅ Required
  organizationName: string,  // ✅ Required
  dashboardUrl: string,      // ✅ Required
}
```

**Example Subject:**
```
Welcome to {{organizationName}}!
```

**Example Body:**
```html
<p>Hi {{name}},</p>
<p>Welcome to {{organizationName}}! We're excited to have you on board.</p>
<p>Your creator account has been successfully created. You can now access your dashboard to start submitting posts.</p>
<!-- CTA Button with {{dashboardUrl}} -->
<p>If you have any questions, feel free to reach out.</p>
```

### Reminder Email (`slug: 'reminder'`)
```typescript
{
  name: string,              // ✅ Required
  email: string,             // ✅ Required
  organizationName: string,  // ✅ Required
  dashboardUrl: string,      // ✅ Required
  pendingCount?: number,     // Optional
  daysRemaining?: number,    // Optional
}
```

**Example Subject:**
```
Reminder: You have pending posts at {{organizationName}}
```

**Example Body:**
```html
<p>Hi {{name}},</p>
<p>This is a friendly reminder that you have pending posts waiting for submission at {{organizationName}}.</p>
<p>Please log in to your dashboard to review and submit your posts.</p>
<!-- CTA Button with {{dashboardUrl}} -->
<p>Thank you for your contributions!</p>
```

## Usage in Templates

### Subject Line
Variables can be used directly in the subject field:
```
Welcome to {{organizationName}}, {{name}}!
```

### Preview Text
Pre-header text shown in email clients:
```
Get started with {{projectName}} today
```

### Body Content
Full HTML support with variables:
```html
<h1>Hello {{name}}!</h1>
<p>Welcome to <strong>{{organizationName}}</strong>.</p>
<p>
  We're thrilled to have you join us. Your account ({{email}}) 
  is now active and ready to use.
</p>
```

### CTA Button URL
Use variables in button URLs:
```
{{inviteUrl}}
{{dashboardUrl}}
```

### Footer Text
```
This email was sent to {{email}} by {{organizationName}}.
If you didn't expect this email, please ignore it.
```

## Variable Insertion Tips

1. **Use the Insert Buttons**: In the template editor, click variable insertion buttons to avoid typos
2. **Match Exact Syntax**: Variables are case-sensitive (`{{name}}` not `{{Name}}`)
3. **No Spaces**: `{{name}}` not `{{ name }}`
4. **Test with Preview**: Use the preview page to verify variable replacement before sending

## Fallback Behavior

If a variable is not provided when sending an email:
- Variable remains as-is: `{{missingVariable}}`
- No error is thrown
- Email is still sent

**Best Practice**: Always provide all required variables for your template type.

## Custom Variables

To add new variables:
1. Update the `EmailTemplate` model's `variables` array
2. Modify the email service to pass the new variable
3. Update the preview form to include the new field
4. Document the variable in this reference

## Example Implementation

```typescript
// Sending an invitation email
await sendInvitationEmail(
  'john@example.com',
  {
    name: 'John Doe',
    organizationName: 'Acme Corp',
    projectName: 'Summer Campaign',
    inviteUrl: 'https://app.com/invite/abc123',
  },
  organizationId
);

// The template with:
// Subject: "Join {{projectName}} at {{organizationName}}"
// Becomes: "Join Summer Campaign at Acme Corp"
```

## Validation

When creating/editing templates, the system:
- ✅ Lists available variables in the UI
- ✅ Provides insertion buttons to prevent errors
- ✅ Shows variable syntax examples
- ✅ Allows preview with sample data

## Security Notes

- Variables are replaced before rendering
- HTML content is sanitized by React Email
- No script execution in variable values
- XSS protection built-in

---

**Last Updated**: Phase 6 - Email Template Management System
**Template Types**: invitation, welcome, reminder
**Total Variables**: 7 core variables (extendable)
