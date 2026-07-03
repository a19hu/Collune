# Collune Admin Panel Feature Plan

This file defines the admin panel features that fit the current Collune codebase. The platform flow should remain platform-mediated:

Brand -> Admin/Platform -> Creator -> Admin/Platform -> Brand

Direct brand-to-creator communication should not be added unless the product direction changes.


1. creator verified by admin 
2. when creator apply to campaigns then recived to admin and admin access to that this creator as a recommented or not for that campaigns 
3. brand shortlist submmit then admin recieved and approved to which creator goes or not 
4. admin can we create user only for access some featured 

## Admin Panel Modules

### 1. Admin Dashboard

Purpose: give admins one operational view of platform activity.

Required widgets:

- Pending creator verifications.
- Active campaigns.
- Submitted shortlists requiring platform review.
- Recent creator applications.
- Suspended or inactive users.

Backend needed:

- `GET /api/v1/admin/dashboard/`
- Return counts and recent items without serializers if following current manual admin style.

Frontend page:

- `/admin`
- Cards for counts.
- Tables for pending actions.

### 2. User Management

Purpose: manage all platform users from one place.

Features:

- List users by role: admin, brand, creator.
- Search by name, email, phone.
- Filter by active/inactive, role, verification status.
- Suspend or reactivate user.
- View linked brand or creator profile.

Existing support:

- `User.status`
- `User.is_active`
- `User.role`
- `BrandProfile.user`
- `CreatorProfile.user`

Backend needed:

- `GET /api/v1/admin/users/`
- `PATCH /api/v1/admin/users/<user_id>/status/`

Recommended fields:

- `id`
- `name`
- `email`
- `phone_no`
- `role`
- `status`
- `is_active`
- `last_login_at`
- `created_at`
- `profile_id`
- `verification_status`

### 3. Brand Management

Purpose: manage companies and keep brand access controlled.

Features:

- List all brands.
- View company details.
- Approve/reject brand verification.
- Suspend brand user.
- View brand campaigns.
- View brand shortlists.
- View brand team members once team support is added.

Existing support:

- `BrandProfile.verification_status`
- `BrandProfile.is_profile_visible`
- `BrandProfile.profile_completion`
- `Campaign.brand`
- `BrandShortlist.brand`

Backend needed:

- `GET /api/v1/admin/brands/`
- `GET /api/v1/admin/brands/<brand_id>/`
- `PATCH /api/v1/admin/brands/<brand_id>/verification/`

Future model needed for team members:

- `BrandTeamMember`
  - `brand`
  - `user`
  - `role`
  - `invited_by`
  - `status`

Brand team roles:

- Owner
- Marketing Manager
- Finance
- Viewer

### 4. Creator Management

Purpose: verify, review, and manage creator supply.

Features:

- List all creators.
- Search by name, category, location, language, platform.
- Filter by verification status, visibility, social connected, category.
- View full creator profile.
- Verify/reject creator.
- Suspend creator user.
- View social account connection status.
- View creator campaign applications.

Existing support:

- `CreatorProfile.verification_status`
- `CreatorProfile.is_profile_visible`
- `CreatorProfile.category`
- `CreatorProfile.location`
- `CreatorProfile.languages`
- `CreatorProfile.rate_min`
- `CreatorProfile.rate_max`
- `CreatorSocialAccount`
- `CampaignApplication.creator`

Backend needed:

- `GET /api/v1/admin/creators/`
- `GET /api/v1/admin/creators/<creator_id>/`
- `PATCH /api/v1/admin/creators/<creator_id>/verification/`

### 5. Campaign Management

Purpose: admin controls campaign quality and lifecycle.

Features:

- List all campaigns from all brands.
- Filter by status, brand, category, deadline.
- Review campaign brief, budget, requirements, platforms.
- Approve campaign: move to `ACTIVE`.
- Reject or request edits: keep `DRAFT` or move to `REVIEWING`.
- Pause/cancel campaign.
- Track progress.
- View campaign applications and assigned creators.

Existing support:

- `Campaign.status`: `DRAFT`, `ACTIVE`, `REVIEWING`, `PAUSED`, `COMPLETED`.
- `CampaignApplication`
- `CampaignStatusSummary`

Backend needed:

- `GET /api/v1/admin/campaigns/`
- `GET /api/v1/admin/campaigns/<campaign_id>/`
- `PATCH /api/v1/admin/campaigns/<campaign_id>/status/`
- `PATCH /api/v1/admin/campaigns/<campaign_id>/progress/`

Recommended admin status workflow:

- Brand creates campaign as `DRAFT`.
- Brand submits campaign -> `REVIEWING`.
- Admin approves -> `ACTIVE`.
- Admin pauses -> `PAUSED`.
- Admin completes -> `COMPLETED`.

### 6. Creator Matching

Purpose: admins shortlist and assign creators for brand campaigns.

Features:

- View campaign requirements.
- Search matching creators by:
  - category
  - followers
  - engagement
  - location
  - language
  - platform
  - rate range
- Add creators to admin shortlist for campaign.
- Mark creator as invited.
- Record creator response: accepted, rejected, negotiating.
- Convert accepted creator to campaign application or assignment.

Existing support:

- `CreatorProfile`
- `CreatorSocialAccount`
- `BrandShortlist`
- `CampaignApplication`

New model recommended:

- `CampaignCreatorAssignment`
  - `campaign`
  - `creator`
  - `assigned_by`
  - `status`: `SHORTLISTED`, `INVITED`, `ACCEPTED`, `REJECTED`, `NEGOTIATING`, `CONFIRMED`
  - `admin_notes`
  - `creator_response`
  - `quoted_rate`
  - `created_at`
  - `updated_at`

Backend needed:

