'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandBackground } from '@/components/ui/brand-background';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { Eye, EyeOff, Video } from 'lucide-react';

export default function CreatorLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to sign in');
        return;
      }

      // Redirect to root - let server-side logic handle role-based redirect
      // This is much faster than multiple client-side API calls
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const layoutTransition: Transition = {
    type: 'spring',
    stiffness: 140,
    damping: 22,
    mass: 0.8,
  };

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
        <BrandBackground variant="cool" intensity="medium" />
        
        <div className="relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
              <Video className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-normal leading-tight mb-4">
              Creator <span className="italic">Portal</span>
            </h1>
            <p className="text-zinc-300 text-lg">
              Access your dashboard, submit content, and track your performance with ease.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-zinc-400">
          <p>Built for creator first teams</p>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        layout
        transition={layoutTransition}
        className="p-8 md:p-12 bg-white"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">
            Sign in as Creator
          </h2>
          <p className="text-zinc-600">
            Access your creator dashboard
          </p>
        </div>

        <motion.form layout transition={layoutTransition} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="email" className="text-zinc-900">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={isLoading}
              className="border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-zinc-900">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-zinc-600 hover:text-zinc-900 underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
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
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in as Creator'}
          </Button>

          <div className="pt-4 border-t border-zinc-200">
            <p className="text-sm text-center text-zinc-600">
              Admin user?{' '}
              <Link href="/login" className="text-zinc-900 hover:text-zinc-700 font-medium underline">
                Admin Login
              </Link>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
