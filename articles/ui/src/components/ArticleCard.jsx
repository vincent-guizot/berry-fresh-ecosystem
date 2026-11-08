import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function ArticleCard({ article, onSelectArticle, onLikeArticle }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={article.coverImage}
          alt={article.title}
          sx={{ objectFit: 'cover' }}
        />
        <Chip
          label={article.fruitType || 'Berry'}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: '#A83F52',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        />
        <Chip
          label={article.category}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            bgcolor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            color: '#34343A',
            fontWeight: 600,
            fontSize: '0.72rem',
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#888' }}>
          <AccessTimeIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {article.readTimeMinutes || 5} min read
          </Typography>
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            mb: 1.5,
            color: '#34343A',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
            mb: 2,
          }}
        >
          {article.excerpt}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto', pt: 1, borderTop: '1px solid #F5EAEB' }}>
          <Avatar
            src={article.author?.avatar}
            alt={article.author?.name}
            sx={{ width: 32, height: 32 }}
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {article.author?.name || 'Berry Fresh Specialist'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {article.author?.role || 'Agronomist'}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onLikeArticle(article.slug || article.id);
            }}
            sx={{ color: '#D98291' }}
          >
            <FavoriteIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
            {article.likes || 0}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, color: '#999' }}>
            <VisibilityIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {article.views || 0}
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          color="primary"
          endIcon={<ArrowForwardIcon />}
          onClick={() => onSelectArticle(article)}
        >
          Read Article
        </Button>
      </CardActions>
    </Card>
  );
}
