import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CATEGORIES = [
  'Cold Chain & Storage',
  'Cultivation & Farming',
  'Quality & Grading',
  'Health & Nutrition',
  'Culinary & Recipes',
];

const FRUITS = ['Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Mixed Berries', 'General Agriculture'];

export default function NewArticleModal({ open, onClose, onSubmitArticle }) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Cold Chain & Storage',
    fruitType: 'Strawberry',
    tags: 'Cold Chain, Post-Harvest',
    coverImage: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    authorName: 'Berry Fresh Specialist',
    authorRole: 'Field Agronomist',
    readTimeMinutes: 5,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    onSubmitArticle({
      ...formData,
      tags: tagsArray,
      author: {
        name: formData.authorName,
        role: formData.authorRole,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#A83F52' }}>
          Publish New Field Article
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Article Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Fruit Focus"
                name="fruitType"
                value={formData.fruitType}
                onChange={handleChange}
                fullWidth
              >
                {FRUITS.map((fruit) => (
                  <MenuItem key={fruit} value={fruit}>
                    {fruit}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Short Summary / Excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              multiline
              rows={2}
              required
              fullWidth
            />

            <TextField
              label="Full Article Content (Markdown / Text)"
              name="content"
              value={formData.content}
              onChange={handleChange}
              multiline
              rows={6}
              required
              fullWidth
            />

            <TextField
              label="Cover Image URL"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
              <TextField
                label="Tags (comma-separated)"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Read Time (Min)"
                name="readTimeMinutes"
                type="number"
                value={formData.readTimeMinutes}
                onChange={handleChange}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Author Name"
                name="authorName"
                value={formData.authorName}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Author Role"
                name="authorRole"
                value={formData.authorRole}
                onChange={handleChange}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Publish Article
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
