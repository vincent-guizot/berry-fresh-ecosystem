const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    },
    category: {
      type: String,
      required: true,
      default: 'Cultivation',
    },
    fruitType: {
      type: String,
      enum: ['Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Mixed Berries', 'General Agriculture'],
      default: 'Mixed Berries',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    readTimeMinutes: {
      type: Number,
      default: 5,
    },
    author: {
      name: { type: String, default: 'Berry Fresh Agronomist' },
      role: { type: String, default: 'Senior Fruit Specialist' },
      avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

articleSchema.index({ slug: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ fruitType: 1 });

module.exports = mongoose.model('Article', articleSchema);
