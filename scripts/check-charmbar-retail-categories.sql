-- Check what categories exist in retail_categories for charmbar

-- 1. Show all charmbar categories
SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active,
  (SELECT name FROM retail_categories WHERE id = c.parent_id) as parent_name
FROM retail_categories c
WHERE department = 'charmbar'
ORDER BY parent_id NULLS FIRST, name;

-- 2. Check if any old slugs still exist
SELECT 
  id,
  name,
  slug,
  department
FROM retail_categories
WHERE slug IN (
  'base', 'edgy-soul', 'foodie', 'hobby', 'holiday', 
  'island-vibes', 'love', 'pets', 'pop-icon', 'sky-dream', 
  'soft-muse', 'the-icon', 'zodiac', 'lucky-charm', 'satuan-c'
)
ORDER BY department, slug;

-- 3. Count by department
SELECT 
  department,
  COUNT(*) as total_categories
FROM retail_categories
WHERE is_active = true
GROUP BY department
ORDER BY department;
