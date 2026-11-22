const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleBySlug,
  createArticle,
  likeArticle,
  addComment,
} = require('../controllers/articleController');

router.get('/', getArticles);
router.post('/', createArticle);
router.get('/:slug', getArticleBySlug);
router.post('/:slug/like', likeArticle);
router.post('/:slug/comments', addComment);

module.exports = router;
