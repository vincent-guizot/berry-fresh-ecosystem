import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Chip,
  IconButton,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SpaIcon from '@mui/icons-material/Spa';

export default function Navbar({ onOpenNewArticle }) {
  return (
    <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #F2B8C0' }} elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                bgcolor: '#A83F52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 10px rgba(168, 63, 82, 0.3)',
              }}
            >
              <Typography variant="h5" sx={{ lineHeight: 1 }}>🍓</Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#A83F52', letterSpacing: '-0.5px' }}>
                  BERRY FRESH
                </Typography>
                <Chip
                  label="Knowledge Hub"
                  size="small"
                  sx={{
                    bgcolor: '#FBE5E7',
                    color: '#A83F52',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#879B79', fontWeight: 600, display: 'block', mt: -0.5 }}>
                Freshness Connected • Agricultural Insights
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SpaIcon />}
              href="#ecosystem"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Ecosystem
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditNoteIcon />}
              onClick={onOpenNewArticle}
            >
              Write Article
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
