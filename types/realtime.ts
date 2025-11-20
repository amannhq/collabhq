export type RealtimeResource = 'posts' | 'metrics' | 'notifications';

export type RealtimeAction = 'created' | 'updated' | 'deleted';

export interface RealtimeMessage<
  TPayload extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  resource: RealtimeResource;
  action: RealtimeAction;
  documentId: string;
  organizationId: string;
  timestamp: string;
  payload?: TPayload;
  context?: {
    projectId?: string;
    creatorId?: string;
    postId?: string;
    recipientId?: string;
  };
}

