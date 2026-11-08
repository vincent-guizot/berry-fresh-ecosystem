const categoriesData = [
  {
    name: 'Cold Chain & Storage',
    slug: 'cold-chain-storage',
    description: 'Best practices for temperature control, humidity management, and post-harvest handling.',
    icon: 'ac_unit',
  },
  {
    name: 'Cultivation & Farming',
    slug: 'cultivation-farming',
    description: 'Soil management, irrigation schedules, pruning, and organic disease prevention.',
    icon: 'agriculture',
  },
  {
    name: 'Quality & Grading',
    slug: 'quality-grading',
    description: 'Brix sweetness measurements, firmness scales, defect classifications, and packing guidelines.',
    icon: 'verified',
  },
  {
    name: 'Health & Nutrition',
    slug: 'health-nutrition',
    description: 'Nutrient profiles, anthocyanin antioxidant benefits, dietary benefits of fresh berries.',
    icon: 'favorite',
  },
  {
    name: 'Culinary & Recipes',
    slug: 'culinary-recipes',
    description: 'Artisanal berry jams, fresh pastry pairings, smoothies, and culinary pairings.',
    icon: 'restaurant_menu',
  },
];

const articlesData = [
  {
    id: '1',
    title: 'The Science of Berry Cold-Chains: From Field to Fork',
    slug: 'science-of-berry-cold-chains',
    excerpt: 'How maintaining a strict 2°C to 4°C cold chain extends berry shelf life from 48 hours to over 10 days.',
    content: `Fresh berries are among the most metabolically active horticultural crops on Earth. Once severed from the mother plant, their respiration rates surge, rapidly depleting sugars and water content.

### Why Temperature Matters
Every 5°C increase in temperature above 2°C doubles respiration rate and reduces marketable shelf life by up to 50%. Immediate forced-air pre-cooling within 2 hours of harvest removes field heat and arrests fungal spore germination.

### Key Cold Chain Parameters
1. **Pre-cooling Target:** 1.5°C to 3.0°C within 120 minutes of morning pick.
2. **Relative Humidity (RH):** Maintain 90%–95% RH to prevent berry shrivel without forming surface water droplets.
3. **Modified Atmosphere Packaging (MAP):** 10%–15% CO2 suppresses Botrytis cinerea gray mold development during transit.

By integrating IoT temperature data loggers in every transport crate, Berry Fresh monitors batch conditions in real time, alerting warehouse managers to temperature excursions before quality suffers.`,
    coverImage: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=1200&q=80',
    category: 'Cold Chain & Storage',
    fruitType: 'Strawberry',
    tags: ['Cold Chain', 'Post-Harvest', 'FEFO', 'Shelf Life'],
    readTimeMinutes: 6,
    author: {
      name: 'Dr. Aris Nugroho',
      role: 'Head Post-Harvest Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    likes: 42,
    views: 380,
    isFeatured: true,
    publishedAt: new Date('2026-10-15'),
    comments: [
      {
        authorName: 'Budi Santoso',
        content: 'Fascinating article! Forced-air cooling really reduced our farm losses.',
        createdAt: new Date('2026-10-16'),
      },
    ],
  },
  {
    id: '2',
    title: 'Brix Sweetness Standards: Grading Grade A vs Grade B Strawberries',
    slug: 'brix-sweetness-grading-standards',
    excerpt: 'Understanding optical refractometer measurements and visual grading criteria for premium fresh strawberries.',
    content: `At Berry Fresh, fruit quality is defined by quantitative metrics rather than subjective opinion. The cornerstone of fruit flavor grading is the Brix scale (°Bx), measuring dissolved sugar solids.

### Brix Tiers for Strawberries
- **Grade A Premium (≥ 9.0° Brix):** Hand-picked at peak deep red coloration, balanced sugar-to-acid ratio (> 10:1), firm skin, zero bruising. Allocated to Berry Fresh Shop and boutique retail.
- **Grade B Standard (7.5° – 8.9° Brix):** Good flavor, minor color variation, firm pulp. Allocated to high-volume retail POS and smoothie bars.
- **Grade C Processing (< 7.5° Brix or slight misshape):** Diverted to jams, purées, and culinary extracts with zero food waste.

Field inspectors test 10 representative berries from every harvest crate using calibrated digital refractometers to establish batch grading within 30 minutes of receiving.`,
    coverImage: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    category: 'Quality & Grading',
    fruitType: 'Strawberry',
    tags: ['Quality', 'Brix', 'Grading', 'Standards'],
    readTimeMinutes: 4,
    author: {
      name: 'Dewi Lestari',
      role: 'Chief Quality Inspector',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
    likes: 29,
    views: 245,
    isFeatured: true,
    publishedAt: new Date('2026-10-22'),
    comments: [],
  },
  {
    id: '3',
    title: 'Highland Blueberry Farming: Soil Acidity and Drip Nutrition',
    slug: 'highland-blueberry-farming-soil-acidity',
    excerpt: 'How maintaining a soil pH between 4.5 and 5.2 unlocks superior blueberry firmness and anthocyanin yield.',
    content: `Blueberries (*Vaccinium corymbosum*) thrive under precise ecological conditions. In tropical highland plateaus above 1,200m altitude, cool nights and intense daytime ultraviolet sunlight create the ideal stress stimulus for high antioxidant production.

### Soil and Water Strategy
1. **Acidic Substrate:** Coir peat mixed with pine bark compost buffered to pH 4.8.
2. **Chelated Micronutrients:** Iron DTPA/EDDHA prevents leaf chlorosis under high sunlight exposure.
3. **Automated Drip Fertigation:** Frequent small fertigation pulses (150-250ml per bush, 4 times daily) keep the root zone oxygenated without root rot.

Our partner highland growers report a 35% higher yield per bush using substrate containers compared to open soil planting.`,
    coverImage: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=1200&q=80',
    category: 'Cultivation & Farming',
    fruitType: 'Blueberry',
    tags: ['Blueberries', 'Agronomy', 'Soil pH', 'Fertigation'],
    readTimeMinutes: 7,
    author: {
      name: 'Wayan Hendra',
      role: 'Agronomy Consultant',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    likes: 58,
    views: 512,
    isFeatured: false,
    publishedAt: new Date('2026-11-01'),
    comments: [],
  },
  {
    id: '4',
    title: 'The Antioxidant Powerhouse: Why Berries Dominate Functional Nutrition',
    slug: 'antioxidant-powerhouse-functional-nutrition',
    excerpt: 'Exploring the cellular benefits of cyanidin, delphinidin, and ellagic acid found abundantly in fresh dark berries.',
    content: `Berries are nature’s concentrated source of polyphenolic antioxidants. The deep reds, purples, and blues reflect dense concentrations of anthocyanins—powerful bioflavonoids studied extensively for cardiovascular and neurological longevity.

### Nutritional Highlights
- **Blackberries:** Abundant in ellagitannins and Vitamin C (over 30mg per 100g serving).
- **Raspberries:** Exceptional dietary fiber (6.5g per 100g) with low glycemic load.
- **Blueberries:** Ranked among the highest in Oxygen Radical Absorbance Capacity (ORAC score).

Consuming a daily 150g portion of fresh mixed berries improves arterial endothelial function and shields cellular membranes from oxidative degradation.`,
    coverImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
    category: 'Health & Nutrition',
    fruitType: 'Blackberry',
    tags: ['Health', 'Antioxidants', 'Nutrition', 'Superfoods'],
    readTimeMinutes: 5,
    author: {
      name: 'Nadia Putri',
      role: 'Clinical Nutritionist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    likes: 83,
    views: 730,
    isFeatured: false,
    publishedAt: new Date('2026-11-04'),
    comments: [],
  },
];

module.exports = { categoriesData, articlesData };
