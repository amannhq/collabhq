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

const updateMetricsSchema = z.object({
  likes: z.number().min(0, 'Likes must be 0 or greater'),
  retweets: z.number().min(0, 'Retweets must be 0 or greater'),
  replies: z.number().min(0, 'Replies must be 0 or greater'),
  impressions: z.number().min(0, 'Impressions must be 0 or greater'),
  bookmarks: z.number().min(0, 'Bookmarks must be 0 or greater').optional(),
  profileVisits: z.number().min(0, 'Profile visits must be 0 or greater').optional(),
});

type UpdateMetricsFormData = z.infer<typeof updateMetricsSchema>;

interface UpdateMetricsFormProps {
  postId: string;
  creatorId: string;
  currentMetrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
    bookmarks?: number;
    profileVisits?: number;
  };
}

export function UpdateMetricsForm({ postId, creatorId, currentMetrics }: UpdateMetricsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMetricsFormData>({
    resolver: zodResolver(updateMetricsSchema),
    defaultValues: {
      likes: currentMetrics?.likes || 0,
      retweets: currentMetrics?.retweets || 0,
      replies: currentMetrics?.replies || 0,
      impressions: currentMetrics?.impressions || 0,
      bookmarks: currentMetrics?.bookmarks || 0,
      profileVisits: currentMetrics?.profileVisits || 0,
    },
  });

  const onSubmit = async (data: UpdateMetricsFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/posts/${postId}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update metrics');
      }

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/creator/${creatorId}/posts/${postId}`);
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Metrics</CardTitle>
        <CardDescription>
          Enter the latest metrics from your post&apos;s analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Required Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Likes */}
            <div className="space-y-2">
              <Label htmlFor="likes">Likes *</Label>
              <Input
                id="likes"
                type="number"
                min="0"
                {...register('likes')}
                disabled={isSubmitting || success}
              />
              {errors.likes && (
                <p className="text-sm text-destructive">{errors.likes.message}</p>
              )}
            </div>

            {/* Retweets */}
            <div className="space-y-2">
              <Label htmlFor="retweets">Retweets *</Label>
              <Input
                id="retweets"
                type="number"
                min="0"
                {...register('retweets')}
                disabled={isSubmitting || success}
              />
              {errors.retweets && (
                <p className="text-sm text-destructive">{errors.retweets.message}</p>
              )}
            </div>

            {/* Replies */}
            <div className="space-y-2">
              <Label htmlFor="replies">Replies *</Label>
              <Input
                id="replies"
                type="number"
                min="0"
                {...register('replies')}
                disabled={isSubmitting || success}
              />
              {errors.replies && (
                <p className="text-sm text-destructive">{errors.replies.message}</p>
              )}
            </div>

            {/* Impressions */}
            <div className="space-y-2">
              <Label htmlFor="impressions">Impressions *</Label>
              <Input
                id="impressions"
                type="number"
                min="0"
                {...register('impressions')}
                disabled={isSubmitting || success}
              />
              {errors.impressions && (
                <p className="text-sm text-destructive">{errors.impressions.message}</p>
              )}
            </div>
          </div>

          {/* Optional Metrics */}
          <div>
            <h4 className="text-sm font-medium mb-3">Optional Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Bookmarks */}
              <div className="space-y-2">
                <Label htmlFor="bookmarks">Bookmarks</Label>
                <Input
                  id="bookmarks"
                  type="number"
                  min="0"
                  {...register('bookmarks')}
                  disabled={isSubmitting || success}
                />
                {errors.bookmarks && (
                  <p className="text-sm text-destructive">{errors.bookmarks.message}</p>
                )}
              </div>

              {/* Profile Visits */}
              <div className="space-y-2">
                <Label htmlFor="profileVisits">Profile Visits</Label>
                <Input
                  id="profileVisits"
                  type="number"
                  min="0"
                  {...register('profileVisits')}
                  disabled={isSubmitting || success}
                />
                {errors.profileVisits && (
                  <p className="text-sm text-destructive">{errors.profileVisits.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Metrics updated successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Updated!
                </>
              ) : (
                'Update Metrics'
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
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Tips for Accurate Metrics</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Get metrics from your Twitter/X Analytics dashboard</li>
              <li>Update metrics every 24 hours for accurate tracking</li>
              <li>Ensure numbers are current to track growth properly</li>
              <li>Required fields: Likes, Retweets, Replies, Impressions</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
