'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import Link from 'next/link';

const previewFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  projectName: z.string().optional(),
  inviteUrl: z.string().url().optional(),
  dashboardUrl: z.string().url().optional(),
});

type PreviewFormValues = z.infer<typeof previewFormSchema>;

interface Template {
  _id: string;
  name?: string;
  subject?: string;
  slug?: string;
  category?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

interface EmailTemplatePreviewProps {
  template: Template;
  orgSlug: string;
}

export function EmailTemplatePreview({ template, orgSlug }: EmailTemplatePreviewProps) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const form = useForm<PreviewFormValues>({
    resolver: zodResolver(previewFormSchema),
    defaultValues: {
      name: 'John Doe',
      email: 'john@example.com',
      organizationName: 'Acme Corp',
      projectName: 'Project Alpha',
      inviteUrl: 'https://example.com/invite/sample-token',
      dashboardUrl: 'https://example.com/dashboard',
    },
  });

  async function onGeneratePreview(data: PreviewFormValues) {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/email-templates/${template._id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData: data }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate preview');
      }

      setPreviewHtml(result.data.html);
      toast.success('Preview generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSendTest() {
    setIsSending(true);

    try {
      // TODO: Implement send test email endpoint
      toast.info('Send test email feature coming soon!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Sample Data Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>
              Enter sample data to preview how variables will be replaced
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onGeneratePreview)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Project Alpha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inviteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invite URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/invite/token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dashboardUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dashboard URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/dashboard" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isGenerating}>
                    <Mail className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Preview'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={form.handleSubmit(onSendTest)}
                    disabled={isSending || !previewHtml}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{template.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug:</span>
              <span className="font-mono text-xs">{template.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium capitalize">{template.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subject:</span>
              <span className="font-medium">{template.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{template.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            {template.isDefault && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default:</span>
                <span className="font-medium">Yes</span>
              </div>
            )}
            <div className="pt-4 mt-4 border-t">
              <Link href={`/${orgSlug}/settings/email-templates/${template._id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Template
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Email Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              {previewHtml
                ? 'Live preview of how the email will look'
                : 'Generate a preview with sample data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[700px]"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[700px] border border-dashed rounded-lg">
                <div className="text-center">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Preview Yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fill in the sample data and click &quot;Generate Preview&quot; to see how your
                    email will look
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
