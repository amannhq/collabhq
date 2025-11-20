'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
}

export function OTPVerification({ email, onVerify, onResend, isLoading = false }: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value && newOtp.every(digit => digit)) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only allow 6-digit numbers
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError(null);
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (otpValue?: string) => {
    const otpCode = otpValue || otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setError(null);
      await onVerify(otpCode);
      // Success - onVerify handles redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      // Clear OTP on error
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError(null);
      await onResend();
      setResendCountdown(60); // 60 seconds cooldown
      setOtp(new Array(6).fill('')); // Clear OTP
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-lg">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-md">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <div>
          <CardTitle className="text-3xl font-semibold text-zinc-900 tracking-tight">Verify Your Email</CardTitle>
          <CardDescription className="mt-3 text-base">
            We&apos;ve sent a 6-digit verification code to
            <div className="flex items-center justify-center gap-2 mt-3 bg-[#f3f1ea] rounded-lg px-4 py-2.5 border border-zinc-200">
              <Mail className="w-4 h-4 text-zinc-600" />
              <span className="font-medium text-sm text-zinc-900">{email}</span>
            </div>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8">
        {error && (
          <div className="p-4 text-sm bg-red-50 text-red-800 rounded-xl border-2 border-red-200 font-medium">
            {error}
          </div>
        )}

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isLoading}
              className="w-14 h-16 text-center text-2xl font-bold border-2 border-zinc-300 rounded-xl focus:border-black focus:ring-2 focus:ring-black transition-all bg-white hover:border-zinc-400"
            />
          ))}
        </div>

        <div className="space-y-4 pt-2">
          <Button
            onClick={() => handleSubmit()}
            disabled={isLoading || otp.some(digit => !digit)}
            className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-xl text-base font-medium shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-zinc-600 mb-3">
              Didn&apos;t receive the code?
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending || resendCountdown > 0}
              className="text-zinc-900 hover:text-black hover:bg-zinc-100 font-medium rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : isResending
                ? 'Sending...'
                : 'Resend Code'}
            </Button>
          </div>
        </div>

        <div className="bg-[#f3f1ea] border-2 border-zinc-200 rounded-xl p-4 mt-2">
          <p className="text-sm text-zinc-800 leading-relaxed">
            <strong className="font-semibold">💡 Tip:</strong> The code expires in 5 minutes. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
