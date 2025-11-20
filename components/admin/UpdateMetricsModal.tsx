'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const metricsSchema = z.object({
  likes: z.number().min(0, 'Likes must be 0 or greater'),
  retweets: z.number().min(0, 'Retweets must be 0 or greater'),
  replies: z.number().min(0, 'Replies must be 0 or greater'),
  impressions: z.number().min(0, 'Impressions must be 0 or greater'),
});

type MetricsFormData = z.infer<typeof metricsSchema>;

interface UpdateMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentMetrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
    impressions?: number;
  };
  onSuccess?: () => void;
}

export function UpdateMetricsModal({
  open,
  onOpenChange,
  postId,
  currentMetrics,
  onSuccess,
}: UpdateMetricsModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MetricsFormData>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      likes: currentMetrics?.likes || 0,
      retweets: currentMetrics?.retweets || 0,
      replies: currentMetrics?.replies || 0,
      impressions: currentMetrics?.impressions || 0,
    },
  });

  const onSubmit = async (data: MetricsFormData) => {
    if (isSubmitting || success) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/posts/${postId}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update metrics');
      }

      setSuccess(true);

      // Close modal and refresh after 1 second
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
        if (onSuccess) onSuccess();
        // Reset states after closing
        setTimeout(() => {
          setSuccess(false);
          setIsSubmitting(false);
          reset();
        }, 300);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !success) {
      onOpenChange(false);
      setTimeout(() => {
        reset();
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-normal tracking-tight text-zinc-900">
            Update Post Metrics
          </DialogTitle>
          <DialogDescription className="text-sm">
            Enter the current metrics for this post. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Likes */}
          <div className="space-y-2">
            <Label htmlFor="likes" className="text-sm font-medium text-zinc-900">
              Likes *
            </Label>
            <Input
              id="likes"
              type="number"
              min="0"
              {...register('likes', { valueAsNumber: true })}
              disabled={isSubmitting || success}
              className="h-11"
            />
            {errors.likes && (
              <p className="text-sm text-red-600">{errors.likes.message}</p>
            )}
          </div>

          {/* Retweets */}
          <div className="space-y-2">
            <Label htmlFor="retweets" className="text-sm font-medium text-zinc-900">
              Retweets *
            </Label>
            <Input
              id="retweets"
              type="number"
              min="0"
              {...register('retweets', { valueAsNumber: true })}
              disabled={isSubmitting || success}
              className="h-11"
            />
            {errors.retweets && (
              <p className="text-sm text-red-600">{errors.retweets.message}</p>
            )}
          </div>

          {/* Replies */}
          <div className="space-y-2">
            <Label htmlFor="replies" className="text-sm font-medium text-zinc-900">
              Replies *
            </Label>
            <Input
              id="replies"
              type="number"
              min="0"
              {...register('replies', { valueAsNumber: true })}
              disabled={isSubmitting || success}
              className="h-11"
            />
            {errors.replies && (
              <p className="text-sm text-red-600">{errors.replies.message}</p>
            )}
          </div>

          {/* Impressions */}
          <div className="space-y-2">
            <Label htmlFor="impressions" className="text-sm font-medium text-zinc-900">
              Impressions *
            </Label>
            <Input
              id="impressions"
              type="number"
              min="0"
              {...register('impressions', { valueAsNumber: true })}
              disabled={isSubmitting || success}
              className="h-11"
            />
            {errors.impressions && (
              <p className="text-sm text-red-600">{errors.impressions.message}</p>
            )}
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
                Metrics updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Updated!
                </>
              ) : (
                'Update Metrics'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || success}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
