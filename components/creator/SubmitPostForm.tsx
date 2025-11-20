'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const submitPostSchema = z.object({
  postUrl: z.string()
    .url('Please enter a valid URL')
    .regex(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^/]+\/status\/\d{10,20}/, 'Must be a valid Twitter/X post URL'),
});

type SubmitPostFormData = z.infer<typeof submitPostSchema>;

interface SubmitPostFormProps {
  creatorId: string;
  projectId?: string;
}

export function SubmitPostForm({ creatorId, projectId }: SubmitPostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubmitPostFormData>({
    resolver: zodResolver(submitPostSchema),
  });

  const onSubmit = async (data: SubmitPostFormData) => {
    // Prevent double submission
    if (isSubmitting || success) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          creatorId,
          projectId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit post');
      }

      setSuccess(true);
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/creator/${creatorId}/posts`);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-2xl font-serif font-normal tracking-tight text-zinc-900">Submit New Post</CardTitle>
        <CardDescription className="text-sm">
          Submit a Twitter/X post for review. Once approved, you can start tracking metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Post URL */}
          <div className="space-y-2">
            <Label htmlFor="postUrl" className="text-sm font-medium text-zinc-900">Post URL *</Label>
            <Input
              id="postUrl"
              type="url"
              placeholder="https://twitter.com/username/status/1234567890"
              {...register('postUrl')}
              disabled={isSubmitting || success}
              className="h-11"
            />
            {errors.postUrl && (
              <p className="text-sm text-red-600">{errors.postUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Paste the full URL of your Twitter/X post
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Post submitted successfully! Redirecting to your posts...
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted!
                </>
              ) : (
                'Submit Post'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting || success}
            >
              Cancel
            </Button>
          </div>

          {/* Guidelines */}
          <div className="p-4 bg-zinc-50 rounded-lg space-y-2 border border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-900">Submission Guidelines</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Post must be from your verified Twitter/X account</li>
              <li>Posts are reviewed by admins before approval</li>
              <li>Only approved posts can have metrics tracked</li>
              <li>Ensure the post aligns with your project requirements</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
