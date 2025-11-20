'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Eye, ThumbsUp, Repeat2, MessageCircle, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Post {
  _id: string;
  postUrl: string;
  caption?: string;
  status: 'pending' | 'approved' | 'rejected';
  creatorId: {
    _id: string;
    name: string;
    email: string;
    twitterHandle?: string;
  };
  projectId: {
    _id: string;
    name: string;
  };
  latestMetrics?: {
    likes: number;
    retweets: number;
    replies: number;
    impressions: number;
  };
  createdAt: string | Date;
}

interface PostsTableProps {
  posts: Post[];
  orgSlug: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
  },
};
