'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BrandBackground } from '@/components/ui/brand-background';
import { Eye, EyeOff, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password', '');

  // Password validation checks
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      );
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: SignupInput) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create account
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: '/dashboard',
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        return;
      }

      // Store email for OTP verification
      setUserEmail(data.email);

      // Send OTP for email verification
      try {
        await authClient.emailOtp.sendVerificationOtp({
          email: data.email,
          type: 'email-verification',
        });

        toast.success('Verification code sent to your email');
        setShowOTPVerification(true);
      } catch (otpError) {
        console.error('Failed to send OTP:', otpError);
        setError('Account created but failed to send verification code. Please contact support.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      setIsLoading(true);
      
      const result = await authClient.emailOtp.verifyEmail({
        email: userEmail,
        otp,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Invalid verification code');
      }

      toast.success('Email verified successfully!');

      // Create organization after email verification
      try {
        const orgResponse = await fetch('/api/auth/setup-organization', {
          method: 'POST',
          credentials: 'include',
        });

        const orgData = await orgResponse.json();

        if (orgData.success) {
          toast.success('Welcome! Redirecting to your dashboard...');
          router.push('/');
          router.refresh();
        } else {
          console.error('Failed to create organization:', orgData.error);
          toast.error('Setup failed. Please try logging in.');
          setTimeout(() => router.push('/login'), 1500);
        }
      } catch (orgError) {
        console.error('Organization setup error:', orgError);
        toast.error('Setup failed. Please try logging in.');
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err) {
      throw err; // Re-throw to show error in OTP component
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await authClient.emailOtp.sendVerificationOtp({
      email: userEmail,
      type: 'email-verification',
    });
    toast.success('New verification code sent');
  };

  const layoutTransition: Transition = {
    type: 'spring',
    stiffness: 140,
    damping: 22,
    mass: 0.8,
  };

  // Show OTP verification screen if needed
  if (showOTPVerification) {
    return (
      <motion.div
        layout
        transition={layoutTransition}
        className="flex items-center justify-center min-h-screen"
      >
        <motion.div layout transition={layoutTransition}>
          <OTPVerification
            email={userEmail}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            isLoading={isLoading}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      transition={layoutTransition}
      className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-0 overflow-hidden rounded-2xl shadow-xl bg-white"
    >
      {/* Left Side - Brand Section */}
      <motion.div
        layout
        transition={layoutTransition}
        className="bg-zinc-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Brand Background Effect */}
        <BrandBackground variant="warm" intensity="medium" />
        
        <div className="relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-normal leading-tight mb-4">
              Start managing <span className="italic">creators</span> today
            </h1>
            <p className="text-zinc-300 text-lg">
              Join teams managing thousands of creator partnerships with Collab.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-zinc-400">
          <p>Built for creator first teams</p>
        </div>
      </motion.div>

      {/* Right Side - Signup Form */}
      <motion.div
        layout
        transition={layoutTransition}
        className="p-8 md:p-12 bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">
            Create your account
          </h2>
          <p className="text-zinc-600">
            Get started with Collab today
          </p>
        </div>

        <motion.div layout transition={layoutTransition} className="space-y-5">
          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-zinc-300 hover:bg-zinc-50"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading || isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-200 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-zinc-900">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                {...register('companyName')}
                disabled={isLoading}
                className="border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-900">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                disabled={isLoading}
                className="border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-900">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                disabled={isLoading}
                className="border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-900">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  disabled={isLoading}
                  className="pr-10 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              
              {/* Password Requirements - Animated Dropdown */}
              <motion.div
                layout
                initial={false}
                animate={{ height: passwordFocus ? 'auto' : 0, opacity: passwordFocus ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {passwordChecks.minLength ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className={passwordChecks.minLength ? 'text-green-600' : 'text-zinc-500'}>
                      8+ chars
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordChecks.hasUppercase ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className={passwordChecks.hasUppercase ? 'text-green-600' : 'text-zinc-500'}>
                      Uppercase
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordChecks.hasLowercase ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className={passwordChecks.hasLowercase ? 'text-green-600' : 'text-zinc-500'}>
                      Lowercase
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordChecks.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    )}
                    <span className={passwordChecks.hasNumber ? 'text-green-600' : 'text-zinc-500'}>
                      Number
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-900">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                  className="pr-10 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
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
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-200">
            <p className="text-sm text-center text-zinc-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-zinc-900 hover:text-zinc-700 font-medium underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
