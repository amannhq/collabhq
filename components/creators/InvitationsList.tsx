'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Invitation {
  _id: string;
  email: string;
  name: string;
  projectId: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    name: string;
    email: string;
  };
}

interface InvitationsListProps {
  invitations: Invitation[];
  onResend?: (invitationId: string) => Promise<void>;
  onDelete?: (invitationId: string) => Promise<void>;
}

export function InvitationsList({
  invitations,
  onResend,
  onDelete,
}: InvitationsListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleResend = async (invitationId: string, email: string) => {
    if (!onResend) return;

    setLoading(invitationId);
    try {
      await onResend(invitationId);
      toast.success(`Invitation resent to ${email}`);
    } catch {
      toast.error('Failed to resend invitation');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (invitationId: string, email: string) => {
    if (!onDelete) return;

    setLoading(invitationId);
    try {
      await onDelete(invitationId);
      toast.success(`Invitation to ${email} deleted`);
    } catch {
      toast.error('Failed to delete invitation');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === 'accepted') {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired || status === 'expired') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No invitations found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <TableRow key={invitation._id}>
              <TableCell className="font-medium">{invitation.name}</TableCell>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>{invitation.projectId.name}</TableCell>
              <TableCell>
                {getStatusBadge(invitation.status, invitation.expiresAt)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {invitation.invitedBy.name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(invitation.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(invitation.expiresAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === invitation._id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {invitation.status === 'pending' && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleResend(invitation._id, invitation.email)
                        }
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Resend
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        handleDelete(invitation._id, invitation.email)
                      }
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
