import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Button,
  TextField,
  Stack,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export default function ArticleReaderModal({
  article,
  open,
  onClose,
  onLike,
  onAddComment,
}) {
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!article) return null;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    setIsSubmitting(true);
    await onAddComment(article.slug || article.id, commentName, commentText);
    setCommentName('');
    setCommentText('');
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={article.fruitType || 'Berry'} size="small" sx={{ bgcolor: '#A83F52', color: 'white', fontWeight: 700 }} />
          <Chip label={article.category} size="small" sx={{ bgcolor: '#FBE5E7', color: '#A83F52', fontWeight: 600 }} />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2.5, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#34343A', mb: 2, lineHeight: 1.25 }}>
          {article.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={article.author?.avatar} alt={article.author?.name} sx={{ width: 44, height: 44 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {article.author?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {article.author?.role} • {article.readTimeMinutes || 5} min read
            </Typography>
          </Box>
        </Box>

        <Box
          component="img"
          src={article.coverImage}
          alt={article.title}
          sx={{
            width: '100%',
            maxHeight: 380,
            objectFit: 'cover',
            borderRadius: 3,
            mb: 4,
          }}
        />

        <Box sx={{ typography: 'body1', color: '#34343A', lineHeight: 1.8, fontSize: '1.05rem', mb: 4, whiteSpace: 'pre-line' }}>
          {article.content}
        </Box>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
            {article.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ borderColor: '#E8CDAF' }} />
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Engagement Action Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FavoriteIcon />}
            onClick={() => onLike(article.slug || article.id)}
            sx={{ borderRadius: 20 }}
          >
            Helpful ({article.likes || 0})
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#666' }}>
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {article.comments ? article.comments.length : 0} Discussions
            </Typography>
          </Box>
        </Box>

        {/* Comments Section */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: '#FFF8F5', borderRadius: 3, border: '1px solid #F5EAEB' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#A83F52' }}>
            Join the Discussion
          </Typography>

          <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <TextField
                size="small"
                placeholder="Your Name (e.g., Farm Manager, Cashier, Agronomist)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                required
                sx={{ bgcolor: 'white' }}
              />
              <TextField
                multiline
                rows={3}
                placeholder="Share your practical field experience, question, or feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                sx={{ bgcolor: 'white' }}
              />
              <Button type="submit" variant="contained" color="secondary" disabled={isSubmitting} sx={{ alignSelf: 'flex-start' }}>
                Post Comment
              </Button>
            </Stack>
          </Box>

          <Stack spacing={2}>
            {article.comments && article.comments.length > 0 ? (
              article.comments.map((c, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#34343A' }}>
                      {c.authorName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {c.content}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No comments yet. Be the first to share your field insight!
              </Typography>
            )}
          </Stack>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
