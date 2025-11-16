'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Upload } from 'lucide-react';

const brandingSchema = z.object({
  logo: z.string(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  notificationEmail: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  emailSignature: z.string(),
  emailFromName: z.string(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

interface BrandingSettingsProps {
  organizationId: string;
  currentSettings: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    notificationEmail?: string;
    timezone: string;
    dateFormat: string;
    emailSignature?: string;
    emailFromName?: string;
  };
}

export function BrandingSettings({ organizationId, currentSettings }: BrandingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo: currentSettings.logo || '',
      primaryColor: currentSettings.primaryColor || '#3b82f6',
      secondaryColor: currentSettings.secondaryColor || '#10b981',
      notificationEmail: currentSettings.notificationEmail || '',
      timezone: currentSettings.timezone || 'UTC',
      dateFormat: currentSettings.dateFormat || 'MM/DD/YYYY',
      emailSignature: currentSettings.emailSignature || '',
      emailFromName: currentSettings.emailFromName || '',
    },
  });

  async function onSubmit(data: BrandingFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update settings');
      }

      toast.success('Branding settings updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
          <CardDescription>
            Customize your organization&apos;s visual identity across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="https://yoursite.com/logo.png" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Direct URL to your organization logo (recommended: 200x60px)
                    </FormDescription>
                    {field.value && (
                      <div className="mt-2 p-4 border rounded-lg bg-muted">
                        <div className="relative h-16 w-full">
                          <Image 
                            src={field.value} 
                            alt="Logo preview" 
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Brand Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-20 h-10" />
                        </FormControl>
                        <FormControl>
                          <Input {...field} placeholder="#3b82f6" />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for buttons, links, and accents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Brand Color</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input type="color" {...field} className="w-20 h-10" />
                        </FormControl>
                        <FormControl>
                          <Input {...field} placeholder="#10b981" />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for secondary elements and highlights
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Email Branding</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailFromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email From Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp Team" {...field} />
                        </FormControl>
                        <FormDescription>
                          Display name shown in sent emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Signature</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Best regards,&#10;The Acme Corp Team&#10;&#10;Need help? Contact us at support@acme.com"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Default signature appended to all outgoing emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="notifications@acme.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email address for system notifications and alerts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input placeholder="UTC" {...field} />
                        </FormControl>
                        <FormDescription>
                          Default timezone for your organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Format</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/DD/YYYY" {...field} />
                        </FormControl>
                        <FormDescription>
                          Preferred date display format
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your branding appears in emails and across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="p-8 rounded-lg border-2"
            style={{
              background: `linear-gradient(135deg, ${form.watch('primaryColor')}22 0%, ${form.watch('secondaryColor')}22 100%)`
            }}
          >
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
              {form.watch('logo') && (
                <div className="relative h-12 w-48 mb-4">
                  <Image 
                    src={form.watch('logo')} 
                    alt="Logo" 
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">Welcome to Our Platform!</h2>
              <p className="text-gray-600 mb-4">
                This is how your emails will look with your custom branding.
              </p>
              <button
                type="button"
                className="px-6 py-2 rounded text-white font-medium"
                style={{ backgroundColor: form.watch('primaryColor') }}
              >
                Get Started
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
