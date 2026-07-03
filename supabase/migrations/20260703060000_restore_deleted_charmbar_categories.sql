-- =====================================================
-- Migration: Restore deleted charmbar categories
-- Created: 2026-07-03
-- Purpose: Restore all old charmbar categories that were deleted
-- =====================================================

-- Restore old charmbar categories (these were accidentally deleted)
INSERT INTO retail_categories (name, slug, department, is_active, parent_id)
VALUES
  -- Main categories (no parent)
  ('Base', 'base', 'charmbar', true, NULL),
  ('Edgy Soul', 'edgy-soul', 'charmbar', true, NULL),
  ('Foodie', 'foodie', 'charmbar', true, NULL),
  ('Hobby', 'hobby', 'charmbar', true, NULL),
  ('Holiday', 'holiday', 'charmbar', true, NULL),
  ('Island Vibes', 'island-vibes', 'charmbar', true, NULL),
  ('Love', 'love', 'charmbar', true, NULL),
  ('Pets', 'pets', 'charmbar', true, NULL),
  ('Pop Icon', 'pop-icon', 'charmbar', true, NULL),
  ('Sky Dream', 'sky-dream', 'charmbar', true, NULL),
  ('Soft Muse', 'soft-muse', 'charmbar', true, NULL),
  ('The Icon', 'the-icon', 'charmbar', true, NULL),
  ('Zodiac', 'zodiac', 'charmbar', true, NULL),
  ('Lucky Charm', 'lucky-charm', 'charmbar', true, NULL),
  ('Pendants', 'pendants', 'charmbar', true, NULL),
  ('Welded', 'welded', 'charmbar', true, NULL)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  parent_id = EXCLUDED.parent_id;

-- Verify: Show all charmbar categories (old + new SPARK MY CHARMS)
SELECT 
  id,
  name,
  slug,
  parent_id,
  is_active
FROM retail_categories
WHERE department = 'charmbar'
ORDER BY parent_id NULLS FIRST, name;
