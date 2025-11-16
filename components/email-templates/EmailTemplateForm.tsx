'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Save } from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  category: z.enum(['transactional', 'marketing', 'notification']),
  subject: z.string().min(1, 'Subject is required'),
  previewText: z.string(),
  primaryColor: z.string().min(1, 'Primary color is required'),
  secondaryColor: z.string().min(1, 'Secondary color is required'),
  logoUrl: z.string(),
  fontFamily: z.string(),
  heading: z.string(),
  body: z.string().min(1, 'Body content is required'),
  ctaText: z.string(),
  ctaUrl: z.string(),
  footerText: z.string(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface Template {
  _id?: string;
  name?: string;
  slug?: string;
  category?: 'transactional' | 'marketing' | 'notification';
  subject?: string;
  previewText?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
  content?: {
    heading?: string;
    body?: string;
    ctaText?: string;
    ctaUrl?: string;
    footerText?: string;
  };
  isActive?: boolean;
  isDefault?: boolean;
}

interface EmailTemplateFormProps {
  organizationId: string;
  orgSlug: string;
  template?: Template;
  mode: 'create' | 'edit';
}

export function EmailTemplateForm({
  organizationId,
  orgSlug,
  template,
  mode,
}: EmailTemplateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          name: template.name || '',
          slug: template.slug || '',
          category: (template.category || 'transactional') as 'transactional' | 'marketing' | 'notification',
          subject: template.subject || '',
          previewText: template.previewText || '',
          primaryColor: template.branding?.primaryColor || '#667eea',
          secondaryColor: template.branding?.secondaryColor || '#764ba2',
          logoUrl: template.branding?.logoUrl || '',
          fontFamily: template.branding?.fontFamily || '',
          heading: template.content?.heading || '',
          body: template.content?.body || '',
          ctaText: template.content?.ctaText || '',
          ctaUrl: template.content?.ctaUrl || '',
          footerText: template.content?.footerText || '',
          isActive: template.isActive ?? true,
          isDefault: template.isDefault ?? false,
        }
      : {
          name: '',
          slug: '',
          category: 'transactional' as const,
          subject: '',
          previewText: '',
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          logoUrl: '',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          heading: '',
          body: '',
          ctaText: '',
          ctaUrl: '',
          footerText: '',
          isActive: true,
          isDefault: false,
        },
  });

  async function onSubmit(data: TemplateFormValues) {
    setIsLoading(true);

    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        category: data.category,
        subject: data.subject,
        previewText: data.previewText,
        branding: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          logoUrl: data.logoUrl || undefined,
          fontFamily: data.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        },
        content: {
          heading: data.heading,
          body: data.body,
          ctaText: data.ctaText,
          ctaUrl: data.ctaUrl,
          footerText: data.footerText,
        },
        isActive: data.isActive,
        isDefault: data.isDefault,
        ...(mode === 'create' && { organizationId }),
      };

      const url =
        mode === 'create'
          ? '/api/email-templates'
          : `/api/email-templates/${template?._id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save template');
      }

      toast.success(mode === 'create' ? 'Template created successfully!' : 'Template updated successfully!');
      router.push(`/${orgSlug}/settings/email-templates`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePreview() {
    if (!template?._id) {
      toast.error('Please save the template first to preview');
      return;
    }

    try {
      const sampleData = {
        name: 'John Doe',
        email: 'john@example.com',
        organizationName: 'Your Organization',
        projectName: 'Sample Project',
        inviteUrl: 'https://example.com/invite/sample',
        dashboardUrl: 'https://example.com/dashboard',
      };

      const response = await fetch(`/api/email-templates/${template._id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate preview');
      }

      setPreviewHtml(result.data.html);
      setShowPreview(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview');
    }
  }

  const insertVariable = (variable: string) => {
    const currentBody = form.getValues('body');
    form.setValue('body', currentBody + ` {{${variable}}}`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                  <CardDescription>
                    Customize the content of your email template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Welcome Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="welcome"
                            {...field}
                            disabled={mode === 'edit'}
                          />
                        </FormControl>
                        <FormDescription>
                          Unique identifier for this template (lowercase, hyphens only)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Welcome to {'{{organizationName}}'}!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previewText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preview Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Get started with your account..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Text shown in email client preview
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heading</FormLabel>
                        <FormControl>
                          <Input placeholder="Welcome Aboard! 🚀" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Content (HTML)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="<p>Hi {{name}},</p><p>Welcome to our platform!</p>"
                            rows={10}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Use HTML formatting. Variables: {' '}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => insertVariable('name')}
                          >
                            {'{{name}}'}
                          </Button>
                          {', '}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => insertVariable('organizationName')}
                          >
                            {'{{organizationName}}'}
                          </Button>
                          {', '}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => insertVariable('projectName')}
                          >
                            {'{{projectName}}'}
                          </Button>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="ctaText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Get Started" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ctaUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button URL</FormLabel>
                          <FormControl>
                            <Input placeholder="{'{{dashboardUrl}}'}" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="footerText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Input placeholder="If you didn't expect this email..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Customization</CardTitle>
                  <CardDescription>
                    Customize colors, logo, and fonts for your emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#667eea" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20 h-10" />
                            </FormControl>
                            <FormControl>
                              <Input {...field} placeholder="#764ba2" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yoursite.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          Direct URL to your logo image (recommended size: 150x50px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Settings</CardTitle>
                  <CardDescription>
                    Configure template behavior and category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription>
                            Enable this template for use in emails
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Set as Default</FormLabel>
                          <FormDescription>
                            Use this template as the default for this type
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Update Template'}
              </Button>
              {mode === 'edit' && (
                <Button type="button" variant="outline" onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${orgSlug}/settings/email-templates`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>

      {/* Preview Dialog */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border rounded"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
