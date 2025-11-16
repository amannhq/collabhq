'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Mail, Twitter, Building2, FolderKanban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface AcceptInvitationProps {
  invitation: {
    token: string;
    organizationName: string;
    projectName: string;
    inviterName: string;
    inviterEmail: string;
    creatorName: string;
    email: string;
    twitterHandle: string;
    customMessage?: string;
    expiresAt: Date;
  };
}

export function AcceptInvitation({ invitation }: AcceptInvitationProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const response = await fetch('/api/creators/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitation.token }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      toast.success('Invitation accepted!', {
        description: 'Your account has been created. Redirecting to login...',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.token}/decline`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to decline invitation');
      }

      toast.success('Invitation declined');
      
      // Redirect to homepage
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setDeclining(false);
    }
  };

  const expiresIn = formatDistanceToNow(new Date(invitation.expiresAt), {
    addSuffix: true,
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
        <CardDescription>
          Join <span className="font-medium">{invitation.organizationName}</span> as a creator
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Invitation Details */}
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-muted-foreground">{invitation.organizationName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FolderKanban className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Project</p>
                <p className="text-sm text-muted-foreground">{invitation.projectName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Your Email</p>
                <p className="text-sm text-muted-foreground">{invitation.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Twitter className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Twitter Handle</p>
                <p className="text-sm text-muted-foreground">{invitation.twitterHandle}</p>
              </div>
            </div>
          </div>

          {invitation.customMessage && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Message from {invitation.inviterName}</p>
                <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                  <p className="text-sm text-muted-foreground italic">
                    "{invitation.customMessage}"
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* What Happens Next */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">What happens when you accept?</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>A creator account will be created with your email</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>You'll be added to the {invitation.projectName} project</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>You can start submitting posts for review</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>You'll receive login credentials via email</span>
            </li>
          </ul>
        </div>

        {/* Expiration Warning */}
        <Alert>
          <AlertDescription className="text-sm">
            This invitation expires <span className="font-medium">{expiresIn}</span>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={accepting || declining}
            variant="outline"
            size="lg"
          >
            {declining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Declining...
              </>
            ) : (
              'Decline'
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Invited by {invitation.inviterName} ({invitation.inviterEmail})
        </p>
      </CardContent>
    </Card>
  );
}
