/**
 * Banner & Marketing Data - Extrovat Lifestyle
 */

export const HERO_SLIDES = [
  {
    id: 'hero-1',
    badge: 'Under ৳999',
    headline: 'Artisanal Pure Attars & Luxury Perfumes',
    subtext: 'Discover 100% alcohol-free concentrated fragrance oils crafted for lasting elegance.',
    buttonText: 'Shop Collection',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200',
    alt: 'Luxury fragrance bottle'
  },
  {
    id: 'hero-2',
    badge: 'New Arrival',
    headline: 'Royal Amber & Oud Collection',
    subtext: 'Rich, intoxicating notes of authentic Cambodian Oud and warm golden Amber.',
    buttonText: 'Explore Royal Range',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1200',
    alt: 'Royal Amber perfume bottle'
  },
  {
    id: 'hero-3',
    badge: 'Special Offer',
    headline: 'Elegance Redefined For Everyday Luxury',
    subtext: 'Long-lasting premium perfumes designed to leave an unforgettable sillage.',
    buttonText: 'View Special Offers',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200',
    alt: 'Premium perfume bottle'
  }
];

export const BANNER_SLIDES = [
  {
    id: 'banner-1',
    tag: 'ROYAL ATTAR',
    title: 'Artisanal Pure Attar Oils',
    subtitle: 'Alcohol-free organic botanical extracts',
    badgeTop: 'UP TO',
    badgeBottom: '30% OFF',
    cta: 'Explore Attars',
    action: { type: 'category', value: 'Attar' },
    image: null,
    bgFrom: '#FFF9E6',
    bgTo: '#FFE399'
  },
  {
    id: 'banner-2',
    tag: 'LUXURY PERFUMES',
    title: 'Royal Concentrated Perfumes',
    subtitle: 'Long lasting sillage with French accords',
    badgeTop: 'SAVE',
    badgeBottom: '৳500',
    cta: 'Shop Perfumes',
    action: { type: 'category', value: 'Perfume' },
    image: null,
    bgFrom: '#EEF2FF',
    bgTo: '#C7D2FE'
  },
  {
    id: 'banner-3',
    tag: 'DAILY REFRESH',
    title: 'Ocean & Citrus Body Sprays',
    subtitle: 'All-day freshness for every occasion',
    badgeTop: 'UNDER',
    badgeBottom: '৳999',
    cta: 'View Sprays',
    action: { type: 'category', value: 'Body spray' },
    image: null,
    bgFrom: '#E0F2FE',
    bgTo: '#BAE6FD'
  },
  {
    id: 'banner-4',
    tag: 'GIFT BOXES',
    title: 'Royal Trio Fragrance Gift Sets',
    subtitle: 'Elegantly packaged for loved ones',
    badgeTop: 'FLAT',
    badgeBottom: '৳1,000 OFF',
    cta: 'Find Gifts',
    action: { type: 'category', value: 'Gift sets' },
    image: null,
    bgFrom: '#FDF2F8',
    bgTo: '#FBCFE8'
  },
  {
    id: 'banner-5',
    tag: 'EXCLUSIVE PERK',
    title: 'Free Express Shipping Nationwide',
    subtitle: 'On all orders above ৳2,000 across Bangladesh',
    badgeTop: 'FREE',
    badgeBottom: 'DELIVERY',
    cta: 'Claim Offer',
    action: { type: 'offers', value: 'Offers' },
    image: null,
    bgFrom: '#FEF3C7',
    bgTo: '#FDE68A'
  }
];

export const FLASH_SALE_DATA = {
  badge: 'FLASH SALE',
  title: 'Limited time offers & discounts',
  subtext: 'Special prices on artisanal attars & perfumes',
  durationHours: 8
};

export const WHATSAPP_NUMBER = '8801712345678';

export const WHATSAPP_BANNER_DATA = {
  title: 'Order directly on WhatsApp',
  subtext: 'Speak with our fragrance expert or send your order items directly to WhatsApp',
  buttonText: 'Order via WhatsApp'
};

export const SCENT_QUIZ_QUESTIONS = [
  {
    id: 'note',
    question: '1. What fragrance profile do you prefer most?',
    options: [
      { label: '🌿 Fresh & Marine', value: 'fresh' },
      { label: '🌹 Floral & Sweet Rose', value: 'floral' },
      { label: '🪵 Woody & Resinous Oud', value: 'woody' },
      { label: '🍯 Sweet & Warm Amber', value: 'sweet' }
    ]
  },
  {
    id: 'strength',
    question: '2. How subtle or intense should the scent be?',
    options: [
      { label: 'Subtle & Close to skin', value: 'subtle' },
      { label: 'Moderate all-day presence', value: 'moderate' },
      { label: 'Intense sillage & projection', value: 'intense' }
    ]
  },
  {
    id: 'occasion',
    question: '3. When will you wear this fragrance?',
    options: [
      { label: 'Daily wear & work', value: 'daily' },
      { label: 'Special events & evening', value: 'evening' },
      { label: 'Prayers & spiritual gatherings', value: 'prayer' },
      { label: 'Gift for someone special', value: 'gift' }
    ]
  }
];

export const ANNOUNCEMENT_MESSAGES = [
  '🚚 Free delivery on orders above ৳2000 across Bangladesh',
  '✨ 100% Alcohol-Free Organic Attar & Perfume Oils',
  '🎁 Special Gift Packaging Available on All Orders'
];
