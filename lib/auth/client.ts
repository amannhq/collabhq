// lib/auth/client.ts
'use client';

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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
