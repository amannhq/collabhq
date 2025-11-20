'use client';

import { ReactNode } from 'react';
import { SubmitPostProvider, useSubmitPost } from '@/contexts/SubmitPostContext';
import { SubmitPostModal } from './SubmitPostModal';

interface CreatorLayoutClientProps {
  children: ReactNode;
  creatorId: string;
  projectId?: string;
}

function CreatorLayoutContent({ children, creatorId, projectId }: CreatorLayoutClientProps) {
  const { isModalOpen, closeModal } = useSubmitPost();

  return (
    <>
      {children}
      <SubmitPostModal
        open={isModalOpen}
        onOpenChange={closeModal}
        creatorId={creatorId}
        projectId={projectId}
      />
    </>
  );
}

export function CreatorLayoutClient({ children, creatorId, projectId }: CreatorLayoutClientProps) {
  return (
    <SubmitPostProvider>
      <CreatorLayoutContent creatorId={creatorId} projectId={projectId}>
        {children}
      </CreatorLayoutContent>
    </SubmitPostProvider>
  );
}
