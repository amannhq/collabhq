'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChangePasswordForm } from './ChangePasswordForm';

interface PasswordChangeModalProps {
  isOpen: boolean;
  requirePasswordChange: boolean;
}

export function PasswordChangeModal({ isOpen, requirePasswordChange }: PasswordChangeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(isOpen && requirePasswordChange);

  useEffect(() => {
    setOpen(isOpen && requirePasswordChange);
  }, [isOpen, requirePasswordChange]);

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  // Prevent closing if password change is required
  const handleOpenChange = (newOpen: boolean) => {
    if (!requirePasswordChange) {
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          if (requirePasswordChange) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (requirePasswordChange) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Set New Password</DialogTitle>
          <DialogDescription>
            {requirePasswordChange
              ? 'For security reasons, you must change your temporary password before continuing.'
              : 'Update your password to keep your account secure.'}
          </DialogDescription>
        </DialogHeader>

        <ChangePasswordForm onSuccess={handleSuccess} isFirstLogin={requirePasswordChange} />
      </DialogContent>
    </Dialog>
  );
}
