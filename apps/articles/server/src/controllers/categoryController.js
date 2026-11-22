const Category = require('../models/Category');
const { categoriesData } = require('../data/seedData');
const { getDbStatus } = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    if (getDbStatus()) {
      const categories = await Category.find().sort({ name: 1 });
      if (categories.length > 0) {
        return res.json({ success: true, count: categories.length, data: categories });
      }
    }
    return res.json({ success: true, count: categoriesData.length, data: categoriesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: categoriesData });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (getDbStatus()) {
      const newCategory = await Category.create({ name, slug, description, icon });
      return res.status(201).json({ success: true, data: newCategory });
    }

    const mockCategory = { id: Date.now().toString(), name, slug, description, icon };
    return res.status(201).json({ success: true, data: mockCategory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
