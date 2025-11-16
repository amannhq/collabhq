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
    setMounted(true);
  }, []);

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
