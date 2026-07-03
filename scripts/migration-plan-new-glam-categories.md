# Migration Plan: New Shop.GLAM Category Structure

## Current Situation
- Table: `retail_categories` with department field ('glam', 'charmbar', 'sparkclub')
- Has parent-child relationship (parent_id)
- Currently has sample data for glam: Makeup, Skincare, Haircare

## New Structure Required

### Department: 'glam'

#### Main Categories (parent_id = NULL):
1. SPARK MY FACE
2. SPARK MY HAIR
3. SPARK MY CHARMS
4. SPARK MY NAILS (no subcategories)
5. SPARK MY STYLE

#### Subcategories (with parent_id):

**SPARK MY FACE:**
- STAR GLITTER
- GLITTER TATTO

**SPARK MY HAIR:**
- SPARKLE HAIR TINSEL
- HAIR ACCESSORIES

**SPARK MY CHARMS:**
- CHARMS BASE
- WELDED CHARMS
- PENDANT CHARMS
- KEYCHAINS
- NECKLACES
- RINGS
- BRACELET
- BANGLES

**SPARK MY NAILS:**
- (no subcategories)

**SPARK MY STYLE:**
- FASHION
- BAG
- EYEWEAR
- SCARVES
- BELTS
- ARM SLEEVES

## Migration Steps

1. **Backup current data** - Save existing retail_categories for glam department
2. **Delete old glam categories** - Remove sample data (Makeup, Skincare, Haircare)
3. **Insert new structure** - Add all new categories with correct parent-child relationships
4. **Verify** - Check the structure is correct

## Notes
- Keep 'charmbar' and 'sparkclub' departments untouched
- Only modify 'glam' department
- Use slug format: `glam-spark-my-face`, `glam-star-glitter`, etc.
