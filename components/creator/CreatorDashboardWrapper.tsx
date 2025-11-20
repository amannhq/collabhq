'use client';

import { useEffect, useState } from 'react';
import { PasswordChangeModal } from '@/components/auth/PasswordChangeModal';

interface CreatorDashboardWrapperProps {
  requirePasswordChange: boolean;
  children: React.ReactNode;
}

export function CreatorDashboardWrapper({
  requirePasswordChange,
  children,
}: CreatorDashboardWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Track mount status for client-side rendering
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Always render children, just conditionally show the modal
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <PasswordChangeModal isOpen={mounted} requirePasswordChange={requirePasswordChange} />
    </>
  );
}
