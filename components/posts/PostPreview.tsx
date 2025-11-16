'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PostPreviewProps {
  postUrl: string;
  caption?: string;
}

export function PostPreview({ postUrl, caption }: PostPreviewProps) {
  // Extract tweet ID from URL for embedding
  const getTweetId = (url: string) => {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  const tweetId = getTweetId(postUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {caption && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm whitespace-pre-wrap">{caption}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Post URL</p>
          <div className="flex items-center gap-2">
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate text-sm text-blue-600 hover:underline"
            >
              {postUrl}
            </a>
            <Button variant="outline" size="sm" asChild>
              <a href={postUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {tweetId && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Twitter Embed</p>
            <div className="rounded-lg border bg-background p-4">
              <blockquote className="twitter-tweet">
                <a href={postUrl}>View Tweet</a>
              </blockquote>
              <script
                async
                src="https://platform.twitter.com/widgets.js"
                charSet="utf-8"
              ></script>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
