BEGIN;

-- Demo password for all seeded users: DemoPass123!

INSERT INTO api_user (
  password, last_login, is_superuser, username, first_name, last_name,
  is_staff, is_active, date_joined, id, name, email, phone_no, role,
  verification_status, last_login_at, created_at, is_profile_visible
)
SELECT
  'pbkdf2_sha256$600000$collunedemoseed$s8K9HYk5LIH2a5HJDhKkLVDPULm0gqzhwDYQdnddHG0=',
  NULL,
  FALSE,
  format('demo_creator_%s', lpad(i::text, 2, '0')),
  '',
  '',
  FALSE,
  TRUE,
  now(),
  ('10000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('Demo Creator %s', lpad(i::text, 2, '0')),
  format('demo.creator%s@collune.test', lpad(i::text, 2, '0')),
  format('+15550010%s', lpad(i::text, 2, '0')),
  'CREATOR',
  'VERIFIED',
  NULL,
  now(),
  TRUE
FROM generate_series(1, 10) AS s(i)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  phone_no = EXCLUDED.phone_no,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status,
  is_profile_visible = EXCLUDED.is_profile_visible;

INSERT INTO api_user (
  password, last_login, is_superuser, username, first_name, last_name,
  is_staff, is_active, date_joined, id, name, email, phone_no, role,
  verification_status, last_login_at, created_at, is_profile_visible
)
SELECT
  'pbkdf2_sha256$600000$collunedemoseed$s8K9HYk5LIH2a5HJDhKkLVDPULm0gqzhwDYQdnddHG0=',
  NULL,
  FALSE,
  format('demo_brand_%s', lpad(i::text, 2, '0')),
  '',
  '',
  FALSE,
  TRUE,
  now(),
  ('11000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('Demo Brand %s', lpad(i::text, 2, '0')),
  format('demo.brand%s@collune.test', lpad(i::text, 2, '0')),
  format('+15550020%s', lpad(i::text, 2, '0')),
  'BRAND',
  'VERIFIED',
  NULL,
  now(),
  TRUE
FROM generate_series(1, 10) AS s(i)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  phone_no = EXCLUDED.phone_no,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status,
  is_profile_visible = EXCLUDED.is_profile_visible;

WITH data AS (
  SELECT * FROM (VALUES
    (1, 'Fashion', 'New York'),
    (2, 'Beauty', 'Los Angeles'),
    (3, 'Food', 'Austin'),
    (4, 'Travel', 'Seattle'),
    (5, 'Fitness', 'Denver'),
    (6, 'Tech', 'San Francisco'),
    (7, 'Gaming', 'Chicago'),
    (8, 'Finance', 'Boston'),
    (9, 'Education', 'Atlanta'),
    (10, 'Lifestyle', 'Miami')
  ) AS v(i, category, location)
)
INSERT INTO api_creatorprofile (
  creator_id, user_id, display_name, category, location, languages,
  collaboration_preferences, bio, about, gender, profile_image,
  profile_completion, work_with, created_at, updated_at
)
SELECT
  ('20000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('10000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('%s Creator %s', category, lpad(i::text, 2, '0')),
  category,
  location,
  '["English", "Spanish"]'::jsonb,
  '["Paid campaigns", "Product reviews"]'::jsonb,
  format('Demo creator focused on %s content.', lower(category)),
  format('Creates practical %s stories for engaged audiences.', lower(category)),
  'Not specified',
  NULL,
  100,
  '["Brands", "Agencies"]'::jsonb,
  now(),
  now()
FROM data
ON CONFLICT (creator_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  languages = EXCLUDED.languages,
  collaboration_preferences = EXCLUDED.collaboration_preferences,
  bio = EXCLUDED.bio,
  about = EXCLUDED.about,
  profile_completion = EXCLUDED.profile_completion,
  work_with = EXCLUDED.work_with,
  updated_at = now();

WITH data AS (
  SELECT * FROM (VALUES
    (1, 'Apparel'), (2, 'Cosmetics'), (3, 'Restaurant'), (4, 'Travel'),
    (5, 'Wellness'), (6, 'SaaS'), (7, 'Gaming'), (8, 'Fintech'),
    (9, 'Edtech'), (10, 'Home')
  ) AS v(i, industry)
)
INSERT INTO api_brandprofile (
  brand_id, user_id, company_name, industry, website, company_size,
  linkedin_url, logo, created_at, updated_at
)
SELECT
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('%s Brand %s', industry, lpad(i::text, 2, '0')),
  industry,
  format('https://brand%s.example.com', lpad(i::text, 2, '0')),
  '11-50',
  format('https://linkedin.com/company/demo-brand-%s', lpad(i::text, 2, '0')),
  NULL,
  now(),
  now()
FROM data
ON CONFLICT (brand_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  industry = EXCLUDED.industry,
  website = EXCLUDED.website,
  company_size = EXCLUDED.company_size,
  linkedin_url = EXCLUDED.linkedin_url,
  updated_at = now();

INSERT INTO api_creatorsocialaccount (
  account_id, creator_id, platform, social_id, username, handle, url,
  followers, media_count, view_count, engagement_rate, video_count,
  videos, analytics, provider_data, access_token, refresh_token,
  expires_at, is_connected, last_synced_at, created_at
)
SELECT
  ('40000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  CASE WHEN i % 3 = 0 THEN 'YOUTUBE' WHEN i % 3 = 1 THEN 'INSTAGRAM' ELSE 'FACEBOOK' END,
  format('demo-social-%s', i),
  format('demo_creator_%s', lpad(i::text, 2, '0')),
  format('@demo_creator_%s', lpad(i::text, 2, '0')),
  format('https://social.example.com/demo_creator_%s', lpad(i::text, 2, '0')),
  5000 + i * 1750,
  80 + i * 9,
  25000 + i * 6500,
  round((2.8 + i * 0.17)::numeric, 2)::float,
  12 + i,
  '[]'::jsonb,
  jsonb_build_object('avg_views', 12000 + i * 900, 'reach', 30000 + i * 1500),
  jsonb_build_object('seeded', true),
  '',
  '',
  now() + interval '30 days',
  TRUE,
  now(),
  now()
FROM generate_series(1, 10) AS s(i)
ON CONFLICT (account_id) DO UPDATE SET
  platform = EXCLUDED.platform,
  username = EXCLUDED.username,
  handle = EXCLUDED.handle,
  url = EXCLUDED.url,
  followers = EXCLUDED.followers,
  media_count = EXCLUDED.media_count,
  view_count = EXCLUDED.view_count,
  engagement_rate = EXCLUDED.engagement_rate,
  video_count = EXCLUDED.video_count,
  analytics = EXCLUDED.analytics,
  provider_data = EXCLUDED.provider_data,
  is_connected = EXCLUDED.is_connected,
  last_synced_at = now();

WITH data AS (
  SELECT * FROM (VALUES
    (1, 'Fashion'), (2, 'Beauty'), (3, 'Food'), (4, 'Travel'), (5, 'Fitness'),
    (6, 'Tech'), (7, 'Gaming'), (8, 'Finance'), (9, 'Education'), (10, 'Lifestyle')
  ) AS v(i, category)
)
INSERT INTO api_campaign (
  campaign_id, brand_id, title, internal_reference_name, brief, objective,
  deliverables, brand_requirements, creative_direction, tone_of_communication,
  brand_guidelines, content_references, platforms, category, audience_type,
  location, minimum_followers, language_preference, content_style,
  additional_preferences, total_budget, budget_range, compensation_type,
  deliverable_pricing, start_date, end_date, deadline, cover_image,
  created_at, updated_at
)
SELECT
  ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('%s Creator Launch %s', category, lpad(i::text, 2, '0')),
  format('demo-campaign-%s', lpad(i::text, 2, '0')),
  format('Partner with creators to promote a %s launch.', lower(category)),
  format('Drive awareness and trial for a %s campaign.', lower(category)),
  '1 reel, 3 stories, and usage rights for 30 days.',
  format('Looking for %s creators in the United States.', lower(category)),
  'Authentic product-led storytelling with a clear call to action.',
  'Friendly, clear, and aspirational.',
  NULL,
  'Use brand examples and creator-led product demos.',
  CASE WHEN i % 2 = 0 THEN '["INSTAGRAM", "YOUTUBE"]'::jsonb ELSE '["INSTAGRAM"]'::jsonb END,
  category,
  'Gen Z and Millennials',
  'United States',
  3000 + i * 1000,
  'English',
  'Short-form video',
  'Prefer creators with strong engagement.',
  1500 + i * 250,
  '$1,000 - $5,000',
  'Paid',
  '{"reel": "600", "story": "150"}'::jsonb,
  current_date + i,
  current_date + i + 21,
  current_date + i + 10,
  NULL,
  now() - (10 - i) * interval '1 day',
  now()
FROM data
ON CONFLICT (campaign_id) DO UPDATE SET
  title = EXCLUDED.title,
  brief = EXCLUDED.brief,
  objective = EXCLUDED.objective,
  deliverables = EXCLUDED.deliverables,
  brand_requirements = EXCLUDED.brand_requirements,
  platforms = EXCLUDED.platforms,
  category = EXCLUDED.category,
  total_budget = EXCLUDED.total_budget,
  deadline = EXCLUDED.deadline,
  updated_at = now();

INSERT INTO api_campaignapplication (
  application_id, campaign_id, creator_id, pitch, quoted_rate, status,
  created_at, updated_at
)
SELECT
  ('60000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-0000-0000-' || lpad((((i + 2 - 1) % 10) + 1)::text, 12, '0'))::uuid,
  format('I can create an authentic creator-led story for demo campaign %s.', i),
  400 + i * 125,
  (ARRAY['APPLIED', 'ACCEPTED', 'REJECTED', 'APPLIED', 'ACCEPTED', 'APPLIED', 'ACCEPTED', 'REJECTED', 'APPLIED', 'ACCEPTED'])[i],
  now() - i * interval '1 day',
  now()
FROM generate_series(1, 10) AS s(i)
ON CONFLICT (campaign_id, creator_id) DO UPDATE SET
  pitch = EXCLUDED.pitch,
  quoted_rate = EXCLUDED.quoted_rate,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO api_creatorsavedcampaign (
  saved_id, campaign_id, creator_id, created_at
)
SELECT
  ('70000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-0000-0000-' || lpad((((i + 5 - 1) % 10) + 1)::text, 12, '0'))::uuid,
  now() - i * interval '1 day'
FROM generate_series(1, 10) AS s(i)
ON CONFLICT (campaign_id, creator_id) DO NOTHING;

WITH data AS (
  SELECT * FROM (VALUES
    (1, 'Fashion'), (2, 'Beauty'), (3, 'Food'), (4, 'Travel'), (5, 'Fitness'),
    (6, 'Tech'), (7, 'Gaming'), (8, 'Finance'), (9, 'Education'), (10, 'Lifestyle')
  ) AS v(i, category)
)
INSERT INTO api_brandshortlist (
  shortlist_id, brand_id, title, status, purpose, notes, platforms,
  categories, audience, budget_range, timeline, created_at, updated_at
)
SELECT
  ('80000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  format('%s Creator Shortlist %s', category, lpad(i::text, 2, '0')),
  CASE WHEN i % 2 = 0 THEN 'DRAFT' ELSE 'SUBMITTED' END,
  format('Find creators for the %s campaign.', category),
  'Seeded shortlist for dashboard and list testing.',
  CASE WHEN i % 2 = 0 THEN '["INSTAGRAM", "YOUTUBE"]'::jsonb ELSE '["INSTAGRAM"]'::jsonb END,
  category,
  'Gen Z and Millennials',
  '$1,000 - $5,000',
  'Launch within 30 days',
  now() - i * interval '1 day',
  now()
FROM data
ON CONFLICT (shortlist_id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  purpose = EXCLUDED.purpose,
  notes = EXCLUDED.notes,
  platforms = EXCLUDED.platforms,
  categories = EXCLUDED.categories,
  audience = EXCLUDED.audience,
  budget_range = EXCLUDED.budget_range,
  timeline = EXCLUDED.timeline,
  updated_at = now();

INSERT INTO api_brandshortlist_creators (brandshortlist_id, creatorprofile_id)
SELECT
  ('80000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-0000-0000-' || lpad((((i + offset_value - 1) % 10) + 1)::text, 12, '0'))::uuid
FROM generate_series(1, 10) AS s(i)
CROSS JOIN (VALUES (0), (1), (2)) AS offsets(offset_value)
ON CONFLICT DO NOTHING;

DELETE FROM api_otpverification WHERE purpose = 'demo_seed';

INSERT INTO api_otpverification (
  otp_id, channel, target, code, purpose, is_verified, attempts,
  expires_at, created_at, verified_at
)
SELECT
  ('90000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  CASE WHEN i % 2 = 0 THEN 'PHONE' ELSE 'EMAIL' END,
  CASE WHEN i % 2 = 0 THEN format('demo.otp.phone.%s', lpad(i::text, 2, '0')) ELSE format('demo.otp%s@collune.test', lpad(i::text, 2, '0')) END,
  (100000 + i)::text,
  'demo_seed',
  i % 3 <> 0,
  i % 3,
  now() + (10 + i) * interval '1 minute',
  now(),
  CASE WHEN i % 3 <> 0 THEN now() - i * interval '1 minute' ELSE NULL END
FROM generate_series(1, 10) AS s(i);

COMMIT;
