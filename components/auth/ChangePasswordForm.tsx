'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  isFirstLogin?: boolean;
}

export function ChangePasswordForm({ onSuccess, isFirstLogin = false }: ChangePasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword', '');

  // Password validation checks
  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Enter temporary password"
            {...register('currentPassword')}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Create new password"
            {...register('newPassword')}
            onFocus={() => setPasswordFocus(true)}
            onBlur={() => setPasswordFocus(false)}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-red-500">{errors.newPassword.message}</p>
        )}

        {/* Password Requirements - Animated Dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            passwordFocus ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-wrap gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5">
              {passwordChecks.minLength ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              )}
              <span className={passwordChecks.minLength ? 'text-green-600' : 'text-zinc-500'}>
                8+ chars
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {passwordChecks.hasUppercase ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              )}
              <span className={passwordChecks.hasUppercase ? 'text-green-600' : 'text-zinc-500'}>
                Uppercase
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {passwordChecks.hasLowercase ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              )}
              <span className={passwordChecks.hasLowercase ? 'text-green-600' : 'text-zinc-500'}>
                Lowercase
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {passwordChecks.hasNumber ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
              )}
              <span className={passwordChecks.hasNumber ? 'text-green-600' : 'text-zinc-500'}>
                Number
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            {...register('confirmPassword')}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </Button>
    </form>
  );
}
