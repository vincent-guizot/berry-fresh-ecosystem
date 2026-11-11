import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import axios from 'axios';
import Navbar from './components/Navbar';
import Banner from './components/Banner';
import FilterBar from './components/FilterBar';
import ArticleCard from './components/ArticleCard';
import ArticleReaderModal from './components/ArticleReaderModal';
import NewArticleModal from './components/NewArticleModal';

const API_BASE = 'http://localhost:5000/api';

const DEFAULT_ARTICLES = [
  {
    id: '1',
    title: 'The Science of Berry Cold-Chains: From Field to Fork',
    slug: 'science-of-berry-cold-chains',
    excerpt: 'How maintaining a strict 2°C to 4°C cold chain extends berry shelf life from 48 hours to over 10 days.',
    content: `Fresh berries are among the most metabolically active horticultural crops on Earth. Once severed from the mother plant, their respiration rates surge, rapidly depleting sugars and water content.

### Why Temperature Matters
Every 5°C increase in temperature above 2°C doubles respiration rate and reduces marketable shelf life by up to 50%. Immediate forced-air pre-cooling within 2 hours of harvest removes field heat and arrests fungal spore germination.

### Key Cold Chain Parameters
1. Pre-cooling Target: 1.5°C to 3.0°C within 120 minutes of morning pick.
2. Relative Humidity (RH): Maintain 90%–95% RH to prevent berry shrivel without forming surface water droplets.
3. Modified Atmosphere Packaging (MAP): 10%–15% CO2 suppresses Botrytis cinerea gray mold development during transit.

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
    comments: [
      {
        authorName: 'Budi Santoso',
        content: 'Fascinating article! Forced-air cooling really reduced our farm losses.',
        createdAt: new Date().toISOString(),
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
- Grade A Premium (≥ 9.0° Brix): Hand-picked at peak deep red coloration, balanced sugar-to-acid ratio (> 10:1), firm skin, zero bruising. Allocated to Berry Fresh Shop and boutique retail.
- Grade B Standard (7.5° – 8.9° Brix): Good flavor, minor color variation, firm pulp. Allocated to high-volume retail POS and smoothie bars.
- Grade C Processing (< 7.5° Brix or slight misshape): Diverted to jams, purées, and culinary extracts with zero food waste.

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
    comments: [],
  },
  {
    id: '3',
    title: 'Highland Blueberry Farming: Soil Acidity and Drip Nutrition',
    slug: 'highland-blueberry-farming-soil-acidity',
    excerpt: 'How maintaining a soil pH between 4.5 and 5.2 unlocks superior blueberry firmness and anthocyanin yield.',
    content: `Blueberries (Vaccinium corymbosum) thrive under precise ecological conditions. In tropical highland plateaus above 1,200m altitude, cool nights and intense daytime ultraviolet sunlight create the ideal stress stimulus for high antioxidant production.

### Soil and Water Strategy
1. Acidic Substrate: Coir peat mixed with pine bark compost buffered to pH 4.8.
2. Chelated Micronutrients: Iron DTPA/EDDHA prevents leaf chlorosis under high sunlight exposure.
3. Automated Drip Fertigation: Frequent small fertigation pulses (150-250ml per bush, 4 times daily) keep the root zone oxygenated without root rot.

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
    comments: [],
  },
  {
    id: '4',
    title: 'The Antioxidant Powerhouse: Why Berries Dominate Functional Nutrition',
    slug: 'antioxidant-powerhouse-functional-nutrition',
    excerpt: 'Exploring the cellular benefits of cyanidin, delphinidin, and ellagic acid found abundantly in fresh dark berries.',
    content: `Berries are nature’s concentrated source of polyphenolic antioxidants. The deep reds, purples, and blues reflect dense concentrations of anthocyanins—powerful bioflavonoids studied extensively for cardiovascular and neurological longevity.

### Nutritional Highlights
- Blackberries: Abundant in ellagitannins and Vitamin C (over 30mg per 100g serving).
- Raspberries: Exceptional dietary fiber (6.5g per 100g) with low glycemic load.
- Blueberries: Ranked among the highest in Oxygen Radical Absorbance Capacity (ORAC score).

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
    comments: [],
  },
];

export default function App() {
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFruit, setSelectedFruit] = useState('All');
  const [activeArticle, setActiveArticle] = useState(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isNewArticleOpen, setIsNewArticleOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedFruit !== 'All') params.fruitType = selectedFruit;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get(`${API_BASE}/articles`, { params, timeout: 2500 });
      if (res.data && res.data.data) {
        setArticles(res.data.data);
      }
    } catch (err) {
      // Fallback filter locally
      let filtered = [...DEFAULT_ARTICLES];
      if (selectedCategory !== 'All') {
        filtered = filtered.filter((a) => a.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      }
      if (selectedFruit !== 'All') {
        filtered = filtered.filter((a) => a.fruitType.toLowerCase() === selectedFruit.toLowerCase());
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
        );
      }
      setArticles(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedFruit, searchQuery]);

  const handleSelectArticle = (article) => {
    setActiveArticle(article);
    setIsReaderOpen(true);
  };

  const handleLike = async (slugOrId) => {
    try {
      await axios.post(`${API_BASE}/articles/${slugOrId}/like`);
    } catch (e) {
      // ignore
    }
    setArticles((prev) =>
      prev.map((a) => (a.slug === slugOrId || a.id === slugOrId ? { ...a, likes: (a.likes || 0) + 1 } : a))
    );
    if (activeArticle && (activeArticle.slug === slugOrId || activeArticle.id === slugOrId)) {
      setActiveArticle((prev) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
    }
    setToastMessage('Marked as helpful! 🍓');
  };

  const handleAddComment = async (slugOrId, authorName, content) => {
    const newComment = {
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    try {
      await axios.post(`${API_BASE}/articles/${slugOrId}/comments`, { authorName, content });
    } catch (e) {
      // local fallback
    }

    setArticles((prev) =>
      prev.map((a) => {
        if (a.slug === slugOrId || a.id === slugOrId) {
          return { ...a, comments: [...(a.comments || []), newComment] };
        }
        return a;
      })
    );
    if (activeArticle) {
      setActiveArticle((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
    }
    setToastMessage('Comment posted successfully! 🌱');
  };

  const handleCreateArticle = async (newArticleData) => {
    try {
      const res = await axios.post(`${API_BASE}/articles`, newArticleData);
      if (res.data && res.data.data) {
        setArticles([res.data.data, ...articles]);
      }
    } catch (e) {
      const mockCreated = {
        ...newArticleData,
        id: Date.now().toString(),
        slug: newArticleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        likes: 0,
        views: 1,
        comments: [],
      };
      setArticles([mockCreated, ...articles]);
    }
    setToastMessage('Article published to Berry Fresh Knowledge Hub! 🍇');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FFF8F5' }}>
      <Navbar onOpenNewArticle={() => setIsNewArticleOpen(true)} />
      <Banner />

      <Container maxWidth="lg" sx={{ py: 5, flexGrow: 1 }}>
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedFruit={selectedFruit}
          onSelectFruit={setSelectedFruit}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : articles.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3, my: 4 }}>
            No articles found matching your criteria. Try adjusting your search or filters.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {articles.map((article) => (
              <Grid item xs={12} sm={6} md={4} key={article.slug || article.id}>
                <ArticleCard
                  article={article}
                  onSelectArticle={handleSelectArticle}
                  onLikeArticle={handleLike}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Ecosystem Connection Section */}
        <Paper
          id="ecosystem"
          elevation={0}
          sx={{
            mt: 8,
            p: 4,
            borderRadius: 4,
            bgcolor: 'white',
            border: '1px solid #E8CDAF',
            textAlign: 'center',
          }}
        >
          <Typography variant="overline" sx={{ color: '#A83F52', fontWeight: 800, letterSpacing: 1.5 }}>
            BERRY FRESH INTEGRATED ECOSYSTEM
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#34343A', mt: 0.5, mb: 1.5 }}>
            Berry Good Business. Freshness Connected.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', mb: 3 }}>
            This educational portal connects seamlessly into the Berry Fresh platform: Core modular monolith, Shop e-commerce, Studio management, and retail POS.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label="Berry Fresh Core (Go / Fiber v3 / Postgres)" variant="outlined" sx={{ borderColor: '#A83F52', color: '#A83F52', fontWeight: 600 }} />
            <Chip label="Berry Fresh Shop (Next.js 15)" variant="outlined" sx={{ borderColor: '#879B79', color: '#879B79', fontWeight: 600 }} />
            <Chip label="Berry Fresh Studio (Vite React)" variant="outlined" sx={{ borderColor: '#34343A', color: '#34343A', fontWeight: 600 }} />
            <Chip label="Berry Fresh POS (Retail Terminal)" variant="outlined" sx={{ borderColor: '#D98291', color: '#D98291', fontWeight: 600 }} />
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#34343A', color: '#FFF8F5', py: 4, mt: 'auto' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#F2B8C0' }}>
            BERRY FRESH
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B8', mt: 0.5 }}>
            © 2026 Berry Fresh Holdings. All rights reserved. Built for agricultural excellence.
          </Typography>
        </Container>
      </Box>

      {/* Modals */}
      <ArticleReaderModal
        article={activeArticle}
        open={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        onLike={handleLike}
        onAddComment={handleAddComment}
      />

      <NewArticleModal
        open={isNewArticleOpen}
        onClose={() => setIsNewArticleOpen(false)}
        onSubmitArticle={handleCreateArticle}
      />

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </Box>
  );
}
