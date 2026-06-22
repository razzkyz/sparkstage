# Retail Category UI Implementation Plan

## Objective
Implement the new retail category system (which uses `retail_categories` and `retail_subcategory_id` on products) into the public-facing shop interfaces for:
1. Glam
2. Charm Bar
3. Spark Club

## Phase 1: Glam (Current)
- [ ] Review current `Glam` shop page implementation.
- [ ] Identify how products are currently fetched and displayed.
- [ ] Implement fetching of `retail_categories` where `department = 'glam'` and `is_active = true`.
- [ ] Update the UI to display the active categories/subcategories for filtering.
- [ ] Update the product fetching logic to filter by the selected `retail_category_id` or `retail_subcategory_id`.
- [ ] Ensure URL search params or local state is used appropriately to manage the selected category.

## Phase 2: Charm Bar
- [ ] Review `CharmBar` shop page.
- [ ] Implement similar category fetching for `department = 'charmbar'`.
- [ ] Update UI and filtering logic.

## Phase 3: Spark Club
- [ ] Review `SparkClub` shop page.
- [ ] Implement similar category fetching for `department = 'sparkclub'`.
- [ ] Update UI and filtering logic.

## Technical Details
- Utilize existing hooks or create new hooks (e.g., `useRetailCategories`) to fetch active categories by department.
- Ensure only active categories are displayed.
- Make sure filtering works seamlessly with existing features like sorting or search.
