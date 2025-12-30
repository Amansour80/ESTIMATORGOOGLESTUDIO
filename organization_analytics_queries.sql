-- Organization Analytics Queries
-- Use these queries to analyze your user base and understand prospective clients

-- 1. Overview: Total organizations by subscription plan
SELECT
  s.plan,
  COUNT(*) as organization_count,
  COUNT(DISTINCT om.user_id) as total_users
FROM organizations o
JOIN subscriptions s ON s.organization_id = o.id
LEFT JOIN organization_members om ON om.organization_id = o.id
GROUP BY s.plan
ORDER BY organization_count DESC;

-- 2. Industry Distribution
SELECT
  COALESCE(industry, 'Not Specified') as industry,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM organizations
GROUP BY industry
ORDER BY count DESC;

-- 3. Company Size Distribution
SELECT
  COALESCE(company_size, 'Not Specified') as company_size,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM organizations
GROUP BY company_size
ORDER BY
  CASE company_size
    WHEN '1-10' THEN 1
    WHEN '11-50' THEN 2
    WHEN '51-200' THEN 3
    WHEN '201-500' THEN 4
    WHEN '501-1000' THEN 5
    WHEN '1000+' THEN 6
    ELSE 7
  END;

-- 4. Geographic Distribution
SELECT
  COALESCE(country, 'Not Specified') as country,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM organizations
GROUP BY country
ORDER BY count DESC;

-- 5. Free Plan Usage Analysis
SELECT
  o.name as organization_name,
  o.industry,
  o.company_size,
  o.country,
  ut.projects_count,
  ut.inquiries_count,
  o.created_at as signup_date,
  EXTRACT(day FROM now() - o.created_at) as days_since_signup
FROM organizations o
JOIN subscriptions s ON s.organization_id = o.id
LEFT JOIN usage_tracking ut ON ut.organization_id = o.id
WHERE s.plan = 'free'
ORDER BY o.created_at DESC;

-- 6. High-Value Prospects (Free users hitting limits)
SELECT
  o.name as organization_name,
  o.industry,
  o.company_size,
  o.country,
  o.phone,
  o.website,
  ut.projects_count,
  ut.inquiries_count,
  CASE
    WHEN ut.projects_count >= 3 THEN 'Project Limit Reached'
    WHEN ut.inquiries_count >= 5 THEN 'Inquiry Limit Reached'
    WHEN ut.projects_count = 2 THEN 'Close to Project Limit'
    ELSE 'Active User'
  END as status
FROM organizations o
JOIN subscriptions s ON s.organization_id = o.id
JOIN usage_tracking ut ON ut.organization_id = o.id
WHERE s.plan = 'free'
  AND (ut.projects_count >= 2 OR ut.inquiries_count >= 4)
ORDER BY ut.projects_count DESC, ut.inquiries_count DESC;

-- 7. Industry + Company Size Matrix
SELECT
  COALESCE(o.industry, 'Not Specified') as industry,
  COALESCE(o.company_size, 'Not Specified') as company_size,
  COUNT(*) as count
FROM organizations o
GROUP BY o.industry, o.company_size
ORDER BY industry,
  CASE company_size
    WHEN '1-10' THEN 1
    WHEN '11-50' THEN 2
    WHEN '51-200' THEN 3
    WHEN '201-500' THEN 4
    WHEN '501-1000' THEN 5
    WHEN '1000+' THEN 6
    ELSE 7
  END;

-- 8. Conversion-Ready Organizations (Complete profiles with high usage)
SELECT
  o.name,
  o.industry,
  o.company_size,
  o.country,
  o.phone,
  o.website,
  om.email as contact_email,
  ut.projects_count,
  ut.inquiries_count,
  o.created_at as signup_date
FROM organizations o
JOIN subscriptions s ON s.organization_id = o.id
JOIN usage_tracking ut ON ut.organization_id = o.id
JOIN organization_members om ON om.organization_id = o.id AND om.role = 'owner'
JOIN auth.users u ON u.id = om.user_id
WHERE s.plan = 'free'
  AND o.phone IS NOT NULL
  AND (ut.projects_count >= 2 OR ut.inquiries_count >= 4)
ORDER BY ut.projects_count + ut.inquiries_count DESC;

-- 9. Monthly Sign-up Trends
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_organizations,
  STRING_AGG(DISTINCT industry, ', ') as industries
FROM organizations
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 10. Contact List for Sales Outreach (Organizations with complete details)
SELECT
  o.name as organization_name,
  u.email as contact_email,
  o.phone,
  o.industry,
  o.company_size,
  o.country,
  o.website,
  s.plan as current_plan,
  COALESCE(ut.projects_count, 0) as projects_count,
  COALESCE(ut.inquiries_count, 0) as inquiries_count,
  o.created_at as signup_date
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id AND om.role = 'owner'
JOIN auth.users u ON u.id = om.user_id
JOIN subscriptions s ON s.organization_id = o.id
LEFT JOIN usage_tracking ut ON ut.organization_id = o.id
WHERE o.phone IS NOT NULL OR o.website IS NOT NULL
ORDER BY o.created_at DESC;