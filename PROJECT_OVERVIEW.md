// ═══════════════════════════════════════════════════════════
// 1. ORGANIZATIONS COLLECTION
// ═══════════════════════════════════════════════════════════

organizations: {
  _id: ObjectId,
  name: String,              // "Veritus"
  slug: String,              // "veritus" (unique, for URLs)
  ownerId: ObjectId,         // Reference to users collection
  subscription: {
    plan: String,            // "free", "pro", "enterprise"
    status: String,          // "active", "cancelled", "expired"
    createdAt: Date,
    expiresAt: Date
  },
  settings: {
    logo: String,
    primaryColor: String,
    notificationEmail: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { slug: 1 } - unique
// - { ownerId: 1 }


// ═══════════════════════════════════════════════════════════
// 2. USERS COLLECTION (Both Admins & Creators)
// ═══════════════════════════════════════════════════════════

users: {
  _id: ObjectId,
  email: String,             // Unique
  name: String,
  role: String,              // "admin" or "creator"
  
  // For Admins
  organizationId: ObjectId,  // Their organization (if admin)
  
  // For Creators
  creatorProfile: {
    twitterHandle: String,   // "@username"
    twitterUserId: String,
    projectId: ObjectId,     // Which project they belong to
    status: String,          // "invited", "active", "suspended"
    invitedBy: ObjectId,     // Admin who invited them
    invitedAt: Date,
    activatedAt: Date
  },
  
  // Auth (Better Auth handles this, but stored here)
  emailVerified: Boolean,
  lastLoginAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { email: 1 } - unique
// - { organizationId: 1, role: 1 }
// - { "creatorProfile.projectId": 1 }


// ═══════════════════════════════════════════════════════════
// 3. PROJECTS COLLECTION
// ═══════════════════════════════════════════════════════════

projects: {
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,              // "Q1 Campaign"
  description: String,
  status: String,            // "active", "completed", "archived"
  
  settings: {
    requirePostApproval: Boolean,  // Default: true for first post
    metricUpdateFrequency: Number, // Hours (default: 24)
    autoReminders: Boolean         // Send 24hr reminder emails
  },
  
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { organizationId: 1, status: 1 }


// ═══════════════════════════════════════════════════════════
// 4. POSTS COLLECTION
// ═══════════════════════════════════════════════════════════

posts: {
  _id: ObjectId,
  projectId: ObjectId,
  creatorId: ObjectId,       // User who created the post
  
  postUrl: String,           // Full X/Twitter URL
  tweetId: String,           // Extracted ID
  
  content: String,           // Optional: Tweet text
  
  status: String,            // "pending", "approved", "rejected"
  isFirstPost: Boolean,      // True if creator's first post
  
  // Admin verification
  verifiedBy: ObjectId,
  verifiedAt: Date,
  adminNotes: String,
  
  // Initial metrics (when submitted)
  initialMetrics: {
    likes: Number,
    retweets: Number,
    replies: Number,
    impressions: Number,
    recordedAt: Date
  },
  
  // Latest metrics (updated from metrics collection)
  latestMetrics: {
    likes: Number,
    retweets: Number,
    replies: Number,
    impressions: Number,
    lastUpdatedAt: Date
  },
  
  // Reminder tracking
  lastReminderSent: Date,
  nextReminderDue: Date,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { projectId: 1, status: 1 }
// - { creatorId: 1, createdAt: -1 }
// - { tweetId: 1 } - unique
// - { nextReminderDue: 1 } - for cron jobs


// ═══════════════════════════════════════════════════════════
// 5. METRICS COLLECTION (Time-Series Data)
// ═══════════════════════════════════════════════════════════

metrics: {
  _id: ObjectId,
  postId: ObjectId,
  creatorId: ObjectId,       // Denormalized for faster queries
  projectId: ObjectId,       // Denormalized for aggregations
  
  // Metrics snapshot
  likes: Number,
  retweets: Number,
  replies: Number,
  quotes: Number,
  impressions: Number,
  
  // Growth calculations
  growth: {
    likesDelta: Number,      // Change since last record
    retweetsDelta: Number,
    impressionsDelta: Number
  },
  
  // Metadata
  source: String,            // "manual", "reminder", "admin"
  notes: String,             // Optional creator notes
  
  recordedAt: Date,          // When metrics were recorded
  createdAt: Date            // When this record was created
}

// Indexes:
// - { postId: 1, recordedAt: -1 } - for time-series queries
// - { creatorId: 1, recordedAt: -1 }
// - { projectId: 1, recordedAt: -1 }
// - { recordedAt: 1 } - for cleanup/archival


// ═══════════════════════════════════════════════════════════
// 6. INVITATIONS COLLECTION (Magic Links)
// ═══════════════════════════════════════════════════════════

invitations: {
  _id: ObjectId,
  email: String,
  token: String,             // Unique token for magic link
  
  organizationId: ObjectId,
  projectId: ObjectId,
  invitedBy: ObjectId,       // Admin who sent invite
  
  creatorData: {
    name: String,
    twitterHandle: String
  },
  
  status: String,            // "pending", "accepted", "expired"
  
  expiresAt: Date,           // Magic link expiration (7 days)
  acceptedAt: Date,
  
  createdAt: Date
}

// Indexes:
// - { token: 1 } - unique
// - { email: 1, status: 1 }
// - { expiresAt: 1 } - for cleanup


// ═══════════════════════════════════════════════════════════
// 7. NOTIFICATIONS COLLECTION
// ═══════════════════════════════════════════════════════════

notifications: {
  _id: ObjectId,
  
  recipientId: ObjectId,     // User who receives notification
  senderId: ObjectId,        // User who triggered it (optional)
  
  type: String,              // "post_approved", "reminder", 
                            // "admin_message", "metric_milestone"
  
  title: String,
  message: String,
  
  metadata: Object,          // Related data (postId, etc.)
  
  status: String,            // "unread", "read"
  
  // Email delivery
  emailSent: Boolean,
  emailSentAt: Date,
  
  createdAt: Date,
  readAt: Date
}

// Indexes:
// - { recipientId: 1, status: 1, createdAt: -1 }


// ═══════════════════════════════════════════════════════════
// 8. ACTIVITY LOG COLLECTION (Audit Trail)
// ═══════════════════════════════════════════════════════════

activityLog: {
  _id: ObjectId,
  
  userId: ObjectId,
  organizationId: ObjectId,
  
  action: String,            // "post_created", "post_approved", 
                            // "metrics_updated", "creator_invited"
  
  entityType: String,        // "post", "project", "user"
  entityId: ObjectId,
  
  metadata: Object,          // Action-specific data
  
  ipAddress: String,
  userAgent: String,
  
  createdAt: Date
}

// Indexes:
// - { organizationId: 1, createdAt: -1 }
// - { userId: 1, createdAt: -1 }
```

---

## **📁 Complete Folder Structure**
```
saas-creator-tracker/
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── logo.svg
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── [org]/                        # Organization dashboard
│   │   │   │   ├── page.tsx                  # Admin overview
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx              # Projects list
│   │   │   │   │   ├── [projectId]/
│   │   │   │   │   │   ├── page.tsx          # Project details
│   │   │   │   │   │   ├── creators/
│   │   │   │   │   │   │   └── page.tsx     # Creators in project
│   │   │   │   │   │   └── analytics/
│   │   │   │   │   │       └── page.tsx     # Project analytics
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx          # Create project
│   │   │   │   ├── creators/
│   │   │   │   │   ├── page.tsx              # All creators
│   │   │   │   │   ├── invite/
│   │   │   │   │   │   └── page.tsx          # Invite creator
│   │   │   │   │   └── [creatorId]/
│   │   │   │   │       └── page.tsx          # Creator profile
│   │   │   │   ├── posts/
│   │   │   │   │   ├── page.tsx              # All posts
│   │   │   │   │   ├── pending/
│   │   │   │   │   │   └── page.tsx          # Pending approval
│   │   │   │   │   └── [postId]/
│   │   │   │   │       └── page.tsx          # Post details
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx              # Organization analytics
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx              # Org settings
│   │   │   │   └── layout.tsx                # Admin layout with sidebar
│   │   │   │
│   │   │   └── creator/
│   │   │       └── [creatorId]/              # Creator dashboard
│   │   │           ├── page.tsx              # Creator overview
│   │   │           ├── posts/
│   │   │           │   ├── page.tsx          # My posts
│   │   │           │   ├── new/
│   │   │           │   │   └── page.tsx      # Submit new post
│   │   │           │   └── [postId]/
│   │   │           │       ├── page.tsx      # Post details
│   │   │           │       └── update/
│   │   │           │           └── page.tsx  # Update metrics
│   │   │           ├── analytics/
│   │   │           │   └── page.tsx          # Creator analytics
│   │   │           └── layout.tsx            # Creator layout
│   │   │
│   │   ├── invite/
│   │   │   └── [token]/
│   │   │       └── page.tsx                  # Accept invitation
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts              # Better Auth routes
│   │   │   │
│   │   │   ├── organizations/
│   │   │   │   ├── route.ts                  # Create organization
│   │   │   │   └── [orgId]/
│   │   │   │       ├── route.ts              # Get/Update org
│   │   │   │       └── projects/
│   │   │   │           └── route.ts          # List projects
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── route.ts                  # Create project
│   │   │   │   └── [projectId]/
│   │   │   │       ├── route.ts              # Get/Update project
│   │   │   │       ├── creators/
│   │   │   │       │   └── route.ts          # Add/list creators
│   │   │   │       └── analytics/
│   │   │   │           └── route.ts          # Project analytics
│   │   │   │
│   │   │   ├── creators/
│   │   │   │   ├── invite/
│   │   │   │   │   └── route.ts              # Send invitation
│   │   │   │   ├── accept/
│   │   │   │   │   └── route.ts              # Accept invitation
│   │   │   │   └── [creatorId]/
│   │   │   │       ├── route.ts              # Get creator
│   │   │   │       └── posts/
│   │   │   │           └── route.ts          # Creator's posts
│   │   │   │
│   │   │   ├── posts/
│   │   │   │   ├── route.ts                  # Create post
│   │   │   │   └── [postId]/
│   │   │   │       ├── route.ts              # Get/Update post
│   │   │   │       ├── approve/
│   │   │   │       │   └── route.ts          # Approve post
│   │   │   │       ├── metrics/
│   │   │   │       │   ├── route.ts          # Submit metrics
│   │   │   │       │   └── history/
│   │   │   │       │       └── route.ts      # Get metrics history
│   │   │   │       └── remind/
│   │   │   │           └── route.ts          # Send reminder
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts                  # List notifications
│   │   │   │   └── [notificationId]/
│   │   │   │       └── read/
│   │   │   │           └── route.ts          # Mark as read
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── organization/
│   │   │   │   │   └── route.ts              # Org-level analytics
│   │   │   │   ├── project/
│   │   │   │   │   └── route.ts              # Project-level analytics
│   │   │   │   └── creator/
│   │   │   │       └── route.ts              # Creator-level analytics
│   │   │   │
│   │   │   ├── realtime/
│   │   │   │   └── sse/
│   │   │   │       └── route.ts              # Server-Sent Events
│   │   │   │
│   │   │   └── cron/
│   │   │       ├── send-reminders/
│   │   │       │   └── route.ts              # Daily reminder job
│   │   │       └── cleanup-expired/
│   │   │           └── route.ts              # Cleanup job
│   │   │
│   │   ├── layout.tsx                        # Root layout
│   │   ├── page.tsx                          # Landing page
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                                # Shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── chart.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── CreatorSidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── MagicLinkButton.tsx
│   │   │
│   │   ├── organization/
│   │   │   ├── CreateOrgForm.tsx
│   │   │   ├── OrgSettings.tsx
│   │   │   └── OrgStats.tsx
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── CreateProjectForm.tsx
│   │   │   └── ProjectStats.tsx
│   │   │
│   │   ├── creators/
│   │   │   ├── CreatorCard.tsx
│   │   │   ├── CreatorList.tsx
│   │   │   ├── InviteCreatorForm.tsx
│   │   │   └── CreatorMetrics.tsx
│   │   │
│   │   ├── posts/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostList.tsx
│   │   │   ├── SubmitPostForm.tsx
│   │   │   ├── UpdateMetricsForm.tsx
│   │   │   ├── ApprovalActions.tsx
│   │   │   └── MetricsHistory.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── MetricsChart.tsx
│   │   │   ├── GrowthChart.tsx
│   │   │   ├── EngagementChart.tsx
│   │   │   ├── ComparisonChart.tsx
│   │   │   └── StatsCard.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── RealtimeIndicator.tsx
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── better-auth.ts               # Better Auth config
│   │   │   └── auth-utils.ts
│   │   │
│   │   ├── db/
│   │   │   ├── mongodb.ts                   # MongoDB connection
│   │   │   └── models/
│   │   │       ├── Organization.ts
│   │   │       ├── User.ts
│   │   │       ├── Project.ts
│   │   │       ├── Post.ts
│   │   │       ├── Metrics.ts
│   │   │       ├── Invitation.ts
│   │   │       ├── Notification.ts
│   │   │       └── ActivityLog.ts
│   │   │
│   │   ├── services/
│   │   │   ├── email/
│   │   │   │   ├── emailService.ts
│   │   │   │   ├── templates/
│   │   │   │   │   ├── invitation.tsx
│   │   │   │   │   ├── postApproved.tsx
│   │   │   │   │   ├── metricsReminder.tsx
│   │   │   │   │   └── adminNotification.tsx
│   │   │   │   └── resend.ts               # Resend config
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notificationService.ts
│   │   │   │   └── pushNotification.ts
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── metricsService.ts
│   │   │   │   ├── aggregations.ts
│   │   │   │   └── calculations.ts
│   │   │   │
│   │   │   └── invitations/
│   │   │       ├── invitationService.ts
│   │   │       └── tokenGenerator.ts
│   │   │
│   │   ├── realtime/
│   │   │   ├── changeStreams.ts
│   │   │   └── sse.ts
│   │   │
│   │   ├── validations/
│   │   │   ├── organization.ts
│   │   │   ├── project.ts
│   │   │   ├── post.ts
│   │   │   ├── metrics.ts
│   │   │   └── user.ts
│   │   │
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── format.ts
│   │       ├── calculations.ts
│   │       ├── slugify.ts
│   │       └── extractTweetId.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts
│   │   ├── useProject.ts
│   │   ├── useRealtime.ts
│   │   ├── useNotifications.ts
│   │   └── useAnalytics.ts
│   │
│   ├── store/
│   │   ├── authStore.ts                    # Zustand - Auth state
│   │   ├── organizationStore.ts            # Zustand - Org state
│   │   ├── projectStore.ts                 # Zustand - Project state
│   │   ├── notificationStore.ts            # Zustand - Notifications
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── organization.ts
│   │   ├── project.ts
│   │   ├── user.ts
│   │   ├── post.ts
│   │   ├── metrics.ts
│   │   └── api.ts
│   │
│   └── middleware.ts                       # Next.js middleware
│
└── jobs/                                    # Background jobs
    ├── sendReminders.ts
    └── cleanupExpired.ts
```

---

## **🎯 Complete User Flow Diagram**
```
═══════════════════════════════════════════════════════════════════════
ADMIN FLOW (Organization Owner)
═══════════════════════════════════════════════════════════════════════

Step 1: SIGNUP
┌─────────────────────────────────────────────────────────────────┐
│ Visit: app.saas.com/signup                                      │
│                                                                  │
│ Form Fields:                                                    │
│ ├── Admin Name:  "John Doe"                                    │
│ ├── Email:       "john@veritus.com"                            │
│ ├── Password:    "********"                                    │
│ └── Org Name:    "Veritus"  → Auto-generates slug: "veritus"  │
│                                                                  │
│ Submit → Creates:                                               │
│ ├── Organization document                                       │
│ └── User document (role: "admin")                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 2: REDIRECT TO DASHBOARD
┌─────────────────────────────────────────────────────────────────┐
│ Redirects to: app.saas.com/veritus                             │
│                                                                  │
│ Admin Dashboard:                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  Sidebar:                                                │   │
│ │  ├── 📊 Overview                                         │   │
│ │  ├── 📁 Projects                                         │   │
│ │  ├── 👥 Creators                                         │   │
│ │  ├── 📝 Posts                                            │   │
│ │  ├── 📈 Analytics                                        │   │
│ │  └── ⚙️  Settings                                        │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 3: CREATE PROJECT
┌─────────────────────────────────────────────────────────────────┐
│ Click: "Create Project" → app.saas.com/veritus/projects/new    │
│                                                                  │
│ Form:                                                           │
│ ├── Project Name:        "Q1 2025 Campaign"                    │
│ ├── Description:         "Winter product launch"               │
│ ├── Auto Reminders:      ✅ Enabled (24hr)                     │
│ └── Require Approval:    ✅ First post only                    │
│                                                                  │
│ Submit → Creates project document                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 4: INVITE CREATORS
┌─────────────────────────────────────────────────────────────────┐
│ Navigate to: app.saas.com/veritus/projects/[id]/creators       │
│                                                                  │
│ Click: "Invite Creator"                                         │
│                                                                  │
│ Form:                                                           │
│ ├── Name:           "Sarah Johnson"                            │
│ ├── Email:          "sarah@example.com"                        │
│ ├── X Handle:       "@sarahj"                                  │
│ └── Project:        "Q1 2025 Campaign"                         │
│                                                                  │
│ Submit → System:                                                │
│ ├── Creates invitation document with unique token             │
│ ├── Sends email with magic link:                              │
│ │   app.saas.com/invite/abc123xyz                             │
│ └── Shows in pending invitations list                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 5: VERIFY POSTS (After creator submits)
┌─────────────────────────────────────────────────────────────────┐
│ Navigate to: app.saas.com/veritus/posts/pending                │
│                                                                  │
│ See pending posts:                                              │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Post from: Sarah Johnson (@sarahj)                        │ │
│ │ URL: x.com/sarahj/status/123456789                       │ │
│ │ Metrics: 150 likes, 20 retweets, 5000 impressions        │ │
│ │                                                            │ │
│ │ [View Post] [Approve] [Reject]                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Click "Approve":                                                │
│ ├── Status changes: pending → approved                        │
│ ├── Creator notified via email                                │
│ ├── Post now tracked for metrics updates                      │
│ └── Real-time update sent to all dashboards                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 6: VIEW ANALYTICS
┌─────────────────────────────────────────────────────────────────┐
│ Navigate to: app.saas.com/veritus/analytics                    │
│                                                                  │
│ Dashboard shows:                                                │
│ ├── Organization Overview                                      │
│ │   ├── Total Posts: 25                                       │
│ │   ├── Total Engagement: 50K                                 │
│ │   ├── Active Creators: 5                                    │
│ │   └── Growth Rate: +15%                                     │
│ │                                                              │
│ ├── By Project                                                 │
│ │   └── Q1 Campaign: 15 posts, 30K engagement                │
│ │                                                              │
│ ├── By Creator                                                 │
│ │   ├── Sarah: 8 posts, 20K engagement                       │
│ │   └── Mike: 7 posts, 10K engagement                        │
│ │                                                              │
│ └── Charts                                                      │
│     ├── Engagement over time (line chart)                     │
│     ├── Top performing posts (bar chart)                      │
│     └── Metrics breakdown (pie chart)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 7: NOTIFY CREATORS
┌─────────────────────────────────────────────────────────────────┐
│ From any creator's page, click "Send Notification"             │
│                                                                  │
│ Form:                                                           │
│ ├── Subject:  "Great work on recent posts!"                   │
│ └── Message:  "Keep up the excellent engagement..."           │
│                                                                  │
│ Submit → System:                                                │
│ ├── Creates notification document                             │
│ ├── Sends email to creator                                    │
│ ├── Shows in creator's notification bell                      │
│ └── Real-time notification appears in creator dashboard       │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
CREATOR FLOW
═══════════════════════════════════════════════════════════════════════

Step 1: RECEIVE INVITATION
┌─────────────────────────────────────────────────────────────────┐
│ Email received:                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Subject: You've been invited to join Veritus            │   │
│ │                                                          │   │
│ │ Hi Sarah,                                                │   │
│ │                                                          │   │
│ │ John Doe has invited you to join their team as a       │   │
│ │ content creator for the Q1 2025 Campaign project.       │   │
│ │                                                          │   │
│ │ [Accept Invitation]                                     │   │
│ │ → app.saas.com/invite/abc123xyz                        │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 2: ACTIVATE ACCOUNT
┌─────────────────────────────────────────────────────────────────┐
│ Click link → Redirects to: app.saas.com/invite/abc123xyz       │
│                                                                  │
│ Page shows:                                                     │
│ ├── Welcome to Veritus!                                        │
│ ├── You've been invited to: Q1 2025 Campaign                  │
│ └── Your X Handle: @sarahj                                     │
│                                                                  │
│ Click "Activate Account":                                       │
│ ├── Creates user account (role: "creator")                    │
│ ├── Links to project                                          │
│ ├── Marks invitation as "accepted"                            │
│ └── Sends welcome email with login instructions               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 3: LOGIN (Magic Link Only)
┌─────────────────────────────────────────────────────────────────┐
│ Visit: app.saas.com/login                                       │
│                                                                  │
│ Enter Email: sarah@example.com                                 │
│ Click: "Send Magic Link"                                       │
│                                                                  │
│ → System sends email with login link                           │
│ → Click link in email                                          │
│ → Authenticated and redirected to creator dashboard           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 4: CREATOR DASHBOARD
┌─────────────────────────────────────────────────────────────────┐
│ Redirects to: app.saas.com/creator/[creatorId]                 │
│                                                                  │
│ Dashboard:                                                      │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  Overview:                                               │   │
│ │  ├── Total Posts: 8                                      │   │
│ │  ├── Total Engagement: 20K                               │   │
│ │  ├── Avg. Likes per Post: 2.5K                          │   │
│ │  └── Last Updated: 2 hours ago                          │   │
│ │                                                           │   │
│ │  Quick Actions:                                          │   │
│ │  ├── [➕ Submit New Post]                                │   │
│ │  └── [📊 View Analytics]                                 │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 5: SUBMIT POST (First Time)
┌─────────────────────────────────────────────────────────────────┐
│ Click: "Submit New Post"                                        │
│ Navigate to: app.saas.com/creator/[id]/posts/new               │
│                                                                  │
│ Form:                                                           │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Post URL:        https://x.com/sarahj/status/123456789  │   │
│ │                                                          │   │
│ │ Current Metrics (as of now):                            │   │
│ │ ├── Likes:        150                                   │   │
│ │ ├── Retweets:     20                                    │   │
│ │ ├── Replies:      8                                     │   │
│ │ ├── Quotes:       5                                     │   │
│ │ └── Impressions:  5000                                  │   │
│ │                                                          │   │
│ │ Optional Notes:  "Product launch announcement"         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Submit → System:                                                │
│ ├── Extracts tweet ID from URL                                │
│ ├── Creates post document (status: "pending")                 │
│ ├── Creates initial metrics record                            │
│ ├── Notifies admin for approval                               │
│ └── Shows: "Post submitted. Awaiting admin approval."         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 6: WAIT FOR APPROVAL
┌─────────────────────────────────────────────────────────────────┐
│ Post List shows:                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 📌 Product Launch Post                                   │   │
│ │ Status: ⏳ Pending Approval                              │   │
│ │ Submitted: 10 minutes ago                               │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ → Real-time update when approved:                              │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 📌 Product Launch Post                                   │   │
│ │ Status: ✅ Approved                                      │   │
│ │ Next update due: In 24 hours                            │   │
│ │ [Update Metrics Now]                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 7: UPDATE METRICS (Manual or Reminder)
┌─────────────────────────────────────────────────────────────────┐
│ Option A: Manual Update                                         │
│ ├── Click: "Update Metrics Now"                                │
│ └── Navigate to: .../posts/[postId]/update                     │
│                                                                  │
│ Option B: Email Reminder (24 hours later)                       │
│ ├── Email received: "Time to update your metrics!"            │
│ ├── Click link in email                                        │
│ └── Redirects to update form                                   │
│                                                                  │
│ Update Form:                                                    │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Post: Product Launch                                     │   │
│ │                                                          │   │
│ │ Last Metrics (24 hours ago):                            │   │
│ │ ├── Likes:        150                                   │   │
│ │ ├── Retweets:     20                                    │   │
│ │ └── Impressions:  5000                                  │   │
│ │                                                          │   │
│ │ Current Metrics (enter new values):                     │   │
│ │ ├── Likes:        [250] ⬆️ +100                         │   │
│ │ ├── Retweets:     [35]  ⬆️ +15                          │   │
│ │ ├── Replies:      [12]  ⬆️ +4                           │   │
│ │ ├── Quotes:       [8]   ⬆️ +3                           │   │
│ │ └── Impressions:  [8500] ⬆️ +3500                       │   │
│ │                                                          │   │
│ │ Notes: "Strong engagement on product demo"             │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Submit → System:                                                │
│ ├── Creates NEW metrics record (doesn't overwrite)            │
│ ├── Calculates growth deltas                                  │
│ ├── Updates post.latestMetrics                                │
│ ├── Schedules next reminder (24 hours)                        │
│ └── Real-time update sent to admin dashboard                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
Step 8: VIEW ANALYTICS
┌─────────────────────────────────────────────────────────────────┐
│ Navigate to: app.saas.com/creator/[id]/analytics               │
│                                                                  │
│ Creator Analytics Dashboard:                                   │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Overall Performance                                      │   │
│ │ ├── Total Posts: 8                                      │   │
│ │ ├── Total Likes: 12K                                    │   │
│ │ ├── Total Impressions: 50K                              │   │
│ │ └── Avg Engagement Rate: 24%                            │   │
│ │                                                          │   │
│ │ Growth Over Time (Chart)                                │   │
│ │ └── Line chart showing likes/impressions growth         │   │
│ │                                                          │   │
│ │ Top Performing Posts                                    │   │
│ │ ├── Product Launch: 5K engagement                      │   │
│ │ ├── Behind Scenes: 3K engagement                       │   │
│ │ └── Q&A Session: 2.5K engagement                       │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## **🚀 Step-by-Step Build Guide**
```
═══════════════════════════════════════════════════════════════════════
PHASE 1: PROJECT SETUP & FOUNDATION (Week 1)
═══════════════════════════════════════════════════════════════════════

Day 1-2: Initialize Project
──────────────────────────────────────────────────────────────────────
□ Create Next.js project
   npx create-next-app@latest saas-creator-tracker --typescript --tailwind --app

□ Install dependencies
   npm install mongodb mongoose better-auth zustand
   npm install @better-auth/mongodb-adapter
   npm install resend react-email
   npm install zod react-hook-form @hookform/resolvers
   npm install date-fns recharts lucide-react

□ Setup Shadcn UI
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input table badge dialog \
       form select toast tabs chart alert

□ Setup environment variables (.env.local)
   MONGODB_URI=mongodb://localhost:27017/saas-tracker
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=http://localhost:3000
   RESEND_API_KEY=your-resend-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000

□ Create folder structure (as shown above)


Day 3-4: Database Setup
──────────────────────────────────────────────────────────────────────
□ Setup MongoDB connection (src/lib/db/mongodb.ts)

□ Create Mongoose models:
   ├── Organization.ts
   ├── User.ts
   ├── Project.ts
   ├── Post.ts
   ├── Metrics.ts
   ├── Invitation.ts
   └── Notification.ts

□ Create database indexes

□ Test connection


Day 5-7: Authentication Setup
──────────────────────────────────────────────────────────────────────
□ Configure Better Auth
   ├── Setup MongoDB adapter
   ├── Configure magic link authentication
   ├── Setup session management
   └── Create auth middleware

□ Create auth pages:
   ├── /login
   ├── /signup
   └── /invite/[token]

□ Create auth components:
   ├── LoginForm
   ├── SignupForm
   └── MagicLinkButton

□ Test authentication flow


═══════════════════════════════════════════════════════════════════════
PHASE 2: ADMIN FEATURES (Week 2-3)
═══════════════════════════════════════════════════════════════════════

Week 2 Day 1-3: Organization Management
──────────────────────────────────────────────────────────────────────
□ Create organization signup flow
   ├── Signup form with org name
   ├── Generate unique slug
   ├── Create organization document
   └── Redirect to /[org]

□ Build admin dashboard layout
   ├── Sidebar navigation
   ├── Header with org switcher
   └── Mobile responsive nav

□ Create organization overview page
   └── Display org stats


Week 2 Day 4-7: Project Management
──────────────────────────────────────────────────────────────────────
□ Create project CRUD APIs:
   ├── POST /api/projects - Create project
   ├── GET /api/projects - List projects
   ├── GET /api/projects/[id] - Get project
   ├── PATCH /api/projects/[id] - Update project
   └── DELETE /api/projects/[id] - Delete project

□ Build project pages:
   ├── /[org]/projects - List all projects
   ├── /[org]/projects/new - Create project form
   ├── /[org]/projects/[id] - Project details
   └── /[org]/projects/[id]/analytics - Project analytics

□ Create project components:
   ├── ProjectCard
   ├── ProjectList
   ├── CreateProjectForm
   └── ProjectStats


Week 3 Day 1-4: Creator Management
──────────────────────────────────────────────────────────────────────
□ Create invitation system:
   ├── Generate unique tokens
   ├── Send invitation emails (Resend)
   └── Handle invitation acceptance

□ Build invitation APIs:
   ├── POST /api/creators/invite - Send invitation
   ├── POST /api/creators/accept - Accept invitation
   └── GET /api/invitations - List pending invitations

□ Create email templates:
   ├── Invitation email
   ├── Welcome email
   └── Magic link email

□ Build creator management pages:
   ├── /[org]/creators - List all creators
   ├── /[org]/creators/invite - Invite form
   └── /[org]/creators/[id] - Creator profile


Week 3 Day 5-7: Post Verification
──────────────────────────────────────────────────────────────────────
□ Create post approval APIs:
   ├── GET /api/posts/pending - List pending posts
   ├── POST /api/posts/[id]/approve - Approve post
   └── POST /api/posts/[id]/reject - Reject post

□ Build approval interface:
   ├── /[org]/posts/pending - Pending posts list
   ├── Approval modal with notes
   └── Real-time updates on approval

□ Setup email notifications:
   ├── Post approved email
   └── Post rejected email


═══════════════════════════════════════════════════════════════════════
PHASE 3: CREATOR FEATURES (Week 4)
═══════════════════════════════════════════════════════════════════════

Day 1-3: Creator Dashboard
──────────────────────────────────────────────────────────────────────
□ Build creator layout:
   ├── Creator sidebar
   ├── Stats overview
   └── Quick actions

□ Create creator pages:
   ├── /creator/[id] - Dashboard
   ├── /creator/[id]/posts - My posts
   └── /creator/[id]/analytics - My analytics


Day 4-5: Post Submission
──────────────────────────────────────────────────────────────────────
□ Create post submission APIs:
   ├── POST /api/posts - Submit new post
   └── GET /api/posts/user - Get creator's posts

□ Build submit post form:
   ├── URL input with validation
   ├── Manual metrics input (likes, retweets, etc.)
   ├── Optional notes field
   └── Form validation with Zod

□ Create post components:
   ├── SubmitPostForm
   ├── PostCard
   └── PostList


Day 6-7: Metrics Updates
──────────────────────────────────────────────────────────────────────
□ Create metrics APIs:
   ├── POST /api/posts/[id]/metrics - Submit new metrics
   ├── GET /api/posts/[id]/metrics/history - Get metrics history
   └── Calculate growth deltas

□ Build metrics update form:
   ├── Show previous metrics
   ├── Input new metrics
   ├── Calculate and display growth
   └── Save with timestamp

□ Create metrics components:
   ├── UpdateMetricsForm
   ├── MetricsHistory
   └── GrowthIndicators


═══════════════════════════════════════════════════════════════════════
PHASE 4: ANALYTICS & VISUALIZATION (Week 5)
═══════════════════════════════════════════════════════════════════════

Day 1-3: Analytics Engine
──────────────────────────────────────────────────────────────────────
□ Create analytics aggregation service:
   ├── Organization-level aggregations
   ├── Project-level aggregations
   ├── Creator-level aggregations
   └── Time-series calculations

□ Build analytics APIs:
   ├── GET /api/analytics/organization - Org analytics
   ├── GET /api/analytics/project/[id] - Project analytics
   └── GET /api/analytics/creator/[id] - Creator analytics


Day 4-7: Charts & Visualizations
──────────────────────────────────────────────────────────────────────
□ Create chart components (Recharts):
   ├── MetricsChart - Line chart for growth
   ├── EngagementChart - Bar chart for engagement
   ├── ComparisonChart - Compare creators/posts
   └── StatsCard - KPI cards

□ Build analytics dashboards:
   ├── Organization analytics page
   ├── Project analytics page
   └── Creator analytics page

□ Add export functionality:
   ├── Export to CSV
   └── Export to PDF


═══════════════════════════════════════════════════════════════════════
PHASE 5: REAL-TIME FEATURES (Week 6)
═══════════════════════════════════════════════════════════════════════

Day 1-3: Real-time Updates
──────────────────────────────────────────────────────────────────────
□ Setup MongoDB Change Streams:
   ├── Watch posts collection
   ├── Watch metrics collection
   └── Watch notifications collection

□ Create SSE endpoint:
   └── /api/realtime/sse

□ Build real-time hooks:
   ├── useRealtime - Subscribe to updates
   └── useNotifications - Real-time notifications

□ Add real-time indicators:
   └── Connection status badge


Day 4-5: Notification System
──────────────────────────────────────────────────────────────────────
□ Create notification APIs:
   ├── POST /api/notifications - Create notification
   ├── GET /api/notifications - List notifications
   └── PATCH /api/notifications/[id]/read - Mark as read

□ Build notification components:
   ├── NotificationBell with badge
   ├── NotificationList dropdown
   └── NotificationItem

□ Setup push notifications:
   └── Real-time bell updates


Day 6-7: Email Reminders
──────────────────────────────────────────────────────────────────────
□ Create reminder system:
   ├── Schedule 24-hour reminders
   ├── Track last reminder sent
   └── Calculate next reminder due

□ Build reminder cron job:
   ├── /api/cron/send-reminders
   └── Query posts needing reminders

□ Create reminder email template:
   └── "Time to update your metrics!"


═══════════════════════════════════════════════════════════════════════
PHASE 6: POLISH & TESTING (Week 7)
═══════════════════════════════════════════════════════════════════════

Day 1-2: UI/UX Polish
──────────────────────────────────────────────────────────────────────
□ Responsive design testing
□ Loading states
□ Error handling
□ Empty states
□ Skeleton loaders
□ Toast notifications


Day 3-4: Testing
──────────────────────────────────────────────────────────────────────
□ User flow testing
□ API endpoint testing
□ Real-time features testing
□ Email delivery testing
□ Edge case handling


Day 5-7: Documentation & Deployment
──────────────────────────────────────────────────────────────────────
□ Write API documentation
□ Create user guide
□ Setup deployment (Vercel)
□ Configure production MongoDB
□ Environment variables setup
□ Domain configuration
□ SSL certificates
□ Launch! 🚀
```

---

## **📋 Implementation Checklist**
```
BEFORE YOU START:
☐ Install Node.js 18+
☐ Install MongoDB locally or setup MongoDB Atlas
☐ Create Resend account for emails
☐ Prepare test email addresses

CRITICAL DECISIONS:
☐ Choose MongoDB hosting (Local vs Atlas)
☐ Email provider setup (Resend recommended)
☐ Decide on deployment platform (Vercel recommended)
☐ Plan subdomain structure (app.saas.com vs custom)

MUST-HAVE FEATURES FOR MVP:
☐ User authentication (Better Auth)
☐ Organization creation & management
☐ Project CRUD
☐ Creator invitations via email
☐ Post submission & approval
☐ Manual metrics updates
☐ Basic analytics dashboard
☐ Email reminders (24hr)
☐ Real-time updates

NICE-TO-HAVE (Post-MVP):
☐ Advanced analytics with custom date ranges
☐ Bulk operations (bulk approve, bulk invite)
☐ Export to CSV/PDF
☐ Mobile app
☐ Slack/Discord integrations
☐ API for third-party integrations
☐ Custom branding per organization
☐ Multi-language support