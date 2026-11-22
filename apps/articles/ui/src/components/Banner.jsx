import React from 'react';
import { Box, Typography, Container, Paper, Stack, Chip } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export default function Banner() {
  return (
    <Box sx={{ bgcolor: '#FFF8F5', pt: 6, pb: 4 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #A83F52 0%, #7A2C3A 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -40,
              bottom: -40,
              fontSize: '180px',
              opacity: 0.1,
              userSelect: 'none',
            }}
          >
            🍓
          </Box>

          <Stack spacing={2} sx={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<ThermostatIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                label="Cold Chain Science"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip
                icon={<ScienceIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                label="Brix Sweetness Standards"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip
                icon={<WorkspacePremiumIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                label="FEFO & Traceability"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, fontSize: { xs: '2rem', md: '2.75rem' } }}>
              Berry Fresh Field Insights & AgTech Knowledge
            </Typography>

            <Typography variant="body1" sx={{ color: '#FBE5E7', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Explore proven post-harvest protocols, cold-chain science, cultivation secrets, and culinary standards curated by Berry Fresh agronomists and fruit specialists.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
