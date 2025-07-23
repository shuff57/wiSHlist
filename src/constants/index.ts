export const DEMO_CREDENTIALS = [
  { email: 'admin@school.edu', password: 'password', name: 'Ms. Johnson', role: 'admin' },
  { email: 'parent@email.com', password: 'password', name: 'Parent User', role: 'supporter' }
];

export const LINK_EXPIRY_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '24', label: '24 hours' },
  { value: '168', label: '1 week' },
  { value: '720', label: '30 days' }
];

export const INITIAL_WISHLIST_ITEMS = [
  {
    id: 1,
    name: 'Colored Pencils Set',
    description: 'Crayola 64-count colored pencils for art projects',
    storeLink: 'https://amazon.com/crayola-colored-pencils',
    cost: '$12.99',
    contributions: 3
  },
  {
    id: 2,
    name: 'Dry Erase Markers',
    description: 'Pack of 12 assorted color whiteboard markers',
    storeLink: 'https://amazon.com/dry-erase-markers',
    cost: '$8.50',
    contributions: 1
  },
  {
    id: 3,
    name: 'Construction Paper',
    description: 'Multi-color construction paper pack (200 sheets)',
    storeLink: 'https://amazon.com/construction-paper',
    cost: '$15.99',
    contributions: 0
  }
];

export const INITIAL_CUSTOM_REQUESTS = [
  {
    id: 1,
    itemName: 'Scientific Calculator',
    description: 'TI-84 Plus for advanced math classes',
    storeLink: 'https://amazon.com/ti-84-calculator',
    estimatedCost: '$89.99',
    status: 'pending' as const,
    requestedBy: 'Sarah M.'
  }
];
