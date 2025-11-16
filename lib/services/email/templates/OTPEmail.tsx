import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
} from '@react-email/components';

interface OTPEmailProps {
  otp: string;
  type: 'email-verification' | 'sign-in' | 'forget-password';
}

const titles = {
  'email-verification': 'Verify Your Email',
  'sign-in': 'Sign In to Your Account',
  'forget-password': 'Reset Your Password',
};

const descriptions = {
  'email-verification': 'Thank you for signing up! Use the verification code below to complete your registration and start managing your creator partnerships.',
  'sign-in': 'Use the code below to securely sign in to your account. This code will expire in 5 minutes.',
  'forget-password': 'You requested to reset your password. Use the code below to create a new password for your account.',
};

export const OTPEmail = ({ otp, type }: OTPEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>Collab</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={title}>{titles[type]}</Text>
            <Text style={description}>{descriptions[type]}</Text>

            {/* OTP Box */}
            <Section style={otpBox}>
              <Text style={otpText}>{otp}</Text>
            </Section>

            <Text style={expiry}>This code will expire in 5 minutes.</Text>

            {/* Security Notice */}
            <Section style={securityBox}>
              <Text style={securityText}>
                🔒 For your security, never share this code with anyone.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Collab. Built for creator-first teams.
            </Text>
            <Text style={footerLink}>
              If you didn't request this code, please ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OTPEmail;

// Styles matching the main page design
const main = {
  backgroundColor: '#f3f1ea',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const logoSection = {
  backgroundColor: '#f3f1ea',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logoText = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#000000',
  margin: '0',
  letterSpacing: '-0.5px',
};

const content = {
  padding: '48px 40px',
};

const title = {
  fontSize: '32px',
  fontWeight: '600',
  color: '#000000',
  margin: '0 0 16px 0',
  lineHeight: '1.2',
  letterSpacing: '-0.5px',
};

const description = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: 'rgba(0, 0, 0, 0.7)',
  margin: '0 0 32px 0',
};

const otpBox = {
  backgroundColor: '#000000',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const otpText = {
  fontSize: '48px',
  fontWeight: '700',
  letterSpacing: '12px',
  color: '#ffffff',
  margin: '0',
  fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
};

const expiry = {
  fontSize: '14px',
  color: 'rgba(0, 0, 0, 0.5)',
  margin: '0 0 32px 0',
  textAlign: 'center' as const,
};

const securityBox = {
  backgroundColor: '#f3f1ea',
  border: '2px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0',
};

const securityText = {
  fontSize: '14px',
  color: 'rgba(0, 0, 0, 0.8)',
  margin: '0',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: 'rgba(0, 0, 0, 0.1)',
  margin: '0',
};

const footer = {
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '13px',
  color: 'rgba(0, 0, 0, 0.5)',
  margin: '0 0 8px 0',
};

const footerLink = {
  fontSize: '13px',
  color: 'rgba(0, 0, 0, 0.4)',
  margin: '0',
};
