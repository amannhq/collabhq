'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, UserPlus, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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

interface Creator {
  _id: string;
  name: string;
  email: string;
  twitterHandle: string;
  status: string;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  totalEngagement: number;
}

interface ProjectCreatorsProps {
  projectName: string;
  organizationSlug: string;
  creators: Creator[];
}

export function ProjectCreators({
  projectName,
  organizationSlug,
  creators: initialCreators,
}: ProjectCreatorsProps) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      active: 'default',
      suspended: 'destructive',
      pending: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  }

  function handleRemoveClick(creator: Creator) {
    setSelectedCreator(creator);
    setRemoveDialogOpen(true);
  }

  async function handleRemoveCreator() {
    if (!selectedCreator) return;

    setIsRemoving(true);

    try {
      toast.success(`${selectedCreator.name} removed from project`);
      setCreators(creators.filter((c) => c._id !== selectedCreator._id));
      setRemoveDialogOpen(false);
      setSelectedCreator(null);
    } catch (err) {
      console.error('Error removing creator:', err);
      toast.error('Failed to remove creator from project');
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Creators in {projectName}</CardTitle>
              <CardDescription>
                {creators.length} {creators.length === 1 ? 'creator' : 'creators'} contributing to
                this project
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Creator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Creator to Project</DialogTitle>
                  <DialogDescription>
                    Invite a creator to contribute to {projectName}. They&apos;ll receive an email invitation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search existing creators</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, email, or Twitter handle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Or invite a new creator to your organization:</p>
                  </div>
                  <Link href={`/${organizationSlug}/creators/invite`} className="block">
                    <Button variant="outline" className="w-full" onClick={() => setAddDialogOpen(false)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite New Creator
                    </Button>
                  </Link>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {creators.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No creators yet</p>
              <p className="text-sm mt-2">
                Add creators to start tracking their posts in this project
              </p>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Creator
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Creator to Project</DialogTitle>
                    <DialogDescription>
                      Invite a creator to contribute to {projectName}. They&apos;ll receive an email invitation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="search-empty">Search existing creators</Label>
                      <Input
                        id="search-empty"
                        placeholder="Search by name, email, or Twitter handle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Or invite a new creator to your organization:</p>
                    </div>
                    <Link href={`/${organizationSlug}/creators/invite`} className="block">
                      <Button variant="outline" className="w-full" onClick={() => setAddDialogOpen(false)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite New Creator
                      </Button>
                    </Link>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Posts</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Total Engagement</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators.map((creator) => (
                  <TableRow key={creator._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(creator.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          {creator.twitterHandle && (
                            <p className="text-xs text-muted-foreground">
                              {creator.twitterHandle.startsWith('@') 
                                ? creator.twitterHandle 
                                : `@${creator.twitterHandle}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(creator.status)}</TableCell>
                    <TableCell>{creator.totalPosts}</TableCell>
                    <TableCell>{creator.approvedPosts}</TableCell>
                    <TableCell>{creator.pendingPosts}</TableCell>
                    <TableCell>{creator.totalEngagement.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/${organizationSlug}/creators/${creator._id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClick(creator)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Creator from Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedCreator?.name}</strong> from this
              project? Their existing posts will remain but they won&apos;t be able to submit new
              posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false);
                setSelectedCreator(null);
              }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveCreator} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove Creator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
