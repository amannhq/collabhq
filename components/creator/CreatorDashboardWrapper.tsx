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
    <div className="relative">
      {/* Dashboard Content */}
      <div className={requirePasswordChange ? 'pointer-events-none blur-sm' : ''}>
        {children}
      </div>

      {/* Password Change Modal - Always shown when requirePasswordChange is true */}
      <PasswordChangeModal isOpen={mounted} requirePasswordChange={requirePasswordChange} />
    </div>
  );
}
