import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const FRUIT_TYPES = ['All', 'Strawberry', 'Blueberry', 'Raspberry', 'Blackberry'];

const CATEGORIES = [
  'All',
  'Cold Chain & Storage',
  'Cultivation & Farming',
  'Quality & Grading',
  'Health & Nutrition',
  'Culinary & Recipes',
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedFruit,
  onSelectFruit,
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          placeholder="Search berry insights, cold-chain tips, Brix standards, recipes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          variant="outlined"
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#A83F52' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Fruit Type Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#34343A', mr: 1 }}>
            Fruit:
          </Typography>
          {FRUIT_TYPES.map((fruit) => {
            const isSelected = selectedFruit === fruit;
            return (
              <Chip
                key={fruit}
                label={fruit}
                clickable
                onClick={() => onSelectFruit(fruit)}
                sx={{
                  fontWeight: 600,
                  bgcolor: isSelected ? '#A83F52' : 'white',
                  color: isSelected ? 'white' : '#34343A',
                  border: isSelected ? 'none' : '1px solid #E8CDAF',
                  '&:hover': {
                    bgcolor: isSelected ? '#8A3243' : '#FBE5E7',
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Categories Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#34343A', mr: 1 }}>
            Category:
          </Typography>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => onSelectCategory(cat)}
                sx={{
                  fontWeight: 600,
                  bgcolor: isSelected ? '#879B79' : 'white',
                  color: isSelected ? 'white' : '#66666E',
                  border: isSelected ? 'none' : '1px solid #E0E0E0',
                  '&:hover': {
                    bgcolor: isSelected ? '#6F8361' : '#F5F5F5',
                  },
                }}
              />
            );
          })}
        </Box>
      </Stack>
    </Box>
  );
}
