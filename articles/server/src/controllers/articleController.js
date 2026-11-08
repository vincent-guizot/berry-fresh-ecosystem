const Article = require('../models/Article');
const { articlesData } = require('../data/seedData');
const { getDbStatus } = require('../config/db');

let memoryArticles = [...articlesData];

exports.getArticles = async (req, res) => {
  try {
    const { category, fruitType, search, tag } = req.query;

    if (getDbStatus()) {
      const query = {};
      if (category && category !== 'All') {
        query.category = new RegExp(category, 'i');
      }
      if (fruitType && fruitType !== 'All') {
        query.fruitType = fruitType;
      }
      if (tag) {
        query.tags = { $in: [tag] };
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ];
      }

      const articles = await Article.find(query).sort({ createdAt: -1 });
      if (articles.length > 0) {
        return res.json({ success: true, count: articles.length, data: articles });
      }
    }

    // In-memory fallback
    let filtered = [...memoryArticles];
    if (category && category !== 'All') {
      filtered = filtered.filter(a => a.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (fruitType && fruitType !== 'All') {
      filtered = filtered.filter(a => a.fruitType.toLowerCase() === fruitType.toLowerCase());
    }
    if (tag) {
      filtered = filtered.filter(a => a.tags && a.tags.includes(tag));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s) || a.content.toLowerCase().includes(s)
      );
    }

    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: memoryArticles });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (getDbStatus()) {
      const article = await Article.findOneAndUpdate(
        { slug },
        { $inc: { views: 1 } },
        { new: true }
      );
      if (article) {
        return res.json({ success: true, data: article });
      }
    }

    const article = memoryArticles.find(a => a.slug === slug || a.id === slug);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    article.views = (article.views || 0) + 1;
    return res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, fruitType, tags, readTimeMinutes, author } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newArticleData = {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
      category: category || 'Cultivation & Farming',
      fruitType: fruitType || 'Strawberry',
      tags: tags || ['Fruit', 'Fresh'],
      readTimeMinutes: Number(readTimeMinutes) || 5,
      author: author || {
        name: 'Berry Fresh Specialist',
        role: 'Agricultural Contributor',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      likes: 0,
      views: 1,
      createdAt: new Date(),
      comments: [],
    };

    if (getDbStatus()) {
      const saved = await Article.create(newArticleData);
      return res.status(201).json({ success: true, data: saved });
    }

    newArticleData.id = Date.now().toString();
    memoryArticles.unshift(newArticleData);
    return res.status(201).json({ success: true, data: newArticleData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.likeArticle = async (req, res) => {
  try {
    const { slug } = req.params;

    if (getDbStatus()) {
      const updated = await Article.findOneAndUpdate(
        { slug },
        { $inc: { likes: 1 } },
        { new: true }
      );
      if (updated) {
        return res.json({ success: true, likes: updated.likes });
      }
    }

    const article = memoryArticles.find(a => a.slug === slug || a.id === slug);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    article.likes = (article.likes || 0) + 1;
    return res.json({ success: true, likes: article.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { authorName, content } = req.body;
    if (!authorName || !content) {
      return res.status(400).json({ success: false, message: 'Author name and comment content are required' });
    }

    const newComment = {
      authorName,
      content,
      createdAt: new Date(),
    };

    if (getDbStatus()) {
      const updated = await Article.findOneAndUpdate(
        { slug },
        { $push: { comments: newComment } },
        { new: true }
      );
      if (updated) {
        return res.status(201).json({ success: true, data: updated.comments });
      }
    }

    const article = memoryArticles.find(a => a.slug === slug || a.id === slug);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    article.comments = article.comments || [];
    newComment._id = Date.now().toString();
    article.comments.push(newComment);
    return res.status(201).json({ success: true, data: article.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
