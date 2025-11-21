/**
 * Resend Template Configuration
 *
 * This file manages Resend template IDs and provides utilities
 * for switching between React Email components and Resend templates.
 */

export const RESEND_TEMPLATE_IDS = {
  invitation: process.env.RESEND_TEMPLATE_INVITATION || '',
  'invitation-with-message': process.env.RESEND_TEMPLATE_INVITATION_WITH_MESSAGE || '',
  welcome: process.env.RESEND_TEMPLATE_WELCOME || '',
  otp: process.env.RESEND_TEMPLATE_OTP || '',
  reminder: process.env.RESEND_TEMPLATE_REMINDER || '',
} as const;

export type ResendTemplateType = keyof typeof RESEND_TEMPLATE_IDS;

/**
 * Check if Resend templates should be used instead of React Email components
 */
export const shouldUseResendTemplates = (): boolean => {
  return process.env.USE_RESEND_TEMPLATES === 'true';
};

/**
 * Get template ID for a specific template type
 */
export const getTemplateId = (type: ResendTemplateType): string | null => {
  const templateId = RESEND_TEMPLATE_IDS[type];
  return templateId || null;
};

/**
 * Check if a specific template is configured
 */
export const isTemplateConfigured = (type: ResendTemplateType): boolean => {
  return Boolean(RESEND_TEMPLATE_IDS[type]);
};

/**
 * Get all configured template types
 */
export const getConfiguredTemplates = (): ResendTemplateType[] => {
  return Object.entries(RESEND_TEMPLATE_IDS)
    .filter(([, id]) => Boolean(id))
    .map(([type]) => type as ResendTemplateType);
};