- `GET /api/v1/admin/campaigns/<campaign_id>/matches/`
- `POST /api/v1/admin/campaigns/<campaign_id>/assignments/`
- `PATCH /api/v1/admin/assignments/<assignment_id>/`

### 7. Shortlist Review

Purpose: brand shortlists should become platform-reviewed requests, not direct creator contact.

Features:

- See submitted shortlists.
- Review selected creators.
- Add/remove suggested creators.
- Submit admin-approved creator list.
- Update shortlist status.

Existing support:

- `BrandShortlist.status`: `DRAFT`, `SUBMITTED`.

Backend needed:

- `GET /api/v1/admin/shortlists/`
- `GET /api/v1/admin/shortlists/<shortlist_id>/`
- `PATCH /api/v1/admin/shortlists/<shortlist_id>/`

Recommended workflow:

- Brand saves shortlist as `DRAFT`.
- Brand submits shortlist -> `SUBMITTED`.

### 8. Communication Hub

Purpose: keep brand and creator communication mediated by the platform.

Features:

- Brand request thread.
- Creator outreach thread.
- Internal admin notes.
- Status updates visible to brand.
- Creator response visible to admin.
- Optional brand-safe summary message.

New models recommended:

- `PlatformConversation`
  - `conversation_id`
  - `brand`
  - `creator`
  - `campaign`
  - `shortlist`
  - `created_by`
  - `status`

- `PlatformMessage`
  - `conversation`
  - `sender`
  - `audience`: `ADMIN_INTERNAL`, `BRAND_VISIBLE`, `CREATOR_VISIBLE`
  - `message`
  - `created_at`

Backend needed:

- `GET /api/v1/admin/conversations/`
- `GET /api/v1/admin/conversations/<conversation_id>/`
- `POST /api/v1/admin/conversations/<conversation_id>/messages/`

### 9. Role And Permission Management

Purpose: admin can create internal admin/team roles and control feature access.

Current limitation:

- Codebase only has coarse user roles: `ADMIN`, `BRAND`, `CREATOR`.
- There is no feature-wise permission model yet.

New models recommended:

- `PlatformRole`
  - `name`
  - `scope`: `ADMIN`, `BRAND`
  - `description`

- `PlatformPermission`
  - `code`
  - `module`
  - `description`

- `PlatformRolePermission`
  - `role`
  - `permission`

- `UserPlatformRole`
  - `user`
  - `role`
  - `brand` nullable for brand-team roles

Permission examples:

- `admin.users.view`
- `admin.users.suspend`
- `admin.brands.verify`
- `admin.creators.verify`
- `admin.campaigns.approve`
- `admin.campaigns.assign_creators`
- `admin.shortlists.review`
- `admin.communication.manage`
- `brand.campaigns.create`
- `brand.billing.view`
- `brand.shortlists.manage`

Backend needed:

- `GET /api/v1/admin/roles/`
- `POST /api/v1/admin/roles/`
- `PATCH /api/v1/admin/roles/<role_id>/permissions/`
- `PATCH /api/v1/admin/users/<user_id>/roles/`



## Recommended Build Order

### Phase 1: Practical Admin MVP

Build this first:

1. Admin dashboard.
2. User list and suspend/reactivate.
3. Brand list/detail/verify.
4. Creator list/detail/verify.
5. Campaign list/detail/status approval.
6. Shortlist review list/detail.

Reason: these map directly to existing models and unblock platform operations.

### Phase 2: Platform-Mediated Workflow

Build next:

1. Campaign creator assignments.
2. Admin matching screen.
3. Creator invitation status.
4. Communication hub.

Reason: this enforces the product rule that brands do not contact creators directly.

### Phase 3: Permissions And Teams

Build after core admin workflows are stable:

1. Admin feature-wise permissions.
2. Brand team members.
3. Brand roles: Owner, Marketing Manager, Finance, Viewer.

Reason: this changes access control and should be added once admin modules are clear.


## Admin Sidebar Proposal

- Dashboard
- Users
- Brands
- Creators
- Campaigns
- Shortlists
- Matching
- Communication
- Roles & Permissions
- Billing
- Settings

For MVP, show only:

- Dashboard
- Users
- Brands
- Creators
- Campaigns
- Shortlists

## API Naming Proposal

Use `/api/v1/admin/...` for all admin panel endpoints.

Examples:

- `/api/v1/admin/dashboard/`
- `/api/v1/admin/users/`
- `/api/v1/admin/brands/`
- `/api/v1/admin/creators/`
- `/api/v1/admin/campaigns/`
- `/api/v1/admin/shortlists/`
- `/api/v1/admin/assignments/`
- `/api/v1/admin/conversations/`
- `/api/v1/admin/roles/`

## Frontend Route Proposal

Use a separate admin layout:

- `/admin`
- `/admin/users`
- `/admin/brands`
- `/admin/brands/:brandId`
- `/admin/creators`
- `/admin/creators/:creatorId`
- `/admin/campaigns`
- `/admin/campaigns/:campaignId`
- `/admin/shortlists`
- `/admin/shortlists/:shortlistId`
- `/admin/matching/:campaignId`
- `/admin/communication`
- `/admin/roles`

## Important Product Rules

- Brands can discover and shortlist creators.
- Brands should not directly message creators.
- Admin/platform reviews brand requests.
- Admin/platform contacts creators.
- Creator responses are routed through admin/platform.
- Admin updates the brand.
- Verification must gate sensitive access for brands and creators.
- Creator marketplace should show only admin-approved or active campaigns.
- Campaign status changes should be auditable in a future activity log.

## Features Not Recommended For MVP

- Direct brand-to-creator chat.
- Fully custom permission builder before admin workflows exist.

