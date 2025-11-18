// lib/auth/client.ts
'use client';

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

function resolveBaseURL() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

export const authClient = createAuthClient({
  baseURL: resolveBaseURL(),
  plugins: [emailOTPClient()],
});

// Export commonly used hooks and functions
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  changePassword,
  resetPassword,
  forgetPassword,
  updateUser,
} = authClient;
