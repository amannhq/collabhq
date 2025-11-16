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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const notificationSchema = z.object({
  emailOnNewPost: z.boolean(),
  emailOnPostApproved: z.boolean(),
  emailOnPostRejected: z.boolean(),
  emailOnCreatorJoined: z.boolean(),
  emailOnWeeklyReport: z.boolean(),
  emailOnMonthlyReport: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface NotificationSettingsProps {
  organizationId: string;
  currentSettings: {
    emailOnNewPost?: boolean;
    emailOnPostApproved?: boolean;
    emailOnPostRejected?: boolean;
    emailOnCreatorJoined?: boolean;
    emailOnWeeklyReport?: boolean;
    emailOnMonthlyReport?: boolean;
  };
}

export function NotificationSettings({ organizationId, currentSettings }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailOnNewPost: currentSettings.emailOnNewPost ?? true,
      emailOnPostApproved: currentSettings.emailOnPostApproved ?? true,
      emailOnPostRejected: currentSettings.emailOnPostRejected ?? true,
      emailOnCreatorJoined: currentSettings.emailOnCreatorJoined ?? true,
      emailOnWeeklyReport: currentSettings.emailOnWeeklyReport ?? true,
      emailOnMonthlyReport: currentSettings.emailOnMonthlyReport ?? false,
    },
  });

  async function onSubmit(data: NotificationFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: data }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update notification settings');
      }

      toast.success('Notification preferences updated!');
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
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Post Activity</h3>
                
                <FormField
                  control={form.control}
                  name="emailOnNewPost"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">New Post Submitted</FormLabel>
                        <FormDescription>
                          Get notified when a creator submits a new post
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
                  name="emailOnPostApproved"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Post Approved</FormLabel>
                        <FormDescription>
                          Get notified when you approve a post
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
                  name="emailOnPostRejected"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Post Rejected</FormLabel>
                        <FormDescription>
                          Get notified when you reject a post
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
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">Team Activity</h3>
                
                <FormField
                  control={form.control}
                  name="emailOnCreatorJoined"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">New Creator Joined</FormLabel>
                        <FormDescription>
                          Get notified when a creator accepts an invitation
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
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">Reports</h3>
                
                <FormField
                  control={form.control}
                  name="emailOnWeeklyReport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Weekly Performance Report</FormLabel>
                                      <FormDescription>
                Receive weekly summary of your organization&apos;s performance
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
                  name="emailOnMonthlyReport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Monthly Performance Report</FormLabel>
                        <FormDescription>
                          Receive a detailed monthly report with insights and trends
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
              </div>

              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
