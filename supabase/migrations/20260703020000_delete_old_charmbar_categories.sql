-- =====================================================
-- Migration: Delete old charmbar categories
-- Created: 2026-07-03
-- Purpose: Remove old categories (HOBBY, HOLIDAY, EDGY SOUL, etc.)
-- =====================================================

-- Delete old charmbar main categories
DELETE FROM retail_categories
WHERE department = 'charmbar'
  AND slug IN (
    'basic', 'edgy-soul', 'foodie', 'hobby', 'holiday', 
    'island-vibes', 'love', 'lucky-charm', 'pets', 'pop-icon', 
    'sky-dream', 'soft-muse', 'the-icon', 'zodiac',
    'charmbar-general-auto', 'charmbar-jewelry', 'charmbar-satuan-charm',
    'base', 'pendants', 'welded'
  );

-- Verify: should only have SPARK MY CHARMS categories left
SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active
FROM retail_categories
WHERE department = 'charmbar'
ORDER BY parent_id NULLS FIRST, name;
