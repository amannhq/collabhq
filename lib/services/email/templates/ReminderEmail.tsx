import { BaseEmailTemplate } from './BaseEmailTemplate';

interface ReminderEmailProps {
  name: string;
  organizationName: string;
  dashboardUrl: string;
  posts: Array<{
    projectName?: string;
    postUrl: string;
    lastMetricsUpdate?: Date | string;
  }>;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
}

const formatDate = (value?: Date | string) => {
  if (!value) {
    return 'recently';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const ReminderEmail = ({
  name,
  organizationName,
  dashboardUrl,
  posts,
  branding,
}: ReminderEmailProps) => {
  const pendingCount = posts.length;
  const postsListMarkup = pendingCount
    ? `<ul style="list-style: none; padding: 0; margin: 24px 0;">
        ${posts
          .map(
            (post) => `
          <li style="
            margin-bottom: 16px;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #f9fafb;
          ">
            <p style="margin: 0; font-weight: 600; color: #111827;">
              ${post.projectName || 'Project update'}
            </p>
            <p style="margin: 4px 0 8px 0; color: #6b7280; font-size: 14px;">
              Last metrics update ${formatDate(post.lastMetricsUpdate)}
            </p>
            <a 
              href="${post.postUrl}" 
              style="color: #111827; text-decoration: underline; font-size: 14px; word-break: break-all;"
            >
              View post
            </a>
          </li>`
          )
          .join('')}
      </ul>`
    : `<p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #374151;">
        You have recent activity that needs updated metrics.
      </p>`;

  const bodyContent = `
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #374151;">
      Hi ${name},
    </p>
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #374151;">
      This is a friendly reminder from <strong>${organizationName}</strong> to refresh your post metrics.
      Keeping things up-to-date helps the team stay on top of performance.
    </p>
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #374151;">
      ${
        pendingCount > 1
          ? `You currently have <strong>${pendingCount}</strong> posts waiting for an update:`
          : 'Here is the post that needs the latest metrics:'
      }
    </p>
    ${postsListMarkup}
    <p style="font-size: 16px; line-height: 26px; margin: 16px 0; color: #374151;">
      Click the button below to jump back into your dashboard and submit the latest numbers.
    </p>
  `;

  return (
    <BaseEmailTemplate
      branding={branding}
      content={{
        heading: 'Time to refresh your metrics ⏱️',
        body: bodyContent,
        ctaText: 'Update Metrics',
        ctaUrl: dashboardUrl,
        footerText:
          'You are receiving this reminder because metrics notifications are enabled for your account.',
      }}
      previewText="Quick reminder to update your metrics"
    />
  );
};

export default ReminderEmail;

