// hooks/useAuth.ts
'use client';

import { useSession } from '@/lib/auth/client';

export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user || null,
    session: session.data?.session || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error,
  };
}
