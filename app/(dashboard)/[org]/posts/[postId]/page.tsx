import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImprovedPostAnalytics } from '@/components/posts/ImprovedPostAnalytics';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { Post, Organization } from '@/lib/db/models';
import type { IOrganization } from '@/lib/db/models/Organization';

interface PostDetailPageProps {
  params: {
    org: string;
    postId: string;
  };
}

async function verifyPostAccess(postId: string, organizationId: string) {
  await connectDB();

  const post = await Post.findById(postId)
    .populate('projectId', 'organizationId')
    .lean() as { projectId?: { organizationId?: { toString(): string } } } | null;

  if (!post) {
    return false;
  }

  // Verify post belongs to this organization
  return post.projectId?.organizationId?.toString() === organizationId;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  await connectDB();
  const organization = await Organization.findOne({
    slug: resolvedParams.org,
  }).lean<IOrganization>();

  if (!organization) {
    redirect('/');
  }

  const hasAccess = await verifyPostAccess(resolvedParams.postId, organization._id.toString());

  if (!hasAccess) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${resolvedParams.org}/posts`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Post Details</h1>
          <p className="text-muted-foreground">View performance and metrics</p>
        </div>
      </div>

      {/* Post Analytics Component with Suspense */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <ImprovedPostAnalytics
          postId={resolvedParams.postId}
          organizationId={organization._id.toString()}
          orgSlug={resolvedParams.org}
        />
      </Suspense>
    </div>
  );
}
