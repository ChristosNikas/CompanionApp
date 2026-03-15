const fs   = require('fs');
const path = require('path');

const CATEGORIES_PATH = path.join(__dirname, 'categories.json');

function loadCategories() {
  try {
    const raw = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
    return JSON.parse(raw).categories;
  } catch (e) {
    console.error('[categories] Failed to load categories.json:', e.message);
    return [];
  }
}

function saveCategories(categories) {
  try {
    fs.writeFileSync(CATEGORIES_PATH, JSON.stringify({ categories }, null, 2));
    return true;
  } catch (e) {
    console.error('[categories] Failed to save categories.json:', e.message);
    return false;
  }
}

function getCategory(appName) {
  const categories = loadCategories();
  const lower = appName.toLowerCase();
  for (const cat of categories) {
    if (cat.apps.some(a => lower.includes(a.toLowerCase()))) {
      return { name: cat.name, color: cat.color };
    }
  }
  return { name: 'Uncategorized', color: '#4a4a5a' };
}

module.exports = { loadCategories, saveCategories, getCategory };