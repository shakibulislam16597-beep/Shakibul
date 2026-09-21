/**
 * Categories Data - Extrovat Lifestyle
 *
 * Ordered tiles (5 cols x 2 rows horizontally scrolling):
 * 1. All
 * 2. Offers
 * 3. Attar
 * 4. Perfume
 * 5. Body spray
 * 6. Oud and agarwood
 * 7. Gift sets
 * 8. Lifestyle
 * 9. Combo offers
 * 10. Under ৳999
 * 11. New arrivals
 * 12. Best sellers
 */

export const CATEGORY_TILES = [
  {
    id: 'all',
    slug: 'all',
    label: 'All',
    filterType: 'all',
    iconName: 'Sparkles',
    bgColor: '#F3F4F6',
    borderColor: '#0E1330'
  },
  {
    id: 'offers',
    slug: 'offers',
    label: 'Offers',
    filterType: 'offers',
    iconName: 'Percent',
    bgColor: '#FEF3C7',
    borderColor: '#0E1330'
  },
  {
    id: 'attar',
    slug: 'attar',
    label: 'Attar',
    filterType: 'category',
    categoryKey: 'Attar',
    iconName: 'Droplet',
    bgColor: '#FFFBEB',
    borderColor: '#0E1330'
  },
  {
    id: 'perfume',
    slug: 'perfume',
    label: 'Perfume',
    filterType: 'category',
    categoryKey: 'Perfume',
    iconName: 'Sparkles',
    bgColor: '#EEF2FF',
    borderColor: '#0E1330'
  },
  {
    id: 'body-spray',
    slug: 'body-spray',
    label: 'Body spray',
    filterType: 'category',
    categoryKey: 'Body Spray',
    iconName: 'Wind',
    bgColor: '#E0F2FE',
    borderColor: '#0E1330'
  },
  {
    id: 'oud-agarwood',
    slug: 'oud-agarwood',
    label: 'Oud and agarwood',
    filterType: 'category',
    categoryKey: 'Oud & Agarwood',
    iconName: 'Flame',
    bgColor: '#FEF2F2',
    borderColor: '#0E1330'
  },
  {
    id: 'gift-sets',
    slug: 'gift-sets',
    label: 'Gift sets',
    filterType: 'category',
    categoryKey: 'Gift Sets',
    iconName: 'Gift',
    bgColor: '#FDF2F8',
    borderColor: '#0E1330'
  },
  {
    id: 'lifestyle',
    slug: 'lifestyle',
    label: 'Lifestyle',
    filterType: 'category',
    categoryKey: 'Lifestyle',
    iconName: 'ShoppingBag',
    bgColor: '#F0FDF4',
    borderColor: '#0E1330'
  },
  {
    id: 'combo-offers',
    slug: 'combo-offers',
    label: 'Combo offers',
    filterType: 'category',
    categoryKey: 'Combo Offers',
    iconName: 'Layers',
    bgColor: '#FFF7ED',
    borderColor: '#0E1330'
  },
  {
    id: 'under-999',
    slug: 'under-999',
    label: 'Under ৳999',
    filterType: 'under999',
    categoryKey: 'Under ৳999',
    iconName: 'Tag',
    bgColor: '#ECFDF5',
    borderColor: '#0E1330'
  },
  {
    id: 'new-arrivals',
    slug: 'new-arrivals',
    label: 'New arrivals',
    filterType: 'new',
    iconName: 'Zap',
    bgColor: '#F5F3FF',
    borderColor: '#0E1330'
  },
  {
    id: 'best-sellers',
    slug: 'best-sellers',
    label: 'Best sellers',
    filterType: 'bestseller',
    iconName: 'Award',
    bgColor: '#FEF9C3',
    borderColor: '#0E1330'
  }
];
