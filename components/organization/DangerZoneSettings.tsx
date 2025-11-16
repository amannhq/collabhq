'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DangerZoneSettingsProps {
  organizationId: string;
  organizationName: string;
}

export function DangerZoneSettings({ 
  organizationId, 
  organizationName
}: DangerZoneSettingsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteOrganization() {
    if (confirmText !== organizationName) {
      toast.error('Organization name does not match');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete organization');
      }

      toast.success('Organization deleted successfully');
      
      // Redirect to home or signup
      window.location.href = '/';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between p-4 border border-destructive/50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Delete Organization
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this organization and all associated data including projects, creators, posts, and analytics.
              </p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">This will delete:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All projects and their posts</li>
                  <li>All creator accounts and invitations</li>
                  <li>All analytics and metrics data</li>
                  <li>All settings and configurations</li>
                </ul>
              </div>
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Organization</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the{' '}
                    <strong>{organizationName}</strong> organization and all associated data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirm">
                      Type <Badge variant="outline">{organizationName}</Badge> to confirm
                    </Label>
                    <Input
                      id="confirm"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={organizationName}
                    />
                  </div>
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Warning: This action is irreversible
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All data will be permanently deleted and cannot be recovered.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setConfirmText('');
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteOrganization}
                    disabled={confirmText !== organizationName || isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Organization'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
