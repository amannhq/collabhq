'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Post {
  _id: string;
  postUrl: string;
  caption?: string;
  creatorId: {
    _id: string;
    name: string;
    email: string;
    twitterHandle?: string;
  };
  projectId: {
    _id: string;
    name: string;
    settings?: {
      requirePostApproval?: boolean;
    };
  };
  createdAt: string;
}

interface PendingPostsListProps {
  posts: Post[];
  orgSlug: string;
}

export function PendingPostsList({ posts }: PendingPostsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async (postId: string) => {
    setLoadingId(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve post');
      }

      toast.success('Post approved successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve post');
    } finally {
      setLoadingId(null);
    }
  };

  const openRejectDialog = (post: Post) => {
    setSelectedPost(post);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedPost) return;

    setLoadingId(selectedPost._id);
    try {
      const response = await fetch(`/api/posts/${selectedPost._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject post');
      }

      toast.success('Post rejected');
      setRejectDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject post');
    } finally {
      setLoadingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No posts pending approval at the moment
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post._id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(post.creatorId.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {post.creatorId.name}
                    </p>
                    {post.creatorId.twitterHandle && (
                      <p className="text-xs text-muted-foreground">
                        @{post.creatorId.twitterHandle}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{post.projectId.name}</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {post.caption ? (
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {post.caption}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No caption provided
                </p>
              )}

              <div className="mt-4">
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  View original post <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleApprove(post._id)}
                disabled={loadingId === post._id}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openRejectDialog(post)}
                disabled={loadingId === post._id}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this post. The creator will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason (optional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loadingId === selectedPost?._id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loadingId === selectedPost?._id}
            >
              Reject Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
